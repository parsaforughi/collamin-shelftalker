import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------------------- PROMPT ------------------------

const PROMPT = `
You are given a real human portrait photo.

Your task is to age the SAME person exactly 20 years older.

CRITICAL RULES:
- Do NOT change facial identity in any way.
- Do NOT alter face shape, bone structure, eye shape, nose, lips, or proportions.
- Do NOT beautify, stylize, or exaggerate aging.
- Do NOT change hairstyle, hairline, hair color, beard, makeup, or clothing.
- Do NOT add or remove facial features.
- Do NOT change camera angle, framing, or expression.

AGING REQUIREMENTS:
- Apply realistic, natural aging consistent with +20 years:
  - Subtle wrinkles (forehead, eyes, smile lines)
  - Slight skin texture changes
  - Mild loss of skin elasticity
  - Very natural aging signs only
- Aging must look medically realistic, not cinematic or dramatic.

IMAGE STYLE:
- Professional studio portrait
- Clean, neutral background (light gray or soft off-white)
- Even, soft lighting
- High realism, no filters, no artistic effects
- Photographic, clinical accuracy

OUTPUT:
- One final image
- Ultra-realistic
- The person must be immediately recognizable as the same individual
`;

// -------------------- MAIN ROUTE ----------------------

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 /api/generate called");

    const form = await req.formData();
    const userFile = form.get("image");

    if (!(userFile instanceof File)) {
      return NextResponse.json(
        { error: "No user image file" },
        { status: 400 }
      );
    }

    // ---------------- ENV CHECK ----------------

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error("❌ Missing env vars");
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY or NEXT_PUBLIC_BASE_URL" },
        { status: 500 }
      );
    }

    console.log("🔑 API key OK, length:", apiKey.length);

    // ---------------- USER IMAGE ----------------

    const userMime = userFile.type || "image/png";
    const userBase64 = Buffer.from(await userFile.arrayBuffer()).toString("base64");

    // ---------------- GEMINI REQUEST ----------------

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" +
      `?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: userMime, data: userBase64 } }
          ]
        }
      ]
    };

    console.log("📡 Sending to Gemini…");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    console.log("📥 Gemini RAW:", raw.slice(0, 300));

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gemini error", details: raw },
        { status: 500 }
      );
    }

    const json = JSON.parse(raw);

    // ------------- Extract Base64 Output -------------

    let base64Out = null;

    for (const cand of json.candidates || []) {
      for (const part of cand.content?.parts || []) {
        if (part.inlineData?.data) base64Out = part.inlineData.data;
      }
    }

    if (!base64Out) {
      return NextResponse.json(
        { error: "No image returned by Gemini" },
        { status: 500 }
      );
    }

    const outputBuffer = Buffer.from(base64Out, "base64");

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    console.error("🔥 API ERROR:", err);
    return NextResponse.json(
      { error: "Server crashed", details: String(err) },
      { status: 500 }
    );
  }
}