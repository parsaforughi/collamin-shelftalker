// In-memory stats tracker for real-time statistics
interface StatsData {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalProcessingTime: number; // in milliseconds
  storyImagesGenerated: number;
  lastResetTime: string;
}

let stats: StatsData = {
  totalGenerations: 0,
  successfulGenerations: 0,
  failedGenerations: 0,
  totalProcessingTime: 0,
  storyImagesGenerated: 0,
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
  },

  // Record a failed generation
  recordFailure() {
    stats.totalGenerations++;
    stats.failedGenerations++;
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

  // Reset stats (optional, for admin use)
  reset() {
    stats = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalProcessingTime: 0,
      storyImagesGenerated: 0,
      lastResetTime: new Date().toISOString(),
    };
  },
};

