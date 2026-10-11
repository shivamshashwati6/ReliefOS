/**
 * RELIEF-OS Incident Trend Engine
 * 
 * Pure, deterministic module for computing historical snapshots,
 * calculating metric trajectories, and evaluating trend directions.
 * 
 * STRICT COMPLIANCE:
 * - Pure functions with zero side effects.
 * - Does NOT mutate application state or input arrays.
 * - ZERO AI calls — 100% deterministic, explainable calculations.
 * - Adheres strictly to the transparent optimization rules:
 *   LOWER is better: reports, critical zones, high priority zones, unmet demand, urgent updates.
 *   HIGHER is better: resource coverage, response progress.
 *   Absolute change <= threshold is STABLE.
 */

import { validateSnapshot, formatSnapshotId, TREND_DIRECTIONS } from '../models/incidentTrend.js';
import { TREND_STABLE_THRESHOLD, METRIC_SPECIFIC_THRESHOLDS } from '../config/trendParameters.js';

export { TREND_DIRECTIONS };

/**
 * Validates a snapshot entity.
 * Re-exports validateSnapshot for engine consumers.
 */
export { validateSnapshot };

/**
 * Creates an analytical snapshot of the active incident.
 * 
 * @param {Object} metrics - Current analytical metrics object
 * @param {string} [timestamp] - ISO timestamp string
 * @param {Object} [options] - Options (snapshotId, sequence, disasterId)
 * @returns {Object} Validated immutable snapshot
 */
export function createSnapshot(metrics = {}, timestamp = null, options = {}) {
  const ts = timestamp || options.timestamp || new Date().toISOString();
  const disasterId = metrics.disasterId || options.disasterId;
  const snapshotId = options.snapshotId || formatSnapshotId(options.sequence || 1);

  const snapshot = {
    snapshotId,
    disasterId,
    timestamp: ts,
    reports: {
      total: Number(metrics.reports?.total ?? metrics.reports?.totalReports ?? 0),
      critical: Number(metrics.reports?.critical ?? metrics.reports?.criticalReports ?? 0),
      high: Number(metrics.reports?.high ?? metrics.reports?.highReports ?? 0),
    },
    priority: {
      criticalZones: Number(metrics.priority?.criticalZones ?? 0),
      highPriorityZones: Number(metrics.priority?.highPriorityZones ?? 0),
      highestScore: Number(metrics.priority?.highestScore ?? metrics.priority?.highestPriorityScore ?? 0),
    },
    resources: {
      overallCoverage: Number(metrics.resources?.overallCoverage ?? 0),
      totalUnmet: Number(metrics.resources?.totalUnmet ?? 0),
    },
    response: {
      overallProgress: Number(metrics.response?.overallProgress ?? 0),
    },
    safety: {
      publishedUpdates: Number(metrics.safety?.publishedUpdates ?? 0),
      urgentUpdates: Number(metrics.safety?.urgentUpdates ?? 0),
    },
  };

  const validation = validateSnapshot(snapshot);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Snapshot Validation Error: ${firstError}`);
  }

  return Object.freeze(snapshot);
}

/**
 * Sorts snapshots chronologically without mutating input.
 * 
 * @param {Array} snapshots - Array of snapshot objects
 * @param {'asc' | 'desc'} [order='asc'] - 'asc' = oldest first; 'desc' = newest first
 * @returns {Array} Sorted new array
 */
export function sortSnapshots(snapshots = [], order = 'asc') {
  if (!Array.isArray(snapshots)) return [];

  return [...snapshots].sort((a, b) => {
    const timeA = new Date(a?.timestamp || 0).getTime();
    const timeB = new Date(b?.timestamp || 0).getTime();

    if (timeA !== timeB) {
      return order === 'desc' ? timeB - timeA : timeA - timeB;
    }

    const idA = String(a?.snapshotId || '');
    const idB = String(b?.snapshotId || '');
    return order === 'desc' ? idB.localeCompare(idA) : idA.localeCompare(idB);
  });
}

/**
 * Retrieves the latest snapshot from a list.
 * 
 * @param {Array} snapshots - Array of snapshots
 * @returns {Object|null} Latest snapshot or null
 */
export function getLatestSnapshot(snapshots = []) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null;
  const sorted = sortSnapshots(snapshots, 'desc');
  return sorted[0] || null;
}

/**
 * Evaluates the trend direction between a current and previous metric value.
 * 
 * @param {number} current - Current numeric value
 * @param {number} previous - Previous numeric value
 * @param {boolean|Object} [isHigherBetterOrOptions=true] - If boolean: whether higher is better. If object: { isHigherBetter, threshold }
 * @param {number} [threshold=TREND_STABLE_THRESHOLD] - Threshold below which change is considered STABLE
 * @returns {'IMPROVING' | 'WORSENING' | 'STABLE'} Trend direction
 */
export function getTrendDirection(
  current,
  previous,
  isHigherBetterOrOptions = true,
  threshold = TREND_STABLE_THRESHOLD
) {
  if (current === undefined || current === null || previous === undefined || previous === null) {
    return TREND_DIRECTIONS.STABLE;
  }

  let isHigherBetter = true;
  let effectiveThreshold = threshold;

  if (typeof isHigherBetterOrOptions === 'object' && isHigherBetterOrOptions !== null) {
    isHigherBetter = isHigherBetterOrOptions.isHigherBetter !== false;
    if (typeof isHigherBetterOrOptions.threshold === 'number') {
      effectiveThreshold = isHigherBetterOrOptions.threshold;
    }
  } else if (typeof isHigherBetterOrOptions === 'string') {
    isHigherBetter = isHigherBetterOrOptions.toUpperCase() === 'HIGHER';
  } else {
    isHigherBetter = Boolean(isHigherBetterOrOptions);
  }

  const cur = Number(current);
  const prev = Number(previous);

  if (Number.isNaN(cur) || Number.isNaN(prev)) {
    return TREND_DIRECTIONS.STABLE;
  }

  const diff = cur - prev;
  const absDiff = Math.abs(diff);

  if (absDiff <= effectiveThreshold) {
    return TREND_DIRECTIONS.STABLE;
  }

  if (isHigherBetter) {
    return diff > 0 ? TREND_DIRECTIONS.IMPROVING : TREND_DIRECTIONS.WORSENING;
  }

  // LOWER is better:
  return diff < 0 ? TREND_DIRECTIONS.IMPROVING : TREND_DIRECTIONS.WORSENING;
}

/**
 * Generates 3-4 factual, deterministic interpretation statements explaining what changed.
 * Zero AI generation — purely derived from metric diffs.
 * 
 * @param {Object} current - Current snapshot
 * @param {Object} previous - Previous snapshot
 * @param {Object} [options] - Optional custom thresholds
 * @returns {string[]} Array of factual statements
 */
export function generateTrendInterpretation(current, previous, _options = {}) {
  if (!current || !previous) {
    return ['Initial simulation snapshot recorded. Record another snapshot to compare changes.'];
  }

  const statements = [];

  // 1. Resource Coverage (HIGHER is better)
  const curCov = current.resources?.overallCoverage ?? 0;
  const prevCov = previous.resources?.overallCoverage ?? 0;
  if (curCov !== prevCov) {
    if (curCov > prevCov) {
      statements.push(`Resource coverage improved from ${prevCov}% to ${curCov}%.`);
    } else {
      statements.push(`Resource coverage dropped from ${prevCov}% to ${curCov}%.`);
    }
  }

  // 2. Critical Zones (LOWER is better)
  const curCritZones = current.priority?.criticalZones ?? 0;
  const prevCritZones = previous.priority?.criticalZones ?? 0;
  if (curCritZones !== prevCritZones) {
    if (curCritZones < prevCritZones) {
      statements.push(`Critical zones decreased from ${prevCritZones} to ${curCritZones}.`);
    } else {
      statements.push(`Critical zones increased from ${prevCritZones} to ${curCritZones}.`);
    }
  }

  // 3. Response Progress (HIGHER is better)
  const curProg = current.response?.overallProgress ?? 0;
  const prevProg = previous.response?.overallProgress ?? 0;
  if (curProg !== prevProg) {
    if (curProg > prevProg) {
      statements.push(`Response progress increased from ${prevProg}% to ${curProg}%.`);
    } else {
      statements.push(`Response progress decreased from ${prevProg}% to ${curProg}%.`);
    }
  }

  // 4. Urgent Safety Updates (LOWER is better)
  const curUrgent = current.safety?.urgentUpdates ?? 0;
  const prevUrgent = previous.safety?.urgentUpdates ?? 0;
  if (curUrgent !== prevUrgent) {
    if (curUrgent > prevUrgent) {
      statements.push(`Urgent safety updates increased from ${prevUrgent} to ${curUrgent}.`);
    } else {
      statements.push(`Urgent safety updates decreased from ${prevUrgent} to ${curUrgent}.`);
    }
  }

  // 5. Total Emergency Reports (LOWER is better)
  const curReports = current.reports?.total ?? 0;
  const prevReports = previous.reports?.total ?? 0;
  if (curReports !== prevReports) {
    if (curReports < prevReports) {
      statements.push(`Total emergency reports decreased from ${prevReports} to ${curReports}.`);
    } else {
      statements.push(`Total emergency reports increased from ${prevReports} to ${curReports}.`);
    }
  }

  // 6. Unmet Demand (LOWER is better)
  const curUnmet = current.resources?.totalUnmet ?? 0;
  const prevUnmet = previous.resources?.totalUnmet ?? 0;
  if (curUnmet !== prevUnmet) {
    if (curUnmet < prevUnmet) {
      statements.push(`Unmet resource demand decreased from ${prevUnmet.toLocaleString()} to ${curUnmet.toLocaleString()} units.`);
    } else {
      statements.push(`Unmet resource demand increased from ${prevUnmet.toLocaleString()} to ${curUnmet.toLocaleString()} units.`);
    }
  }

  // 7. High Priority Zones (LOWER is better)
  const curHighZones = current.priority?.highPriorityZones ?? 0;
  const prevHighZones = previous.priority?.highPriorityZones ?? 0;
  if (curHighZones !== prevHighZones) {
    if (curHighZones < prevHighZones) {
      statements.push(`High priority zones decreased from ${prevHighZones} to ${curHighZones}.`);
    } else {
      statements.push(`High priority zones increased from ${prevHighZones} to ${curHighZones}.`);
    }
  }

  if (statements.length === 0) {
    return ['Current indicators remain broadly stable.'];
  }

  // Return up to 4 primary factual statements
  return statements.slice(0, 4);
}

/**
 * Calculates comparative trend metrics between two snapshots.
 * 
 * @param {Object} current - Current snapshot
 * @param {Object} [previous] - Previous snapshot
 * @param {Object} [options] - Custom thresholds/configuration
 * @returns {Object} Comparative trend calculation
 */
export function calculateTrend(current, previous = null, options = {}) {
  if (!current) {
    return null;
  }

  const threshold = typeof options.threshold === 'number' ? options.threshold : TREND_STABLE_THRESHOLD;

  if (!previous) {
    return {
      hasComparison: false,
      current,
      previous: null,
      metrics: {
        reports: {
          current: current.reports?.total ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Emergency Reports',
        },
        criticalReports: {
          current: current.reports?.critical ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Critical Reports',
        },
        criticalZones: {
          current: current.priority?.criticalZones ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Critical Zones',
        },
        highPriorityZones: {
          current: current.priority?.highPriorityZones ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'High Priority Zones',
        },
        priorityRisk: {
          current: current.priority?.criticalZones ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Priority Risk',
        },
        resourceCoverage: {
          current: current.resources?.overallCoverage ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: true,
          unit: '%',
          label: 'Resource Coverage',
        },
        totalUnmet: {
          current: current.resources?.totalUnmet ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Unmet Demand',
        },
        responseProgress: {
          current: current.response?.overallProgress ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: true,
          unit: '%',
          label: 'Response Progress',
        },
        urgentUpdates: {
          current: current.safety?.urgentUpdates ?? 0,
          previous: null,
          diff: 0,
          direction: TREND_DIRECTIONS.STABLE,
          isHigherBetter: false,
          label: 'Public Safety Alerts',
        },
      },
      statements: ['One snapshot recorded. Record another snapshot to compare changes.'],
    };
  }

  // Count metrics use countThreshold (defaults to metric-specific threshold: 0 for exact counts).
  // Percentage metrics use pctThreshold (defaults to TREND_STABLE_THRESHOLD: 5).
  const countThreshold = typeof options.countThreshold === 'number' 
    ? options.countThreshold 
    : (options.threshold !== undefined ? options.threshold : (METRIC_SPECIFIC_THRESHOLDS.criticalZones ?? 0));
  const pctThreshold = typeof options.percentageThreshold === 'number' 
    ? options.percentageThreshold 
    : (options.threshold !== undefined ? options.threshold : TREND_STABLE_THRESHOLD);

  const buildMetric = (curVal, prevVal, isHigherBetter, metricThreshold, label, unit = '') => {
    const cur = Number(curVal ?? 0);
    const prev = Number(prevVal ?? 0);
    const diff = cur - prev;
    const direction = getTrendDirection(cur, prev, isHigherBetter, metricThreshold);

    return {
      current: cur,
      previous: prev,
      diff,
      direction,
      isHigherBetter,
      threshold: metricThreshold,
      label,
      unit,
    };
  };

  const metrics = {
    reports: buildMetric(current.reports?.total, previous.reports?.total, false, countThreshold, 'Emergency Reports'),
    criticalReports: buildMetric(current.reports?.critical, previous.reports?.critical, false, countThreshold, 'Critical Reports'),
    criticalZones: buildMetric(current.priority?.criticalZones, previous.priority?.criticalZones, false, countThreshold, 'Critical Zones'),
    highPriorityZones: buildMetric(current.priority?.highPriorityZones, previous.priority?.highPriorityZones, false, countThreshold, 'High Priority Zones'),
    priorityRisk: buildMetric(current.priority?.criticalZones, previous.priority?.criticalZones, false, countThreshold, 'Priority Risk'),
    resourceCoverage: buildMetric(current.resources?.overallCoverage, previous.resources?.overallCoverage, true, pctThreshold, 'Resource Coverage', '%'),
    totalUnmet: buildMetric(current.resources?.totalUnmet, previous.resources?.totalUnmet, false, countThreshold, 'Unmet Demand'),
    responseProgress: buildMetric(current.response?.overallProgress, previous.response?.overallProgress, true, pctThreshold, 'Response Progress', '%'),
    urgentUpdates: buildMetric(current.safety?.urgentUpdates, previous.safety?.urgentUpdates, false, countThreshold, 'Public Safety Alerts'),
  };

  const statements = generateTrendInterpretation(current, previous, options);

  return {
    hasComparison: true,
    current,
    previous,
    metrics,
    statements,
  };
}

/**
 * Filters snapshots for a specific disaster.
 * 
 * @param {Array} snapshots - List of snapshots
 * @param {string} disasterId - Target disaster ID
 * @returns {Array} Filtered list
 */
export function filterSnapshotsByDisaster(snapshots = [], disasterId = null) {
  if (!Array.isArray(snapshots) || !disasterId) return [];
  return snapshots.filter((s) => s?.disasterId === disasterId);
}

/**
 * Formats a short time label for chart axes (e.g. "10:15" or "10:15:30").
 */
function formatTimeLabel(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Compiles a chronological trend series across all recorded snapshots for an incident.
 * 
 * @param {Array} snapshots - Array of snapshots
 * @param {Object} [options] - Options (disasterId, threshold, etc.)
 * @returns {Object} Trend series structure including chart points and latest trend
 */
export function calculateTrendSeries(snapshots = [], options = {}) {
  const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];
  
  const disasterId = options.disasterId;
  const filtered = disasterId 
    ? filterSnapshotsByDisaster(safeSnapshots, disasterId) 
    : safeSnapshots;

  const sorted = sortSnapshots(filtered, 'asc'); // chronological: oldest to newest
  const count = sorted.length;

  if (count === 0) {
    return {
      snapshots: [],
      count: 0,
      latest: null,
      previous: null,
      trend: null,
      chartData: [],
      statements: ['No historical snapshots yet.'],
    };
  }

  const latest = sorted[count - 1];
  const previous = count >= 2 ? sorted[count - 2] : null;
  const trend = calculateTrend(latest, previous, options);

  const chartData = sorted.map((s, idx) => ({
    index: idx + 1,
    snapshotId: s.snapshotId,
    timestamp: s.timestamp,
    timeLabel: formatTimeLabel(s.timestamp),
    totalReports: s.reports?.total ?? 0,
    criticalReports: s.reports?.critical ?? 0,
    highReports: s.reports?.high ?? 0,
    criticalZones: s.priority?.criticalZones ?? 0,
    highPriorityZones: s.priority?.highPriorityZones ?? 0,
    highestScore: s.priority?.highestScore ?? 0,
    overallCoverage: s.resources?.overallCoverage ?? 0,
    totalUnmet: s.resources?.totalUnmet ?? 0,
    overallProgress: s.response?.overallProgress ?? 0,
    publishedUpdates: s.safety?.publishedUpdates ?? 0,
    urgentUpdates: s.safety?.urgentUpdates ?? 0,
  }));

  return {
    snapshots: sorted,
    count,
    latest,
    previous,
    trend,
    chartData,
    statements: trend?.statements || [],
  };
}
