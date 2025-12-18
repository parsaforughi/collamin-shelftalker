// In-memory stats tracker for real-time statistics
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

let stats: StatsData = {
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

export const statsTracker = {
  // Record a successful generation
  recordSuccess(processingTimeMs: number, storyGenerated: boolean = true) {
    stats.totalGenerations++;
    stats.successfulGenerations++;
    stats.totalProcessingTime += processingTimeMs;
    if (storyGenerated) {
      stats.storyImagesGenerated++;
    }
    console.log("✅ Stats: Generation success recorded. Total:", stats.totalGenerations, "Successful:", stats.successfulGenerations);
  },

  // Record a failed generation
  recordFailure() {
    stats.totalGenerations++;
    stats.failedGenerations++;
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
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
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

