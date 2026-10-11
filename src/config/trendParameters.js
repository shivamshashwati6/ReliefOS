/**
 * RELIEF-OS Incident Trend Configuration Parameters
 * 
 * Configurable thresholds and classification boundaries for deterministic trend analysis.
 * 
 * STRICT COMPLIANCE:
 * - 100% deterministic rules.
 * - Absolute percentage-point / value change <= threshold is classified as STABLE.
 */

/**
 * Default stability threshold.
 * Any absolute metric difference <= TREND_STABLE_THRESHOLD is considered STABLE.
 */
export const TREND_STABLE_THRESHOLD = 5;

/**
 * Optional granular thresholds by metric category.
 */
export const METRIC_SPECIFIC_THRESHOLDS = Object.freeze({
  totalReports: 0,
  criticalReports: 0,
  highReports: 0,
  criticalZones: 0,
  highPriorityZones: 0,
  highestScore: 0,
  overallCoverage: 5,
  totalUnmet: 0,
  overallProgress: 5,
  publishedUpdates: 0,
  urgentUpdates: 0,
});

/**
 * Metric directionality map:
 * 'LOWER'  -> Lower value indicates operational improvement (e.g., fewer critical zones, less unmet demand).
 * 'HIGHER' -> Higher value indicates operational improvement (e.g., higher resource coverage, greater progress).
 */
export const METRIC_DIRECTION_PREFERENCE = Object.freeze({
  totalReports: 'LOWER',
  criticalReports: 'LOWER',
  highReports: 'LOWER',
  criticalZones: 'LOWER',
  highPriorityZones: 'LOWER',
  highestScore: 'LOWER',
  overallCoverage: 'HIGHER',
  totalUnmet: 'LOWER',
  overallProgress: 'HIGHER',
  publishedUpdates: 'HIGHER',
  urgentUpdates: 'LOWER',
});
