import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage, registerFont } from "canvas";
import { join } from "path";
import { existsSync } from "node:fs";

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

// -------------------- STORY COMPOSITION FUNCTION ----------------------

async function composeStoryComparison(
  withoutCollaminBase64: string,
  withCollaminBase64: string
): Promise<string> {
  // Register Inter font before any canvas operations
  try {
    // Try multiple possible paths for font file (development vs production)
    const possiblePaths = [
      join(process.cwd(), "public", "fonts", "Inter-VariableFont_opsz,wght.ttf"),
      join(process.cwd(), ".next", "static", "fonts", "Inter-VariableFont_opsz,wght.ttf"),
    ];
    
    let fontPath: string | null = null;
    
    for (const pathToTry of possiblePaths) {
      if (existsSync(pathToTry)) {
        fontPath = pathToTry;
        break;
      }
    }
    
    if (fontPath) {
      registerFont(fontPath, { family: "Inter" });
      console.log("✅ Font registered from:", fontPath);
    } else {
      console.warn("⚠️ Could not find font file, text may render with default font");
    }
  } catch (fontError) {
    console.warn("Could not register Inter font:", fontError);
  }

  const width = 1080;
  const height = 1920;
  const halfHeight = height / 2;

  // Load images from base64
  const withoutCollaminBuffer = Buffer.from(withoutCollaminBase64, "base64");
  const withCollaminBuffer = Buffer.from(withCollaminBase64, "base64");

  // Resize images to fit top/bottom halves (maintaining aspect ratio, cropping to center)
  const topImage = await sharp(withoutCollaminBuffer)
    .resize(width, halfHeight, {
      fit: "cover",
      position: "center"
    })
    .toBuffer();

  const bottomImage = await sharp(withCollaminBuffer)
    .resize(width, halfHeight, {
      fit: "cover",
      position: "center"
    })
    .toBuffer();

  // Create background with light medical green/neutral gray
  const background = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 245, g: 250, b: 250 } // Very light neutral gray-green
    }
  })
    .png();

  // Composite images vertically with divider
  const composite = await background
    .composite([
      { input: topImage, top: 0, left: 0 },
      { input: bottomImage, top: halfHeight, left: 0 },
      // Divider line (1px white line)
      {
        input: {
          create: {
            width,
            height: 2,
            channels: 3,
            background: { r: 200, g: 200, b: 200 }
          }
        },
        top: halfHeight - 1,
        left: 0
      }
    ])
    .toBuffer();

  // Load Collamin logo for bottom-right overlays
  let logo: any = null;
  try {
    const fs = await import("fs/promises");
    const logoPath = join(process.cwd(), "public", "collamin.png");
    const logoBuffer = await fs.readFile(logoPath);
    logo = await loadImage(logoBuffer);
  } catch (logoError) {
    console.warn("Could not load logo:", logoError);
  }

  const overlayPadding = 40;
  const logoSize = Math.round(width * 0.051); // ~5.1% of width
  const fontSize = 26;
  
  // Position text
  const topTextY = halfHeight - overlayPadding - logoSize - 25;
  const topTextX = width - overlayPadding;
  const bottomTextY = height - overlayPadding - logoSize - 25;
  const bottomTextX = width - overlayPadding;

  // Use canvas for everything: composite image, text, logo, and rounded corners frame
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw the composite image (without text)
  const compositeImg = await loadImage(composite);
  ctx.drawImage(compositeImg, 0, 0);

  // Draw text directly on canvas (not via sharp composite)
  ctx.save();
  ctx.font = `600 ${fontSize}px "Inter"`; // Inter font with weight 600 (SemiBold)
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // ~80% opacity
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  
  // Draw "Without" text
  ctx.fillText("Without", topTextX, topTextY);
  
  // Draw "With" text
  ctx.fillText("With", bottomTextX, bottomTextY);
  
  ctx.restore();

  // Add logos with white tint using canvas
  if (logo) {
    const topLogoY = halfHeight - overlayPadding - logoSize;
    const topLogoX = width - overlayPadding - logoSize;
    const bottomLogoY = height - overlayPadding - logoSize;
    const bottomLogoX = width - overlayPadding - logoSize;
    
    // Helper function to draw white-tinted logo
    const drawWhiteLogo = (x: number, y: number, size: number, opacity: number) => {
      const tempCanvas = createCanvas(size, size);
      const tempCtx = tempCanvas.getContext("2d");
      
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, size, size);
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(logo, 0, 0, size, size);
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(tempCanvas, x, y);
      ctx.restore();
    };
    
    // Draw top logo
    drawWhiteLogo(topLogoX, topLogoY, logoSize, 0.75);
    
    // Draw bottom logo
    drawWhiteLogo(bottomLogoX, bottomLogoY, logoSize, 0.75);
  }

  // Add rounded corners (soft frame)
  const radius = 20;
  const framePadding = 10;
  ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(framePadding + radius, framePadding);
  ctx.lineTo(width - framePadding - radius, framePadding);
  ctx.quadraticCurveTo(width - framePadding, framePadding, width - framePadding, framePadding + radius);
  ctx.lineTo(width - framePadding, height - framePadding - radius);
  ctx.quadraticCurveTo(width - framePadding, height - framePadding, width - framePadding - radius, height - framePadding);
  ctx.lineTo(framePadding + radius, height - framePadding);
  ctx.quadraticCurveTo(framePadding, height - framePadding, framePadding, height - framePadding - radius);
  ctx.lineTo(framePadding, framePadding + radius);
  ctx.quadraticCurveTo(framePadding, framePadding, framePadding + radius, framePadding);
  ctx.closePath();
  ctx.stroke();

  // Convert canvas to buffer and then to base64
  const finalBuffer = canvas.toBuffer("image/png");
  const finalBase64 = finalBuffer.toString("base64");

  return finalBase64;
}

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

    console.log("📡 Generating both future images…");

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
      return NextResponse.json(
        { 
          error: "Failed to generate one or both images",
          details: generationError || "Unknown error"
        },
        { status: 500 }
      );
    }

    console.log("📥 Both images generated successfully");

    // Compose story comparison image
    console.log("🎨 Composing story comparison image...");
    let storyComparisonBase64: string | null = null;
    
    try {
      storyComparisonBase64 = await composeStoryComparison(
        withoutCollaminBase64,
        withCollaminBase64
      );
      console.log("✅ Story comparison image composed successfully");
    } catch (error: any) {
      console.error("❌ Error composing story image:", error);
      // Don't fail the request if story composition fails
    }

    // Return JSON with all images as base64
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
    return NextResponse.json(
      { error: "Server crashed", details: String(err) },
      { status: 500 }
    );
  }
}