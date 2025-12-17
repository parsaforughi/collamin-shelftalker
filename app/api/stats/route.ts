import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalGenerations: 0,
    successfulGenerations: 0,
    averageProcessingTime: 0,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
