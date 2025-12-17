import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

// ---------------------- PROMPTS ------------------------

const PROMPT_WITHOUT_COLLAMIN = `
You are given a real human portrait photo.

Your task is to age the SAME person exactly 20 years older, showing NATURAL skin aging without consistent skincare.

CRITICAL RULES:
- Do NOT change facial identity in any way.
- Do NOT alter face shape, bone structure, eye shape, nose, lips, or proportions.
- Do NOT beautify, stylize, or exaggerate aging.
- Do NOT change hairstyle, hairline, hair color, beard, makeup, or clothing.
- Do NOT add or remove facial features.
- Do NOT change camera angle, framing, or expression.

AGING REQUIREMENTS (Natural, without consistent skincare):
- Apply realistic, natural aging consistent with +20 years:
  - Visible texture loss in skin
  - Deeper fine lines (forehead, eyes, smile lines, around mouth)
  - Reduced skin elasticity
  - More pronounced wrinkles
  - Natural skin aging signs
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
- Show natural skin aging without consistent skincare
`;

const PROMPT_WITH_COLLAMIN = `
You are given a real human portrait photo.

Your task is to age the SAME person exactly 20 years older, showing maintained skin condition WITH consistent high-quality skincare (same age, better maintained skin).

CRITICAL RULES:
- Do NOT change facial identity in any way.
- Do NOT alter face shape, bone structure, eye shape, nose, lips, or proportions.
- Do NOT beautify, stylize, or exaggerate aging.
- Do NOT change hairstyle, hairline, hair color, beard, makeup, or clothing.
- Do NOT add or remove facial features.
- Do NOT change camera angle, framing, or expression.
- Person must be the SAME age (+20 years) as the "without skincare" version.
- Do NOT make the person look younger than 20 years older.
- Do NOT add unrealistic glow or perfect skin.

AGING REQUIREMENTS (WITH consistent skincare):
- Apply realistic aging consistent with +20 years, BUT:
  - Smoother skin texture (better maintained)
  - Better skin elasticity
  - Fewer and less pronounced wrinkles
  - Healthier skin condition
  - Still shows aging (same +20 years), but skin appears better maintained
- NOT younger looking, NOT beautified, NOT glowing unrealistically
- Still medically realistic

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
- Same age as "without skincare" version, but with better maintained skin
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

    if (!apiKey) {
      console.error("❌ Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    console.log("🔑 API key OK, length:", apiKey.length);

    // ---------------- USER IMAGE ----------------

    const userMime = userFile.type || "image/png";
    const userBuffer = await userFile.arrayBuffer();
    const userBase64 = Buffer.from(userBuffer).toString("base64");

    // ---------------- GEMINI SETUP ----------------

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-image-preview"
    });

    console.log("📡 Generating both future images…");

    // Helper function to generate an image
    const generateFutureImage = async (promptText: string): Promise<string | null> => {
      const prompt = [
        { text: promptText },
        {
          inlineData: {
            mimeType: userMime,
            data: userBase64
          }
        }
      ];

      const response = await model.generateContent({
        contents: [{ role: "user", parts: prompt }],
        generationConfig: {
          responseModality: "IMAGE",
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K",
          },
        } as any
      });

      const result = response.response;
      for (const candidate of result.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    };

    // Generate both images
    const [withoutCollaminBase64, withCollaminBase64] = await Promise.all([
      generateFutureImage(PROMPT_WITHOUT_COLLAMIN),
      generateFutureImage(PROMPT_WITH_COLLAMIN)
    ]);

    if (!withoutCollaminBase64 || !withCollaminBase64) {
      return NextResponse.json(
        { error: "Failed to generate one or both images" },
        { status: 500 }
      );
    }

    console.log("📥 Both images generated successfully");

    // Return JSON with both images as base64
    return NextResponse.json({
      originalImage: userBase64,
      futureWithoutCollamin: withoutCollaminBase64,
      futureWithCollamin: withCollaminBase64
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
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