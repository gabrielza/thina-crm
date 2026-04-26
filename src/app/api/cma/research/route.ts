import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";
import { cmaLimiter } from "@/lib/rate-limit";

// Module-level singleton — avoids re-instantiating the SDK on every request.
let _aiClient: GoogleGenAI | undefined;
function getAiClient(apiKey: string): GoogleGenAI {
  if (!_aiClient) {
    _aiClient = new GoogleGenAI({ apiKey });
  }
  return _aiClient;
}

// ─── POST /api/cma/research ─────────────────────────────
// Uses Gemini with Google Search grounding to research comparable property sales
// and market insights for a South African suburb/area.
//
// Auth: Firebase ID token in Authorization header
// Body: { suburb, city, propertyType, bedrooms, bathrooms, floorSize, erfSize }

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    // Rate limit: 10 CMA research requests per minute per user
    const rateResult = await cmaLimiter.check(decoded.uid);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before running more research." },
        { status: 429, headers: cmaLimiter.headers(rateResult) }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Set GEMINI_API_KEY in environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { suburb, city, propertyType, bedrooms, bathrooms, floorSize, erfSize, placeId, lat, lng, formattedAddress } = body;

    if (!suburb || !city) {
      return NextResponse.json({ error: "suburb and city are required" }, { status: 400 });
    }

    // Sanitize user inputs before interpolating into the prompt
    const sanitize = (val: unknown, maxLen = 100): string =>
      String(val ?? "").replace(/[\r\n]+/g, " ").replace(/[<>{}]/g, "").trim().slice(0, maxLen);

    const sSuburb = sanitize(suburb);
    const sCity = sanitize(city);
    const sPropertyType = sanitize(propertyType || "house", 50);
    const sBedrooms = Math.max(0, Math.min(20, Number(bedrooms) || 3));
    const sBathrooms = Math.max(0, Math.min(20, Number(bathrooms) || 2));
    const sFloorSize = Math.max(0, Math.min(99999, Number(floorSize) || 0));
    const sErfSize = Math.max(0, Math.min(99999, Number(erfSize) || 0));

    // Optional geocoding context (from Google Places autocomplete on the client).
    // Bound-check before injecting so a malicious client can't exfiltrate more.
    const sLat = typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : null;
    const sLng = typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : null;
    const sPlaceId = typeof placeId === "string" && /^[A-Za-z0-9_-]{1,256}$/.test(placeId) ? placeId : "";
    const sFormatted = sanitize(formattedAddress, 200);

    const geoBlock = sLat !== null && sLng !== null
      ? `\n\n**Precise location** (use this to find truly nearby comparables, not just ones in the same suburb name):\n- Coordinates: ${sLat.toFixed(6)}, ${sLng.toFixed(6)}\n- Full address: ${sFormatted || `${sSuburb}, ${sCity}`}\n- Google Place ID: ${sPlaceId}\n- Prefer comparable sales within ~2 km of these coordinates.`
      : "";

    const ai = getAiClient(GEMINI_API_KEY);

    const prompt = `You are a South African real estate market research assistant.

Research recent property sales and market data for the following area and property type:

- **Suburb**: ${sSuburb}
- **City**: ${sCity}
- **Property Type**: ${sPropertyType}
- **Target Bedrooms**: ${sBedrooms}
- **Target Bathrooms**: ${sBathrooms}
- **Target Floor Size**: ${sFloorSize} m²
- **Target Erf Size**: ${sErfSize} m²${geoBlock}

Please provide:

1. **comparables**: An array of 3-5 recent comparable property sales in or near this suburb. For each comparable, provide realistic data based on current South African property market conditions. Use actual suburb names near ${sSuburb}, ${sCity}. Prices should be in South African Rand (ZAR).

2. **marketInsights**: A brief market analysis (2-3 paragraphs) covering:
   - Current market conditions in ${sSuburb}, ${sCity}
   - Average price trends for ${sPropertyType} properties in the area
   - Price per square metre benchmarks
   - Key factors affecting property values in this area (e.g. proximity to schools, transport, security estates)

3. **estimatedPriceRange**: Your estimated price range for a ${sBedrooms}-bed ${sPropertyType} in ${sSuburb}, ${sCity} based on current market data.

All prices must be in ZAR. Use realistic South African suburbs and pricing. Today's date is ${new Date().toISOString().split("T")[0]}.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comparables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  address: { type: Type.STRING, description: "Street address of the property" },
                  suburb: { type: Type.STRING, description: "Suburb name" },
                  salePrice: { type: Type.NUMBER, description: "Sale price in ZAR" },
                  saleDate: { type: Type.STRING, description: "Sale date in YYYY-MM-DD format" },
                  bedrooms: { type: Type.NUMBER },
                  bathrooms: { type: Type.NUMBER },
                  erfSize: { type: Type.NUMBER, description: "Erf size in square metres" },
                  floorSize: { type: Type.NUMBER, description: "Floor size in square metres" },
                  propertyType: { type: Type.STRING, description: "house, apartment, townhouse, land, commercial, or farm" },
                  daysOnMarket: { type: Type.NUMBER, description: "Days the property was on market before sale" },
                  notes: { type: Type.STRING, description: "Brief notes about this comparable" },
                },
                required: ["address", "suburb", "salePrice", "saleDate", "bedrooms", "bathrooms", "propertyType", "notes"],
              },
            },
            marketInsights: { type: Type.STRING, description: "2-3 paragraph market analysis" },
            estimatedPriceRange: {
              type: Type.OBJECT,
              properties: {
                low: { type: Type.NUMBER, description: "Low end of estimated price range in ZAR" },
                high: { type: Type.NUMBER, description: "High end of estimated price range in ZAR" },
              },
              required: ["low", "high"],
            },
          },
          required: ["comparables", "marketInsights", "estimatedPriceRange"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "Gemini returned no content" }, { status: 502 });
    }

    const data = JSON.parse(text);

    // Normalize comparables to match CmaComparable interface
    const comparables = (data.comparables || []).map((c: Record<string, unknown>) => ({
      address: String(c.address || ""),
      suburb: String(c.suburb || ""),
      salePrice: Number(c.salePrice) || 0,
      saleDate: String(c.saleDate || new Date().toISOString().split("T")[0]),
      bedrooms: Number(c.bedrooms) || 0,
      bathrooms: Number(c.bathrooms) || 0,
      erfSize: Number(c.erfSize) || 0,
      floorSize: Number(c.floorSize) || 0,
      propertyType: String(c.propertyType || propertyType || "house"),
      daysOnMarket: Number(c.daysOnMarket) || 0,
      notes: String(c.notes || "AI-researched comparable"),
    }));

    return NextResponse.json({
      comparables,
      marketInsights: data.marketInsights || "",
      estimatedPriceRange: data.estimatedPriceRange || { low: 0, high: 0 },
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    console.error("CMA research error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
