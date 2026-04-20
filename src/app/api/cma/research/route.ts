import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

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
    await adminAuth.verifyIdToken(token);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Set GEMINI_API_KEY in environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { suburb, city, propertyType, bedrooms, bathrooms, floorSize, erfSize } = body;

    if (!suburb || !city) {
      return NextResponse.json({ error: "suburb and city are required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are a South African real estate market research assistant.

Research recent property sales and market data for the following area and property type:

- **Suburb**: ${suburb}
- **City**: ${city}
- **Property Type**: ${propertyType || "house"}
- **Target Bedrooms**: ${bedrooms || 3}
- **Target Bathrooms**: ${bathrooms || 2}
- **Target Floor Size**: ${floorSize || 0} m²
- **Target Erf Size**: ${erfSize || 0} m²

Please provide:

1. **comparables**: An array of 3-5 recent comparable property sales in or near this suburb. For each comparable, provide realistic data based on current South African property market conditions. Use actual suburb names near ${suburb}, ${city}. Prices should be in South African Rand (ZAR).

2. **marketInsights**: A brief market analysis (2-3 paragraphs) covering:
   - Current market conditions in ${suburb}, ${city}
   - Average price trends for ${propertyType || "house"} properties in the area
   - Price per square metre benchmarks
   - Key factors affecting property values in this area (e.g. proximity to schools, transport, security estates)

3. **estimatedPriceRange**: Your estimated price range for a ${bedrooms || 3}-bed ${propertyType || "house"} in ${suburb}, ${city} based on current market data.

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
