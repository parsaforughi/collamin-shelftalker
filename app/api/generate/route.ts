import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const prompt = `
Winter Korean skincare portrait.
Use exact face identity, keep IceBall as reflection reference only.
Cinematic 9:16, cold daylight, HDR depth, soft snow, photorealistic.
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userFile = formData.get("image");

    if (!(userFile instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    // Read user image
    const userMime = userFile.type || "image/png";
    const userBase64 = Buffer.from(await userFile.arrayBuffer()).toString("base64");

    // Load IceBall ref
    const refRes = await fetch(`${baseUrl}/iceball_ref.png`);
    const refBase64 = Buffer.from(await refRes.arrayBuffer()).toString("base64");

    // Force server User-Agent + disable browser-like headers
    const geminiRequest = {
      model: "gemini-2.5-flash-image",
      prompt,
      size: "1024x1792",
      images: [
        { mimeType: userMime, data: userBase64 },
        { mimeType: "image/png", data: refBase64 }
      ]
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateImage?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Bypass browser detection
          "User-Agent": "Mozilla/5.0 (compatible; Google-Cloud-Functions)",
          "X-Server-Proxy": "true"
        },
        body: JSON.stringify(geminiRequest),
      }
    );

    const raw = await res.text();
    console.log("Gemini RAW:", raw);

    if (!res.ok) {
      return NextResponse.json({ error: raw }, { status: 500 });
    }

    const json = JSON.parse(raw);

    const base64Out =
      json?.candidates?.[0]?.image?.base64Data ||
      json?.image?.base64Data;

    if (!base64Out) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    const buffer = Buffer.from(base64Out, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}