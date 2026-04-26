import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { placesLimiter } from "@/lib/rate-limit";

// ─── POST /api/places/resolve ────────────────────────────
// Server-side proxy for Google Places "Place Details" lookups.
//
// Why this exists:
//   1. Keeps the *expensive* Place Details API key server-side (Secret Manager).
//   2. Caches the response in Firestore (collection: `places`) keyed by placeId
//      so repeated lookups for the same address cost zero on the second call.
//   3. Re-uses the existing Firestore-backed rate limiter to cap per-user spend.
//
// Auth: Firebase ID token in Authorization header.
// Body: { placeId: string }
// Response: { placeId, formattedAddress, lat, lng, suburb, city, province, country, postalCode, fromCache }

const PLACES_COLLECTION = "places";
// Google's terms permit caching placeId indefinitely but coords / address
// components only for 30 days. We refresh on read after that window.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface PlaceCacheDoc {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  suburb: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  refreshedAt: Timestamp;
}

interface PlacesApiResponse {
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

/** Pull a typed component out of the addressComponents array. */
function pickComponent(
  components: PlacesApiResponse["addressComponents"],
  type: string,
  prefer: "long" | "short" = "long"
): string {
  const found = components?.find((c) => c.types.includes(type));
  if (!found) return "";
  return prefer === "short" ? found.shortText : found.longText;
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    // Rate limit
    const rateResult = await placesLimiter.check(decoded.uid);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many place lookups. Please slow down." },
        { status: 429, headers: placesLimiter.headers(rateResult) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";

    // Google place IDs are alphanumeric + underscore + dash; cap length.
    if (!placeId || placeId.length > 256 || !/^[A-Za-z0-9_-]+$/.test(placeId)) {
      return NextResponse.json({ error: "Invalid placeId" }, { status: 400 });
    }

    // Firestore cache lookup
    const ref = adminDb.collection(PLACES_COLLECTION).doc(placeId);
    const cached = await ref.get();
    if (cached.exists) {
      const data = cached.data() as PlaceCacheDoc;
      const refreshedAtMs = data.refreshedAt?.toMillis?.() ?? 0;
      if (Date.now() - refreshedAtMs < CACHE_TTL_MS) {
        return NextResponse.json({ ...data, fromCache: true });
      }
    }

    // Cache miss or stale — fetch from Google Places (New) Place Details
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_SERVER_KEY not configured");
      return NextResponse.json(
        { error: "Place lookup is not configured on the server" },
        { status: 503 }
      );
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const fields = ["formattedAddress", "location", "addressComponents"].join(",");
    const apiResp = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fields,
      },
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text().catch(() => "");
      console.error(`[places] Google Places error ${apiResp.status}: ${errText.slice(0, 200)}`);
      return NextResponse.json(
        { error: "Failed to look up place details" },
        { status: 502 }
      );
    }

    const apiData = (await apiResp.json()) as PlacesApiResponse;
    const lat = apiData.location?.latitude ?? 0;
    const lng = apiData.location?.longitude ?? 0;

    const doc: PlaceCacheDoc = {
      placeId,
      formattedAddress: apiData.formattedAddress ?? "",
      lat,
      lng,
      // Suburb in SA addresses is most often returned as `sublocality` or `sublocality_level_1`.
      suburb:
        pickComponent(apiData.addressComponents, "sublocality_level_1") ||
        pickComponent(apiData.addressComponents, "sublocality") ||
        pickComponent(apiData.addressComponents, "neighborhood"),
      city:
        pickComponent(apiData.addressComponents, "locality") ||
        pickComponent(apiData.addressComponents, "administrative_area_level_2"),
      province: pickComponent(apiData.addressComponents, "administrative_area_level_1"),
      country: pickComponent(apiData.addressComponents, "country"),
      postalCode: pickComponent(apiData.addressComponents, "postal_code"),
      refreshedAt: Timestamp.now(),
    };

    await ref.set(
      { ...doc, lookedUpBy: FieldValue.arrayUnion(decoded.uid) },
      { merge: true }
    );

    return NextResponse.json({ ...doc, fromCache: false });
  } catch (error) {
    console.error("Places resolve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
