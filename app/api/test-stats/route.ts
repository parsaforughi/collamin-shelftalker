import { NextResponse } from "next/server";
import { statsTracker } from "../stats-tracker";

export async function GET() {
  // Test tracking
  statsTracker.recordUpload();
  statsTracker.recordSuccess(2500, true);
  statsTracker.recordDownload('storyComparison');
  
  const stats = statsTracker.getStats();
  const analytics = statsTracker.getCampaignAnalytics();
  
  return NextResponse.json({
    message: "Test stats recorded",
    stats,
    analytics: {
      overview: analytics.overview,
      aiGeneration: analytics.aiGeneration,
    },
  });
}

