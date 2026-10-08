/**
 * RELIEF-OS Response Plan Data Model
 * 
 * Defines the canonical data structures and state transitions for
 * human-reviewed disaster response plans.
 * 
 * STRICT HUMAN DECISION-MAKING PRINCIPLE:
 * System recommendations (from Allocation Engine) are transformed into
 * an explicit, reviewable Response Plan which requires human review
 * (Command Center) to move from DRAFT -> UNDER_REVIEW -> APPROVED or REJECTED.
 * 
 * NO real-world dispatch occurs upon approval.
 */

export const PLAN_STATUS = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * Formats a timestamp into human-readable format e.g. "10:32 PM" or "Oct 8, 10:32 PM"
 */
export function formatPlanTime(isoDateString = new Date().toISOString()) {
  try {
    const d = new Date(isoDateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '10:00 AM';
  }
}

/**
 * Generates a readable, deterministic response plan ID: RP-0001, RP-0002, etc.
 * 
 * @param {number} sequenceNumber - Sequential plan counter
 * @returns {string} e.g. "RP-0001"
 */
export function formatPlanId(sequenceNumber = 1) {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `RP-${padded}`;
}

/**
 * Factory function creating a new Response Plan entity.
 * 
 * @param {Object} params
 * @param {string} params.planId - Readable ID (e.g. "RP-0001")
 * @param {string} params.disasterId - Associated disaster event ID
 * @param {string} [params.disasterName] - Human-readable disaster name
 * @param {string} [params.region] - Geographic region
 * @param {string} [params.createdBy] - Creator entity (defaults to "Command Center")
 * @param {Array} params.allocations - Snapshot of allocation recommendations from AllocationContext
 * @param {Object} [params.unmetDemand] - Snapshot of unmet demands
 * @param {Object} [params.totalRequested] - Snapshot of requested quantities
 * @param {Object} [params.totalAllocated] - Snapshot of allocated quantities
 * @param {Object} [params.remainingInventory] - Snapshot of remaining simulated inventory
 * @param {string} [params.notes] - Operational planning notes
 * @param {string} [params.status] - Initial status (defaults to DRAFT)
 * 
 * @returns {Object} Complete Response Plan record
 */
export function createResponsePlan({
  planId = 'RP-0001',
  disasterId = 'DISASTER-001',
  disasterName = 'Assam Flood Response',
  region = 'Morigaon, Assam',
  createdBy = 'Command Center',
  allocations = [],
  unmetDemand = {},
  totalRequested = {},
  totalAllocated = {},
  remainingInventory = {},
  notes = 'Initial recommended resource distribution for affected zones.',
  status = PLAN_STATUS.DRAFT,
  createdAt = new Date().toISOString(),
} = {}) {
  // Count unique affected zones covered in allocations
  const uniqueZones = new Set(allocations.map(a => a.zoneId));
  const zonesCount = uniqueZones.size;

  // Count unique resource types involved
  const uniqueResources = new Set(allocations.map(a => a.resource));
  const resourcesCount = uniqueResources.size;

  const timeStr = formatPlanTime(createdAt);

  return {
    planId,
    disasterId,
    disasterName,
    region,
    createdAt,
    createdBy,
    status,
    notes,
    zonesCount,
    resourcesCount,

    // Deep snapshots of allocation data from AllocationContext
    allocations: Array.isArray(allocations) ? JSON.parse(JSON.stringify(allocations)) : [],
    unmetDemand: { ...unmetDemand },
    totalRequested: { ...totalRequested },
    totalAllocated: { ...totalAllocated },
    remainingInventory: { ...remainingInventory },

    // Human Approval Object (Section 2)
    approval: {
      status: APPROVAL_STATUS.PENDING,
      approvedBy: null,
      approvedAt: null,
      note: null,
    },

    // Decision History Audit Trail (Section 15)
    history: [
      {
        id: 'hist-1',
        timestamp: createdAt,
        timeFormatted: timeStr,
        action: 'Plan created',
        user: createdBy,
        note: notes || 'Draft plan generated from current allocation recommendations.',
        statusAtStep: status,
      },
    ],
  };
}
