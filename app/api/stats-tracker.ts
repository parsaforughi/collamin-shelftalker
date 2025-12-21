// Stats tracker with file-based persistence for real-time statistics
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

interface StatsData {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalProcessingTime: number; // in milliseconds
  storyImagesGenerated: number;
  totalUploads: number;
  totalDownloads: number;
  storyDownloads: number;
  individualImageDownloads: number;
  totalPageViews: number;
  uniqueVisitors: number;
  rejectionCounts: {
    poseMismatch: number;
    lightingMismatch: number;
    artifacts: number;
  };
  deviceBreakdown: {
    ios: number;
    android: number;
    desktop: number;
  };
  downloadByType: {
    withoutCollamin: number;
    withCollamin: number;
    storyComparison: number;
  };
  dailyData: Array<{
    date: string;
    uploads: number;
    generations: number;
    downloads: number;
    storyDownloads: number;
  }>;
  hourlyDownloadData: Record<number, number>; // hour -> count
  lastResetTime: string;
}

const STATS_FILE = join(process.cwd(), ".next", "stats.json");

// Load stats from file or initialize
function loadStats(): StatsData {
  try {
    if (existsSync(STATS_FILE)) {
      const fileData = readFileSync(STATS_FILE, "utf-8");
      const loaded = JSON.parse(fileData);
      // Ensure all fields exist (backward compatibility)
      return {
        totalGenerations: loaded.totalGenerations || 0,
        successfulGenerations: loaded.successfulGenerations || 0,
        failedGenerations: loaded.failedGenerations || 0,
        totalProcessingTime: loaded.totalProcessingTime || 0,
        storyImagesGenerated: loaded.storyImagesGenerated || 0,
        totalUploads: loaded.totalUploads || 0,
        totalDownloads: loaded.totalDownloads || 0,
        storyDownloads: loaded.storyDownloads || 0,
        individualImageDownloads: loaded.individualImageDownloads || 0,
        totalPageViews: loaded.totalPageViews || 0,
        uniqueVisitors: loaded.uniqueVisitors || 0,
        rejectionCounts: loaded.rejectionCounts || {
          poseMismatch: 0,
          lightingMismatch: 0,
          artifacts: 0,
        },
        deviceBreakdown: loaded.deviceBreakdown || {
          ios: 0,
          android: 0,
          desktop: 0,
        },
        downloadByType: loaded.downloadByType || {
          withoutCollamin: 0,
          withCollamin: 0,
          storyComparison: 0,
        },
        dailyData: loaded.dailyData || [],
        hourlyDownloadData: loaded.hourlyDownloadData || {},
        lastResetTime: loaded.lastResetTime || new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
  
  // Return default stats
  return {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalProcessingTime: 0,
    storyImagesGenerated: 0,
    totalUploads: 0,
    totalDownloads: 0,
    storyDownloads: 0,
    individualImageDownloads: 0,
    totalPageViews: 0,
    uniqueVisitors: 0,
    rejectionCounts: {
      poseMismatch: 0,
      lightingMismatch: 0,
      artifacts: 0,
    },
    deviceBreakdown: {
      ios: 0,
      android: 0,
      desktop: 0,
    },
    downloadByType: {
      withoutCollamin: 0,
      withCollamin: 0,
      storyComparison: 0,
    },
    dailyData: [],
    hourlyDownloadData: {},
    lastResetTime: new Date().toISOString(),
  };
}

// Save stats to file
function saveStats(data: StatsData) {
  try {
    // Ensure .next directory exists
    const fs = require("node:fs");
    const dir = join(process.cwd(), ".next");
    if (!existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving stats:", error);
  }
}

// Initialize stats from file
let stats: StatsData = loadStats();

export const statsTracker = {
  // Record a successful generation
  recordSuccess(processingTimeMs: number, storyGenerated: boolean = true) {
    stats.totalGenerations++;
    stats.successfulGenerations++;
    stats.totalProcessingTime += processingTimeMs;
    if (storyGenerated) {
      stats.storyImagesGenerated++;
    }
    // Update daily data
    const today = new Date().toISOString().split('T')[0];
    let dailyEntry = stats.dailyData.find(d => d.date === today);
    if (!dailyEntry) {
      dailyEntry = { date: today, uploads: 0, generations: 0, downloads: 0, storyDownloads: 0 };
      stats.dailyData.push(dailyEntry);
    }
    dailyEntry.generations = stats.totalGenerations;
    saveStats(stats);
    console.log("✅ Stats: Generation success recorded. Total:", stats.totalGenerations, "Successful:", stats.successfulGenerations);
  },

  // Record a failed generation
  recordFailure() {
    stats.totalGenerations++;
    stats.failedGenerations++;
    saveStats(stats);
    console.log("❌ Stats: Generation failure recorded. Total:", stats.totalGenerations, "Failed:", stats.failedGenerations);
  },

  // Record upload event
  recordUpload(userAgent?: string) {
    stats.totalUploads++;
    stats.totalPageViews++;
    console.log("📊 Stats: Upload recorded. Total uploads:", stats.totalUploads);
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad')) {
        stats.deviceBreakdown.ios++;
      } else if (ua.includes('android')) {
        stats.deviceBreakdown.android++;
      } else {
        stats.deviceBreakdown.desktop++;
      }
    }
    // Update daily data
    const today = new Date().toISOString().split('T')[0];
    let dailyEntry = stats.dailyData.find(d => d.date === today);
    if (!dailyEntry) {
      dailyEntry = { date: today, uploads: 0, generations: 0, downloads: 0, storyDownloads: 0 };
      stats.dailyData.push(dailyEntry);
    }
    dailyEntry.uploads++;
    saveStats(stats);
  },

  // Record download event
  recordDownload(type: 'withoutCollamin' | 'withCollamin' | 'storyComparison', userAgent?: string) {
    stats.totalDownloads++;
    stats.downloadByType[type]++;
    
    if (type === 'storyComparison') {
      stats.storyDownloads++;
      const hour = new Date().getHours();
      stats.hourlyDownloadData[hour] = (stats.hourlyDownloadData[hour] || 0) + 1;
    } else {
      stats.individualImageDownloads++;
    }
    
    // Update daily data
    const today = new Date().toISOString().split('T')[0];
    let dailyEntry = stats.dailyData.find(d => d.date === today);
    if (!dailyEntry) {
      dailyEntry = { date: today, uploads: 0, generations: 0, downloads: 0, storyDownloads: 0 };
      stats.dailyData.push(dailyEntry);
    }
    dailyEntry.downloads++;
    if (type === 'storyComparison') {
      dailyEntry.storyDownloads++;
    }
    saveStats(stats);
  },

  // Record page view
  recordPageView() {
    stats.totalPageViews++;
  },

  // Record rejection with reason
  recordRejection(reason: 'poseMismatch' | 'lightingMismatch' | 'artifacts') {
    stats.rejectionCounts[reason]++;
  },

  // Get current stats
  getStats() {
    const averageProcessingTime = stats.totalGenerations > 0
      ? stats.totalProcessingTime / stats.successfulGenerations / 1000 // Convert to seconds
      : 0;

    return {
      totalGenerations: stats.totalGenerations,
      successfulGenerations: stats.successfulGenerations,
      failedGenerations: stats.failedGenerations,
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10, // Round to 1 decimal
      storyImagesGenerated: stats.storyImagesGenerated,
      lastResetTime: stats.lastResetTime,
    };
  },

  // Reload stats from file (in case of external updates)
  reload() {
    stats = loadStats();
  },

  // Get campaign analytics
  getCampaignAnalytics() {
    const averageProcessingTime = stats.totalGenerations > 0
      ? stats.totalProcessingTime / stats.successfulGenerations / 1000
      : 0;

    const conversionRate = stats.totalUploads > 0
      ? (stats.totalDownloads / stats.totalUploads * 100)
      : 0;

    const storyConversionRate = stats.totalUploads > 0
      ? (stats.storyDownloads / stats.totalUploads * 100)
      : 0;

    // Generate daily data for last 7 days
    const dailyData = [];
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find or create daily entry
      let dailyEntry = stats.dailyData.find(d => d.date === dateStr);
      if (!dailyEntry) {
        dailyEntry = { date: dateStr, uploads: 0, generations: 0, downloads: 0, storyDownloads: 0 };
        stats.dailyData.push(dailyEntry);
      }
      dailyData.push(dailyEntry);
    }

    // Generate hourly download data (last 24 hours)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      downloads: stats.hourlyDownloadData[hour] || 0,
    }));

    return {
      overview: {
        totalUploads: stats.totalUploads,
        totalGenerations: stats.totalGenerations,
        storyDownloads: stats.storyDownloads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        storyConversionRate: Math.round(storyConversionRate * 10) / 10,
        avgTimeOnPage: 0, // Would need frontend tracking
        regenerationRate: 0, // Would need frontend tracking
      },
      aiGeneration: {
        withCollamin: stats.successfulGenerations,
        withoutCollamin: stats.successfulGenerations,
        avgGenerationTime: Math.round(averageProcessingTime * 10) / 10,
        successRate: stats.totalGenerations > 0
          ? Math.round((stats.successfulGenerations / stats.totalGenerations) * 100)
          : 0,
        failureRate: stats.totalGenerations > 0
          ? Math.round((stats.failedGenerations / stats.totalGenerations) * 100)
          : 0,
        rejectedOutputs: Object.values(stats.rejectionCounts).reduce((a, b) => a + b, 0),
        rejectionReasons: stats.rejectionCounts,
      },
      userBehavior: {
        funnel: {
          visitors: stats.totalPageViews,
          uploads: stats.totalUploads,
          downloads: stats.totalDownloads,
        },
        downloadBreakdown: {
          individual: stats.individualImageDownloads,
          story: stats.storyDownloads,
        },
        deviceBreakdown: stats.deviceBreakdown,
      },
      storyPerformance: {
        storyDownloads: stats.storyDownloads,
        hourlyTrend: hourlyData,
        dailyTrend: dailyData,
      },
      downloads: {
        byType: stats.downloadByType,
      },
    };
  },

  // Reset stats (optional, for admin use)
  reset() {
    stats = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalProcessingTime: 0,
      storyImagesGenerated: 0,
      totalUploads: 0,
      totalDownloads: 0,
      storyDownloads: 0,
      individualImageDownloads: 0,
      totalPageViews: 0,
      uniqueVisitors: 0,
      rejectionCounts: {
        poseMismatch: 0,
        lightingMismatch: 0,
        artifacts: 0,
      },
      deviceBreakdown: {
        ios: 0,
        android: 0,
        desktop: 0,
      },
      downloadByType: {
        withoutCollamin: 0,
        withCollamin: 0,
        storyComparison: 0,
      },
      dailyData: [],
      hourlyDownloadData: {},
      lastResetTime: new Date().toISOString(),
    };
  },
};

