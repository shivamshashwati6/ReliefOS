/**
 * RELIEF-OS Incident Analytics Engine
 * 
 * Pure, deterministic analytics computation module for the Command Center.
 * 
 * STRICT COMPLIANCE:
 * - Pure functions with zero side effects.
 * - Does NOT call Gemini or external APIs.
 * - Does NOT mutate application state, inventories, allocations, or plans.
 * - Consumes existing verified data from Priority, Demand, Allocation, Monitoring, and Safety contexts.
 * - Transparent, explainable calculations with zero fabricated data.
 */

import { isUpdateActive, UPDATE_STATUS, UPDATE_SEVERITY } from '../models/safetyUpdate.js';

/**
 * Extracts normalized severity string ('Critical' | 'High' | 'Medium' | 'Low' | null) from a report.
 */
export function extractReportSeverity(report) {
  if (!report) return null;
  const raw = report.aiAnalysis?.severity || report.severity || report.aiAnalysis?.incident_severity;
  if (!raw) return null;

  const s = String(raw).trim().toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'high') return 'High';
  if (s === 'medium') return 'Medium';
  if (s === 'low') return 'Low';
  return null;
}

/**
 * Deterministically calculates emergency report metrics.
 * 
 * @param {Array} reports - List of report objects
 * @returns {Object} Report analytics summary
 */
export function calculateReportAnalytics(reports = []) {
  const safeReports = Array.isArray(reports) ? reports : [];

  let criticalReports = 0;
  let highReports = 0;
  let mediumReports = 0;
  let lowReports = 0;
  let pendingReports = 0;
  let processedReports = 0;

  safeReports.forEach(r => {
    const sev = extractReportSeverity(r);
    if (sev === 'Critical') criticalReports++;
    else if (sev === 'High') highReports++;
    else if (sev === 'Medium') mediumReports++;
    else if (sev === 'Low') lowReports++;

    const isProcessed = r.status === 'Processed' || r.aiProcessed === true;
    if (isProcessed) {
      processedReports++;
    } else {
      pendingReports++;
    }
  });

  return {
    totalReports: safeReports.length,
    pendingReports,
    processedReports,
    criticalReports,
    highReports,
    mediumReports,
    lowReports,
  };
}

/**
 * Deterministically calculates zone priority analytics from existing ZoneContext data.
 * Does NOT recalculate priority scores; uses existing scores as single source of truth.
 * 
 * @param {Array} zones - List of computed zone objects
 * @returns {Object} Priority analytics summary
 */
export function calculatePriorityAnalytics(zones = []) {
  const safeZones = Array.isArray(zones) ? zones : [];

  let criticalZones = 0;
  let highPriorityZones = 0;
  let mediumPriorityZones = 0;
  let lowPriorityZones = 0;

  const formattedZones = safeZones.map(z => {
    const score = Number(z.priority?.score ?? z.priorityScore ?? 0);
    const band = z.priority?.band || z.priorityBand || (score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low');

    if (score >= 85 || band.toLowerCase() === 'critical') criticalZones++;
    else if (score >= 70 || band.toLowerCase() === 'high') highPriorityZones++;
    else if (score >= 50 || band.toLowerCase() === 'medium') mediumPriorityZones++;
    else lowPriorityZones++;

    return {
      id: z.id || z.zoneId,
      name: z.name || z.zoneName || z.id,
      fullName: z.fullName || z.name || z.id,
      priorityScore: score,
      priorityBand: band,
      affectedPopulation: z.affectedPopulation || z.population || 0,
      medicalRisk: z.baselineMedicalRisk ?? z.medicalRisk ?? 0,
      resourceShortage: z.baselineShortage ?? z.shortage ?? 0,
      accessStatus: z.accessStatus || 'Normal',
      keyIssue: z.keyIssue || 'Emergency Response Zone',
    };
  });

  // Deterministic sorting: 1) priorityScore descending, 2) id ascending tie-break
  const sortedZones = [...formattedZones].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return String(a.id).localeCompare(String(b.id));
  });

  const highestPriorityZone = sortedZones[0] || null;
  const highestPriorityScore = highestPriorityZone ? highestPriorityZone.priorityScore : 0;

  return {
    totalZones: safeZones.length,
    criticalZones,
    highPriorityZones,
    mediumPriorityZones,
    lowPriorityZones,
    highestPriorityZone,
    highestPriorityScore,
    sortedZones,
  };
}

/**
 * Deterministically calculates resource demand, allocation, and coverage.
 * Supported resources: food, water, rescueBoats, medicalTeams.
 * Medicine remains categorical and is not converted to fake numerical quantities.
 * 
 * @param {Array} allocations - List of allocation objects from AllocationContext
 * @param {Object} [aggregateTotals] - Optional { totalRequested, totalAllocated, unmetDemand }
 * @returns {Object} Resource analytics summary
 */
export function calculateResourceAnalytics(allocations = [], aggregateTotals = null) {
  const safeAllocations = Array.isArray(allocations) ? allocations : [];

  const resourceDefinitions = [
    { key: 'food', name: 'Food Kits', unit: 'kits' },
    { key: 'water', name: 'Water Units', unit: 'units' },
    { key: 'rescueBoats', name: 'Rescue Boats', unit: 'boats' },
    { key: 'medicalTeams', name: 'Medical Teams', unit: 'teams' },
  ];

  const resourceMap = {};
  resourceDefinitions.forEach(r => {
    resourceMap[r.key] = {
      key: r.key,
      name: r.name,
      unit: r.unit,
      requested: 0,
      allocated: 0,
      unmet: 0,
      coverage: 0,
    };
  });

  // Aggregate from allocations list
  safeAllocations.forEach(item => {
    const key = item.resource;
    if (resourceMap[key]) {
      const req = Number(item.requested) || 0;
      const alloc = Number(item.allocated) || 0;
      resourceMap[key].requested += req;
      resourceMap[key].allocated += alloc;
    }
  });

  // If aggregate totals provided from context, reconcile to guarantee exact alignment
  if (aggregateTotals?.totalRequested) {
    Object.keys(aggregateTotals.totalRequested).forEach(k => {
      if (resourceMap[k] && aggregateTotals.totalRequested[k] !== undefined) {
        resourceMap[k].requested = aggregateTotals.totalRequested[k];
      }
    });
  }
  if (aggregateTotals?.totalAllocated) {
    Object.keys(aggregateTotals.totalAllocated).forEach(k => {
      if (resourceMap[k] && aggregateTotals.totalAllocated[k] !== undefined) {
        resourceMap[k].allocated = aggregateTotals.totalAllocated[k];
      }
    });
  }

  let totalRequested = 0;
  let totalAllocated = 0;
  let totalUnmet = 0;

  const resourceBreakdown = resourceDefinitions.map(r => {
    const data = resourceMap[r.key];
    const unmet = Math.max(0, data.requested - data.allocated);
    data.unmet = unmet;

    // Coverage formula: allocated / requested * 100, clamped 0-100. If requested <= 0, coverage = 100.
    const coverage = data.requested <= 0
      ? 100
      : Math.min(100, Math.max(0, Math.round((data.allocated / data.requested) * 100)));
    data.coverage = coverage;

    totalRequested += data.requested;
    totalAllocated += data.allocated;
    totalUnmet += unmet;

    return data;
  });

  const overallCoverage = totalRequested <= 0
    ? 100
    : Math.min(100, Math.max(0, Math.round((totalAllocated / totalRequested) * 100)));

  return {
    totalRequested,
    totalAllocated,
    totalUnmet,
    overallCoverage,
    resources: resourceBreakdown,
  };
}

/**
 * Deterministically extracts response monitoring analytics.
 * Uses existing calculated overallProgress without re-computation.
 * 
 * @param {Object} monitoringRecord - Monitoring object from ResponseMonitoringContext
 * @returns {Object} Response monitoring analytics
 */
export function calculateResponseAnalytics(monitoringRecord = null) {
  if (!monitoringRecord) {
    return {
      hasMonitoring: false,
      status: null,
      overallProgress: 0,
      zonesInProgress: 0,
      completedZones: 0,
      totalZonesMonitored: 0,
      remainingWork: 0,
      message: 'No approved response plan is currently being monitored.',
    };
  }

  const zoneProgress = monitoringRecord.zoneProgress || [];
  let zonesInProgress = 0;
  let completedZones = 0;

  zoneProgress.forEach(z => {
    if (z.status === 'COMPLETED' || z.overallProgress >= 100) {
      completedZones++;
    } else if (z.status === 'IN_PROGRESS' || z.overallProgress > 0) {
      zonesInProgress++;
    }
  });

  const overallProgress = Math.min(100, Math.max(0, Number(monitoringRecord.overallProgress) || 0));
  const remainingWork = Math.max(0, 100 - overallProgress);

  return {
    hasMonitoring: true,
    status: monitoringRecord.status || 'NOT_STARTED',
    overallProgress,
    zonesInProgress,
    completedZones,
    totalZonesMonitored: zoneProgress.length,
    remainingWork,
    message: `Response simulation active (${overallProgress}% overall progress).`,
  };
}

/**
 * Deterministically computes public safety update statistics.
 * 
 * @param {Array} updates - List of safety update objects
 * @returns {Object} Safety update analytics
 */
export function calculateSafetyUpdateAnalytics(updates = []) {
  const safeUpdates = Array.isArray(updates) ? updates : [];
  const now = new Date();

  let publishedUpdates = 0;
  let draftUpdates = 0;
  let underReviewUpdates = 0;
  let archivedUpdates = 0;
  let expiredUpdates = 0;

  let urgentUpdates = 0;
  let cautionUpdates = 0;
  let infoUpdates = 0;

  safeUpdates.forEach(u => {
    if (u.status === UPDATE_STATUS.DRAFT) {
      draftUpdates++;
    } else if (u.status === UPDATE_STATUS.UNDER_REVIEW) {
      underReviewUpdates++;
    } else if (u.status === UPDATE_STATUS.ARCHIVED) {
      archivedUpdates++;
    } else if (u.status === UPDATE_STATUS.PUBLISHED) {
      const active = isUpdateActive(u, now);
      if (active) {
        publishedUpdates++;
        if (u.severity === UPDATE_SEVERITY.URGENT) urgentUpdates++;
        else if (u.severity === UPDATE_SEVERITY.CAUTION) cautionUpdates++;
        else infoUpdates++;
      } else {
        expiredUpdates++;
      }
    }
  });

  return {
    totalUpdates: safeUpdates.length,
    publishedUpdates,
    draftUpdates,
    underReviewUpdates,
    archivedUpdates,
    expiredUpdates,
    urgentUpdates,
    cautionUpdates,
    infoUpdates,
  };
}

/**
 * Deterministically classifies the overall incident situation using transparent rules.
 * 
 * RULE LOGIC (Section 7):
 * CRITICAL if:
 *   - at least one Critical priority zone (criticalZones > 0) OR
 *   - overall resource coverage < 50% (overallCoverage < 50) OR
 *   - monitoring progress has significant unmet work while critical zones exist
 * 
 * HIGH ATTENTION if:
 *   - at least one High priority zone (highPriorityZones > 0) OR
 *   - overall resource coverage < 80% (overallCoverage < 80) OR
 *   - active urgent safety updates exist (urgentUpdates > 0)
 * 
 * STABLE / MANAGED otherwise.
 * 
 * @param {Object} inputs
 * @returns {Object} Situation indicator result
 */
export function calculateOverallIncidentSituation({
  priorityAnalytics,
  resourceAnalytics,
  responseAnalytics,
  safetyAnalytics,
}) {
  const criticalZones = priorityAnalytics?.criticalZones || 0;
  const highZones = priorityAnalytics?.highPriorityZones || 0;
  const overallCoverage = resourceAnalytics?.overallCoverage ?? 100;
  const urgentUpdates = safetyAnalytics?.urgentUpdates || 0;
  const hasMonitoring = responseAnalytics?.hasMonitoring || false;
  const overallProgress = responseAnalytics?.overallProgress || 0;

  // Condition checks for CRITICAL
  const criticalReasons = [];
  if (criticalZones > 0) {
    criticalReasons.push(`${criticalZones} priority zone(s) ranked as Critical`);
  }
  if (overallCoverage < 50) {
    criticalReasons.push(`overall resource coverage is at ${overallCoverage}% (below 50%)`);
  }
  if (criticalZones > 0 && hasMonitoring && overallProgress < 30) {
    criticalReasons.push(`response progress is at ${overallProgress}% with substantial remaining actions in critical sectors`);
  }

  if (criticalReasons.length > 0) {
    return {
      level: 'CRITICAL',
      label: 'Critical',
      color: 'rose',
      explanation: `Critical because ${criticalReasons.join(' and ')}.`,
      systemGeneratedLabel: 'System-generated situation indicator',
    };
  }

  // Condition checks for HIGH ATTENTION
  const highAttentionReasons = [];
  if (highZones > 0) {
    highAttentionReasons.push(`${highZones} priority zone(s) ranked as High Priority`);
  }
  if (overallCoverage < 80) {
    highAttentionReasons.push(`overall resource coverage is at ${overallCoverage}% (below 80%)`);
  }
  if (urgentUpdates > 0) {
    highAttentionReasons.push(`${urgentUpdates} urgent public safety update(s) currently active`);
  }

  if (highAttentionReasons.length > 0) {
    return {
      level: 'HIGH_ATTENTION',
      label: 'High Attention',
      color: 'amber',
      explanation: `High Attention because ${highAttentionReasons.join(' and ')}.`,
      systemGeneratedLabel: 'System-generated situation indicator',
    };
  }

  // Fallback: STABLE / MANAGED
  return {
    level: 'STABLE_MANAGED',
    label: 'Stable / Managed',
    color: 'emerald',
    explanation: 'Stable / Managed because all priority areas have sufficient coverage and no critical deficits are detected.',
    systemGeneratedLabel: 'System-generated situation indicator',
  };
}

/**
 * Generates 3-4 deterministic, transparent text insights based only on real data.
 */
export function generateKeyTakeaways({
  priorityAnalytics,
  resourceAnalytics,
  responseAnalytics,
  safetyAnalytics,
}) {
  const takeaways = [];

  // Insight 1: Top priority zone
  if (priorityAnalytics?.highestPriorityZone) {
    const top = priorityAnalytics.highestPriorityZone;
    takeaways.push(`${top.name} has the highest current priority score (${top.priorityScore} · ${top.priorityBand}).`);
  } else {
    takeaways.push('No active priority zones are currently identified for this event.');
  }

  // Insight 2: Largest unmet resource demand
  if (resourceAnalytics?.resources) {
    const unmetList = [...resourceAnalytics.resources].sort((a, b) => b.unmet - a.unmet);
    const topUnmet = unmetList[0];
    if (topUnmet && topUnmet.unmet > 0) {
      takeaways.push(`${topUnmet.name} has the largest unmet resource demand (${topUnmet.unmet.toLocaleString()} ${topUnmet.unit} needed).`);
    } else {
      takeaways.push('All requested emergency resources are fully covered by recommended allocations.');
    }
  }

  // Insight 3: Response Monitoring progress
  if (responseAnalytics?.hasMonitoring) {
    takeaways.push(`Response simulation is currently ${responseAnalytics.overallProgress}% complete across ${responseAnalytics.totalZonesMonitored} zones.`);
  } else {
    takeaways.push('No approved response plan is currently in active simulation monitoring.');
  }

  // Insight 4: Public Safety Information
  if (safetyAnalytics?.urgentUpdates > 0) {
    takeaways.push(`${safetyAnalytics.urgentUpdates} urgent public safety update(s) are active for citizens.`);
  } else if (safetyAnalytics?.publishedUpdates > 0) {
    takeaways.push(`${safetyAnalytics.publishedUpdates} verified public safety update(s) are published for citizens.`);
  } else {
    takeaways.push('No public safety updates are currently published for this incident.');
  }

  return takeaways;
}

/**
 * Unified calculation function combining all incident analytics dimensions.
 * 
 * @param {Object} params
 * @param {Array} params.reports
 * @param {Array} params.zones
 * @param {Array} params.allocations
 * @param {Object} [params.aggregateTotals]
 * @param {Object} [params.monitoringRecord]
 * @param {Array} params.updates
 * @returns {Object} Complete Incident Analytics object
 */
export function calculateOverallIncidentAnalytics({
  reports = [],
  zones = [],
  allocations = [],
  aggregateTotals = null,
  monitoringRecord = null,
  updates = [],
} = {}) {
  const reportAnalytics = calculateReportAnalytics(reports);
  const priorityAnalytics = calculatePriorityAnalytics(zones);
  const resourceAnalytics = calculateResourceAnalytics(allocations, aggregateTotals);
  const responseAnalytics = calculateResponseAnalytics(monitoringRecord);
  const safetyAnalytics = calculateSafetyUpdateAnalytics(updates);

  const overallSituation = calculateOverallIncidentSituation({
    priorityAnalytics,
    resourceAnalytics,
    responseAnalytics,
    safetyAnalytics,
  });

  const keyTakeaways = generateKeyTakeaways({
    priorityAnalytics,
    resourceAnalytics,
    responseAnalytics,
    safetyAnalytics,
    overallSituation,
  });

  return {
    reports: reportAnalytics,
    priority: priorityAnalytics,
    resources: resourceAnalytics,
    response: responseAnalytics,
    safety: safetyAnalytics,
    situation: overallSituation,
    keyTakeaways,
    timestamp: new Date().toISOString(),
  };
}
