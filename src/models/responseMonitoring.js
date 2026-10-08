/**
 * RELIEF-OS Response Monitoring Data Model
 * 
 * Defines the data structures and deterministic progress formulas for tracking
 * simulated response progress of APPROVED response plans.
 * 
 * STRICT SIMULATION PRINCIPLE:
 * "Simulation only — no real resources are being tracked or dispatched."
 * 
 * Progress is purely human-directed simulation testing without automatic dispatch,
 * live telemetry, GPS routing, or real inventory decrement.
 */

export const MONITORING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PARTIALLY_COMPLETED: 'PARTIALLY_COMPLETED',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
};

export const RESOURCE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const ZONE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

/**
 * Formats sequential monitoring ID (e.g. MON-0001, MON-0002)
 */
export function formatMonitoringId(sequenceNumber = 1) {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `MON-${padded}`;
}

/**
 * Deterministically computes progress percentage for a single resource.
 * Formula: completed / planned * 100.
 * If planned = 0, progress = 100.
 * Clamped between 0 and 100.
 */
export function calculateResourceProgress(completed = 0, planned = 0) {
  if (planned <= 0) return 100;
  const ratio = (completed / planned) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/**
 * Deterministically computes overall progress across all resources within a zone.
 */
export function calculateZoneProgress(resources = []) {
  if (!resources || resources.length === 0) return 0;
  
  let totalPlanned = 0;
  let totalCompleted = 0;

  resources.forEach(r => {
    totalPlanned += r.planned || 0;
    totalCompleted += r.completed || 0;
  });

  if (totalPlanned <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((totalCompleted / totalPlanned) * 100)));
}

/**
 * Determines operational status for a zone based on resource progress.
 */
export function calculateZoneStatus(resources = []) {
  if (!resources || resources.length === 0) return ZONE_STATUS.NOT_STARTED;

  const allCompleted = resources.every(r => (r.completed >= r.planned && r.planned > 0) || r.planned === 0);
  if (allCompleted) return ZONE_STATUS.COMPLETED;

  const anyStarted = resources.some(r => r.completed > 0);
  if (anyStarted) return ZONE_STATUS.IN_PROGRESS;

  return ZONE_STATUS.NOT_STARTED;
}

/**
 * Deterministically calculates overall response plan progress across all zones and resources.
 * Formula (Section 17):
 * total completed quantity across all planned resources
 * /
 * total planned quantity across all planned resources
 * * 100
 * Round to nearest whole number, never exceed 100.
 */
export function calculateOverallProgress(zoneProgress = []) {
  let totalPlanned = 0;
  let totalCompleted = 0;

  zoneProgress.forEach(z => {
    (z.resources || []).forEach(r => {
      totalPlanned += r.planned || 0;
      totalCompleted += r.completed || 0;
    });
  });

  if (totalPlanned <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((totalCompleted / totalPlanned) * 100)));
}

/**
 * Derives overall monitoring lifecycle status (Section 14).
 * If paused: remains PAUSED.
 * If all resources reached 100%: COMPLETED.
 * If some zones complete and some remain in progress: PARTIALLY_COMPLETED.
 * If at least one resource has progress: IN_PROGRESS.
 * Otherwise: NOT_STARTED.
 */
export function deriveOverallStatus(zoneProgress = [], currentStatus = MONITORING_STATUS.NOT_STARTED) {
  if (currentStatus === MONITORING_STATUS.PAUSED) {
    return MONITORING_STATUS.PAUSED;
  }

  let totalPlanned = 0;
  let totalCompleted = 0;
  let hasAnyCompletedZone = false;
  let hasAnyIncompleteZone = false;

  zoneProgress.forEach(z => {
    const isZoneComplete = (z.resources || []).every(r => r.completed >= r.planned);
    if (isZoneComplete) {
      hasAnyCompletedZone = true;
    } else {
      hasAnyIncompleteZone = true;
    }

    (z.resources || []).forEach(r => {
      totalPlanned += r.planned || 0;
      totalCompleted += r.completed || 0;
    });
  });

  if (totalPlanned > 0 && totalCompleted >= totalPlanned) {
    return MONITORING_STATUS.COMPLETED;
  }

  if (hasAnyCompletedZone && hasAnyIncompleteZone) {
    return MONITORING_STATUS.PARTIALLY_COMPLETED;
  }

  if (totalCompleted > 0) {
    return MONITORING_STATUS.IN_PROGRESS;
  }

  return currentStatus === MONITORING_STATUS.IN_PROGRESS 
    ? MONITORING_STATUS.IN_PROGRESS 
    : MONITORING_STATUS.NOT_STARTED;
}

/**
 * Factory function creating a new Response Monitoring record from an APPROVED response plan.
 * 
 * @param {Object} approvedPlan - Must have status: 'APPROVED'
 * @param {Object} [options]
 * @returns {Object} Response Monitoring entity
 */
export function createResponseMonitoring(approvedPlan, options = {}) {
  // Section 5 Guard: ONLY APPROVED plans can start monitoring
  if (!approvedPlan || approvedPlan.status !== 'APPROVED') {
    throw new Error('Only approved response plans can be monitored.');
  }

  const monitoringId = options.monitoringId || formatMonitoringId(options.sequence || 1);
  const now = new Date().toISOString();

  // Group approved allocations by zone
  const zoneMap = {};

  (approvedPlan.allocations || []).forEach(alloc => {
    const zoneId = alloc.zoneId;
    if (!zoneMap[zoneId]) {
      zoneMap[zoneId] = {
        zoneId,
        zoneName: alloc.zoneName || zoneId,
        priorityScore: alloc.priorityScore || 0,
        priorityBand: alloc.priorityBand || 'Medium',
        resources: [],
        overallProgress: 0,
        status: ZONE_STATUS.NOT_STARTED,
      };
    }

    // Only track resources with positive planned allocation (or explicit planned targets)
    zoneMap[zoneId].resources.push({
      resource: alloc.resource,
      resourceName: alloc.resourceName || alloc.resource,
      unit: alloc.unit || 'units',
      planned: alloc.allocated || 0,
      completed: 0,
      remaining: alloc.allocated || 0,
      progress: alloc.allocated > 0 ? 0 : 100,
      status: RESOURCE_STATUS.NOT_STARTED,
    });
  });

  // Convert to array sorted by zone priority score descending
  const zoneProgress = Object.values(zoneMap).sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    monitoringId,
    planId: approvedPlan.planId,
    disasterId: approvedPlan.disasterId,
    disasterName: approvedPlan.disasterName || 'Assam Flood Response',
    region: approvedPlan.region || 'Morigaon, Assam',

    status: MONITORING_STATUS.NOT_STARTED,

    startedAt: null,
    completedAt: null,

    zoneProgress,

    overallProgress: 0,

    lastUpdatedAt: now,

    history: [
      {
        id: 'mon-hist-1',
        action: 'Response simulation created',
        actor: options.createdBy || 'Command Center',
        timestamp: now,
        note: `Simulated response monitoring record initialized for approved plan ${approvedPlan.planId}.`,
      },
    ],
  };
}
