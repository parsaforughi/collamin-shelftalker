import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "iceball-trend-generator",
    timestamp: new Date().toISOString(),
  });
}
