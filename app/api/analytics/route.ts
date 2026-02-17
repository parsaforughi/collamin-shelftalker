import { NextResponse } from "next/server";
import { statsTracker } from "../stats-tracker";

export async function GET() {
  try {
    const analytics = statsTracker.getCampaignAnalytics();
    
    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}









