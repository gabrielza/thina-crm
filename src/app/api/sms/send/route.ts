import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { smsLimiter } from "@/lib/rate-limit";

// ─── BulkSMS API Integration ─────────────────────────────
// Docs: https://www.bulksms.com/developer/json/message/send/
//
// Required env vars:
//   BULKSMS_TOKEN_ID      — BulkSMS API token ID
//   BULKSMS_TOKEN_SECRET  — BulkSMS API token secret
//
// Optional:
//   BULKSMS_BASE_URL      — Override API URL (default: https://api.bulksms.com/v1)

const BULKSMS_BASE_URL = process.env.BULKSMS_BASE_URL || "https://api.bulksms.com/v1";

interface SendSmsRequest {
  to: string;
  body: string;
  contactId?: string;
  leadId?: string;
}

async function sendViaBulkSms(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const tokenId = process.env.BULKSMS_TOKEN_ID;
  const tokenSecret = process.env.BULKSMS_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    return { success: false, error: "BulkSMS credentials not configured" };
  }

  // Normalize SA phone number to international format
  let normalizedTo = to.replace(/\s+/g, "").replace(/[()-]/g, "");
  if (normalizedTo.startsWith("0")) {
    normalizedTo = "+27" + normalizedTo.slice(1);
  }
  if (!normalizedTo.startsWith("+")) {
    normalizedTo = "+" + normalizedTo;
  }

  const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

  try {
    const response = await fetch(`${BULKSMS_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        to: normalizedTo,
        body,
        encoding: "TEXT",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `BulkSMS API error (${response.status}): ${errorText}` };
    }

    const result = await response.json();
    // BulkSMS returns an array of message objects
    const messageId = Array.isArray(result) ? result[0]?.id : result?.id;
    return { success: true, messageId: String(messageId || "") };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── POST /api/sms/send ──────────────────────────────────
// Sends an SMS via BulkSMS and records it in Firestore.
//
// Auth: Firebase ID token in Authorization header
// Body: { to, body, contactId?, leadId? }

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Rate limit: 20 SMS per minute per user
    const rateResult = smsLimiter.check(uid);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before sending more messages." },
        { status: 429, headers: smsLimiter.headers(rateResult) }
      );
    }

    const body: SendSmsRequest = await req.json();

    if (!body.to || !body.body) {
      return NextResponse.json({ error: "to and body are required" }, { status: 400 });
    }

    // Validate body length
    if (body.body.length > 918) {
      return NextResponse.json({ error: "Message too long (max 918 chars / 6 SMS segments)" }, { status: 400 });
    }

    // Send via BulkSMS
    const result = await sendViaBulkSms(body.to, body.body);

    // Record in Firestore
    const smsDoc = {
      to: body.to,
      body: body.body,
      status: result.success ? "sent" : "failed",
      provider: "bulksms",
      providerMessageId: result.messageId || null,
      errorMessage: result.error || null,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      direction: "outbound",
      ownerId: uid,
      sentAt: result.success ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("smsMessages").add(smsDoc);

    if (result.success) {
      return NextResponse.json({
        status: "sent",
        id: docRef.id,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        status: "failed",
        id: docRef.id,
        error: result.error,
      }, { status: 502 });
    }
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/sms/send ───────────────────────────────────
// Returns SMS gateway status

export async function GET() {
  const configured = !!(process.env.BULKSMS_TOKEN_ID && process.env.BULKSMS_TOKEN_SECRET);

  return NextResponse.json({
    provider: "bulksms",
    configured,
    baseUrl: BULKSMS_BASE_URL,
    timestamp: new Date().toISOString(),
  });
}
