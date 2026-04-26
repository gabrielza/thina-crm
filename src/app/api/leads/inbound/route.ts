import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createHmac, timingSafeEqual } from "crypto";
import { inboundLimiter } from "@/lib/rate-limit";

// ─── Email Parsers ───────────────────────────────────────

function parseProperty24(content: string) {
  const name = content.match(/Name:\s*(.+)/i)?.[1]?.trim() || "";
  const email = content.match(/Email:\s*(\S+@\S+)/i)?.[1]?.trim() || "";
  const phone = content.match(/(?:Phone|Tel|Cell|Mobile):\s*([\d\s+()-]+)/i)?.[1]?.trim() || "";
  const propertyRef = content.match(/(?:Ref|Reference|Property ID):\s*(\S+)/i)?.[1]?.trim() || "";
  const propertyAddress = content.match(/(?:Property|Address|Listing):\s*(.+)/i)?.[1]?.trim() || "";
  const message = content.match(/(?:Message|Comment|Enquiry):\s*([\s\S]*?)(?:\n\n|$)/i)?.[1]?.trim() || "";
  return { name, email, phone, propertyRef, propertyAddress, message };
}

function parsePrivateProperty(content: string) {
  // Private Property uses similar email structure
  const name = content.match(/(?:Name|Full Name|Buyer):\s*(.+)/i)?.[1]?.trim() || "";
  const email = content.match(/(?:Email|E-mail):\s*(\S+@\S+)/i)?.[1]?.trim() || "";
  const phone = content.match(/(?:Phone|Tel|Cell|Mobile|Contact):\s*([\d\s+()-]+)/i)?.[1]?.trim() || "";
  const propertyRef = content.match(/(?:Ref|Reference|Listing ID|Property ID):\s*(\S+)/i)?.[1]?.trim() || "";
  const propertyAddress = content.match(/(?:Property|Address|Listing):\s*(.+)/i)?.[1]?.trim() || "";
  const message = content.match(/(?:Message|Comment|Enquiry|Notes):\s*([\s\S]*?)(?:\n\n|$)/i)?.[1]?.trim() || "";
  return { name, email, phone, propertyRef, propertyAddress, message };
}

// ─── HMAC Verification ──────────────────────────────────

function verifyHmac(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ─── POST /api/leads/inbound ─────────────────────────────
// Accepts portal lead injection via webhook or manual POST.
//
// Headers:
//   X-Webhook-Signature: HMAC-SHA256 hex digest (optional, validated if INBOUND_WEBHOOK_SECRET is set)
//
// Body (JSON):
//   { source: "property24" | "private-property" | "manual", content: string, ownerId?: string }
//
// If ownerId is not provided, uses INBOUND_DEFAULT_OWNER_ID env var.

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // HMAC verification — always required
    const webhookSecret = process.env.INBOUND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("INBOUND_WEBHOOK_SECRET is not configured — rejecting request");
      return NextResponse.json({ error: "Webhook endpoint not configured" }, { status: 503 });
    }
    const signature = req.headers.get("X-Webhook-Signature") || "";
    if (!signature || !verifyHmac(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Rate limit: 60 requests/min per webhook source (or forwarded IP fallback).
    const sourceHeader =
      req.headers.get("X-Webhook-Source") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rateResult = await inboundLimiter.check(sourceHeader);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: inboundLimiter.headers(rateResult) }
      );
    }

    let body: { source?: string; content?: string; ownerId?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const source = body.source || "manual";
    const content = body.content || "";
    const ownerId = body.ownerId || process.env.INBOUND_DEFAULT_OWNER_ID;

    if (!content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId or INBOUND_DEFAULT_OWNER_ID is required" }, { status: 400 });
    }

    // Validate source
    const validSources = ["property24", "private-property", "manual"];
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: `Invalid source. Must be one of: ${validSources.join(", ")}` }, { status: 400 });
    }

    // Parse the content
    const parser = source === "private-property" ? parsePrivateProperty : parseProperty24;
    const parsed = parser(content);

    // Check for duplicate (same email + source within last 24 hours)
    if (parsed.email) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const duplicateCheck = await adminDb
        .collection("inboundLeads")
        .where("parsed.email", "==", parsed.email)
        .where("source", "==", source)
        .orderBy("receivedAt", "desc")
        .limit(1)
        .get();

      if (!duplicateCheck.empty) {
        const lastReceived = duplicateCheck.docs[0].data().receivedAt?.toDate();
        if (lastReceived && lastReceived > oneDayAgo) {
          return NextResponse.json({
            status: "duplicate",
            message: "A lead from this email was received within the last 24 hours",
            existingId: duplicateCheck.docs[0].id,
          }, { status: 409 });
        }
      }
    }

    // Create the inbound lead record
    const docRef = await adminDb.collection("inboundLeads").add({
      source,
      rawContent: content,
      parsed,
      status: "pending",
      ownerId,
      receivedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      status: "created",
      id: docRef.id,
      parsed,
      source,
    }, { status: 201 });
  } catch (error) {
    console.error("Inbound lead webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET /api/leads/inbound ──────────────────────────────
// Returns pending inbound lead count (health check for monitoring)

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("inboundLeads")
      .where("status", "==", "pending")
      .count()
      .get();

    return NextResponse.json({
      pendingCount: snapshot.data().count,
      timestamp: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "private, max-age=10" },
    });
  } catch (error) {
    console.error("Inbound lead GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
