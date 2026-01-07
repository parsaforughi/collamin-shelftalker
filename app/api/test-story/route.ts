import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage, registerFont } from "canvas";
import { join } from "path";
import { existsSync } from "node:fs";

export const runtime = "nodejs";

// -------------------- STORY COMPOSITION FUNCTION (TEST VERSION) ----------------------

async function composeStoryComparison(
  withoutCollaminBuffer: Buffer,
  withCollaminBuffer: Buffer
): Promise<string> {
  // Register Inter font before any canvas operations
  try {
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
  const logoSize = Math.round(width * 0.22); // ~22% of width (larger, more prominent)
  const fontSize = 38; // Increased font size for better visibility
  
  // Position logo (left side, bottom of bottom half only)
  const logoX = overlayPadding; // Left side padding
  const bottomLogoY = height - overlayPadding - logoSize; // Bottom of image, above padding
  
  // Position text (bottom left of each half)
  const textX = overlayPadding; // Left aligned
  const topTextY = halfHeight - overlayPadding - fontSize - 10; // Bottom of top half
  const bottomTextY = bottomLogoY - fontSize - 20; // Above the logo in bottom half

  // Use canvas for everything: composite image, text, logo, and rounded corners frame
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw the composite image (without text)
  const compositeImg = await loadImage(composite);
  ctx.drawImage(compositeImg, 0, 0);

  // Draw text directly on canvas - elegant and refined
  ctx.save();
  ctx.font = `400 ${fontSize}px "Inter"`; // Inter font with weight 400 (regular, more refined)
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"; // Higher opacity for better visibility
  ctx.textAlign = "left"; // Left aligned
  ctx.textBaseline = "top";
  
  // Add text shadow for better visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  // Draw "Without" text (bottom left of top half, no logo)
  ctx.fillText("Without", textX, topTextY);
  
  // Draw "With" text (bottom left of bottom half, above logo)
  ctx.fillText("With", textX, bottomTextY);
  
  ctx.restore();

  // Add logo with clean, minimal style (bottom half only)
  if (logo) {
    // Just draw the logo with a subtle shadow - no background box
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // Draw white-tinted logo
    const tempCanvas = createCanvas(logoSize, logoSize);
    const tempCtx = tempCanvas.getContext("2d");
    
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, logoSize, logoSize);
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(logo, 0, 0, logoSize, logoSize);
    
    ctx.drawImage(tempCanvas, logoX, bottomLogoY);
    ctx.restore();
  }

  // Add rounded corners (soft, thin frame - elegant for mobile)
  const radius = 20;
  const framePadding = 8; // Reduced padding for cleaner look
  ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"; // More subtle, refined
  ctx.lineWidth = 1; // Thinner line for elegant look on mobile
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

// Create mock portrait images for testing
async function createMockImage(color: { r: number; g: number; b: number }, label: string): Promise<Buffer> {
  const width = 800;
  const height = 1200; // Portrait 2:3 ratio
  
  // Create gradient background
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Create a gradient from top to bottom
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgb(${color.r + 30}, ${color.g + 30}, ${color.b + 30})`);
  gradient.addColorStop(1, `rgb(${color.r - 30}, ${color.g - 30}, ${color.b - 30})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add some visual elements (circles to simulate face area)
  ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.35, 200, 0, Math.PI * 2);
  ctx.fill();
  
  // Add label text
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, height * 0.7);
  
  return canvas.toBuffer("image/png");
}

// -------------------- MAIN ROUTE ----------------------

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 /api/test-story called - generating mock story...");

    // Create mock images with different colors
    const withoutMock = await createMockImage(
      { r: 180, g: 140, b: 140 }, // Warm, slightly aged tone
      "بدون کلامین"
    );
    
    const withMock = await createMockImage(
      { r: 160, g: 200, b: 180 }, // Fresh, healthy tone
      "با کلامین"
    );

    // Compose story comparison image
    console.log("🎨 Composing test story comparison image...");
    const storyComparisonBase64 = await composeStoryComparison(
      withoutMock,
      withMock
    );
    console.log("✅ Test story image composed successfully");

    // Return JSON with the test story image
    return NextResponse.json({
      storyComparison: storyComparisonBase64,
      message: "Test story generated successfully"
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    console.error("🔥 TEST API ERROR:", err);
    return NextResponse.json(
      { error: "Server crashed", details: String(err) },
      { status: 500 }
    );
  }
}

