import { NextResponse } from "next/server";
import { statsTracker } from "../stats-tracker";

export async function GET() {
  const stats = statsTracker.getStats();
  
  return NextResponse.json({
    ...stats,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
