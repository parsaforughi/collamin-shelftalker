import { NextRequest, NextResponse } from "next/server";
import { statsTracker } from "../stats-tracker";

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

POSE & POSITION LOCK (CRITICAL):
The generated image MUST be an exact spatial and visual match to the reference image.

ABSOLUTE REQUIREMENTS:
- Identical head position
- Identical face angle
- Identical facial expression
- Identical camera angle and distance
- Identical framing and crop
- Identical background
- Identical lighting direction and intensity

ONLY ALLOWED DIFFERENCES:
- Skin texture and quality
- Wrinkles and fine lines
- Skin elasticity
- Very subtle, natural aging-related hair changes

NOT ALLOWED:
- Any pose change
- Any face orientation change
- Any background change
- Any lighting change
- Any camera or crop change

If any mismatch occurs, regenerate until outputs are perfectly aligned.
The comparison must be pixel-aligned.
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

POSE & POSITION LOCK (CRITICAL):
The generated image MUST be an exact spatial and visual match to the reference image.

ABSOLUTE REQUIREMENTS:
- Identical head position
- Identical face angle
- Identical facial expression
- Identical camera angle and distance
- Identical framing and crop
- Identical background
- Identical lighting direction and intensity

ONLY ALLOWED DIFFERENCES:
- Skin texture and quality
- Wrinkles and fine lines
- Skin elasticity
- Very subtle, natural aging-related hair changes

NOT ALLOWED:
- Any pose change
- Any face orientation change
- Any background change
- Any lighting change
- Any camera or crop change

If any mismatch occurs, regenerate until outputs are perfectly aligned.
The comparison must be pixel-aligned.
`;

// -------------------- NANO BANANA STORY GENERATION PROMPT ----------------------

const NANO_BANANA_STORY_PROMPT = `You are given two reference images of the same person:

1) Image A: 20 years later WITHOUT Collamin
2) Image B: 20 years later WITH Collamin

These references are STRICT.

Your task is to generate a FINAL Instagram Story image.

REQUIREMENTS:
- Aspect ratio: 9:16
- Top half uses Image A
- Bottom half uses Image B
- Same scale and alignment
- Clean horizontal divider

Branding:
- Add the word 'Without' in the bottom-right of the top half
- Add the word 'With' in the bottom-right of the bottom half
- Below each word, add a small white Collamin logo

STRICT RULES:
- Do NOT change face identity
- Do NOT change pose or expression
- Do NOT change aging differences
- Do NOT beautify or retouch
- Do NOT add effects or filters
- Do NOT add any elements except text and logo

Style:
- Minimal
- Medical
- Trustworthy
- Instagram-ready

Output ONE image only.`;

// -------------------- NANO BANANA STORY GENERATION FUNCTION ----------------------

async function generateStoryWithNanoBanana(
  futureWithoutCollaminBase64: string,
  futureWithCollaminBase64: string,
  apiKey: string
): Promise<string | null> {
  console.log("🍌 [NanoBanana] Starting story generation...");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: NANO_BANANA_STORY_PROMPT },
          // Image A: Without Collamin (for top half)
          {
            inlineData: {
              mimeType: "image/png",
              data: futureWithoutCollaminBase64
            }
          },
          // Image B: With Collamin (for bottom half)
          {
            inlineData: {
              mimeType: "image/png",
              data: futureWithCollaminBase64
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [NanoBanana] API error:", response.status, errorText);
      return null;
    }

    const result = await response.json();

    // Extract base64 image from response
    for (const candidate of result.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          console.log("✅ [NanoBanana] Story generation successful");
          return part.inlineData.data;
        }
      }
    }

    console.warn("⚠️ [NanoBanana] No image returned from API");
    return null;
  } catch (error: any) {
    console.error("❌ [NanoBanana] Error:", error?.message || error);
    return null;
  }
}

// -------------------- MAIN ROUTE ----------------------

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 /api/generate called");
    
    // Track upload
    const userAgent = req.headers.get("user-agent") || undefined;
    statsTracker.recordUpload(userAgent);
    console.log("📊 After upload, current stats:", JSON.stringify({
      totalUploads: statsTracker.getCampaignAnalytics().overview.totalUploads,
      totalGenerations: statsTracker.getStats().totalGenerations,
    }));

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

    console.log("📡 Generating both future images…");
    const startTime = Date.now();

    // Helper function to generate an image using REST API
    const generateFutureImage = async (promptText: string): Promise<string | null> => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: userMime,
                  data: userBase64
                }
              }
            ]
          }
        ]
      };

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Gemini API error:", response.status, errorText);
          throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const result = await response.json();

        // Extract base64 image from response
        for (const candidate of result.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.inlineData?.data) {
              return part.inlineData.data;
            }
          }
        }
        return null;
      } catch (error: any) {
        console.error("❌ Error calling Gemini API:", error?.message || error);
        throw error;
      }
    };

    // Generate both images
    let withoutCollaminBase64: string | null = null;
    let withCollaminBase64: string | null = null;
    let generationError: string | null = null;

    try {
      const results = await Promise.allSettled([
        generateFutureImage(PROMPT_WITHOUT_COLLAMIN),
        generateFutureImage(PROMPT_WITH_COLLAMIN)
      ]);

      if (results[0].status === "fulfilled") {
        withoutCollaminBase64 = results[0].value;
        console.log("✅ Without Collamin image generated:", withoutCollaminBase64 ? "SUCCESS" : "NULL");
      } else {
        console.error("❌ Without Collamin generation failed:", results[0].reason);
        generationError = `Without Collamin failed: ${results[0].reason?.message || String(results[0].reason)}`;
      }

      if (results[1].status === "fulfilled") {
        withCollaminBase64 = results[1].value;
        console.log("✅ With Collamin image generated:", withCollaminBase64 ? "SUCCESS" : "NULL");
      } else {
        console.error("❌ With Collamin generation failed:", results[1].reason);
        generationError = generationError 
          ? `${generationError}; With Collamin failed: ${results[1].reason?.message || String(results[1].reason)}`
          : `With Collamin failed: ${results[1].reason?.message || String(results[1].reason)}`;
      }
    } catch (error: any) {
      console.error("❌ Generation error:", error);
      generationError = error?.message || String(error);
    }

    if (!withoutCollaminBase64 || !withCollaminBase64) {
      // Track failure
      statsTracker.recordFailure();
      
      return NextResponse.json(
        { 
          error: "Failed to generate one or both images",
          details: generationError || "Unknown error"
        },
        { status: 500 }
      );
    }

    console.log("📥 Both images generated successfully");

    // -------------------- NANO BANANA STORY GENERATION --------------------
    // Nano Banana fully owns story image generation
    // Code acts only as orchestrator - no canvas/sharp composition
    
    console.log("🍌 Generating story with Nano Banana...");
    let storyComparisonBase64: string | null = null;
    
    try {
      storyComparisonBase64 = await generateStoryWithNanoBanana(
        withoutCollaminBase64,
        withCollaminBase64,
        apiKey
      );
      
      if (storyComparisonBase64) {
        console.log("✅ Story generated by Nano Banana successfully");
      } else {
        console.error("❌ Nano Banana story generation returned null");
      }
    } catch (error: any) {
      console.error("❌ Error in Nano Banana story generation:", error);
    }

    // Calculate processing time and track success
    const processingTimeMs = Date.now() - startTime;
    const storyGenerated = storyComparisonBase64 !== null;
    console.log("⏱️ Processing time:", processingTimeMs, "ms");
    console.log("📊 Story generated:", storyGenerated);
    statsTracker.recordSuccess(processingTimeMs, storyGenerated);
    console.log("✅ Success tracked. Current stats:", JSON.stringify(statsTracker.getStats()));

    // Return JSON with all images as base64
    // storyComparison: Generated entirely by Nano Banana (the ONLY image for sharing)
    return NextResponse.json({
      originalImage: userBase64,
      futureWithoutCollamin: withoutCollaminBase64,
      futureWithCollamin: withCollaminBase64,
      storyComparison: storyComparisonBase64
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    console.error("🔥 API ERROR:", err);
    // Track failure for unexpected errors
    statsTracker.recordFailure();
    
    return NextResponse.json(
      { error: "Server crashed", details: String(err) },
      { status: 500 }
    );
  }
}
