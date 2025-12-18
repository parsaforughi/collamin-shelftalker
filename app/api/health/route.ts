import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "collamin-shelftalker",
    timestamp: new Date().toISOString(),
  });
}
