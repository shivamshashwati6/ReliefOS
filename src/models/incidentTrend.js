/**
 * RELIEF-OS Incident Trend Data Model
 * 
 * Defines the immutable point-in-time analytical snapshot schema
 * for disaster trend tracking and decision-support comparison.
 * 
 * STRICT COMPLIANCE:
 * - Pure simulation / prototype analytical records.
 * - ZERO mutation of live operational state or inventories.
 * - Simple, transparent schema without unnecessary internal data.
 * - Isolated by disasterId.
 */

export const TREND_DIRECTIONS = Object.freeze({
  IMPROVING: 'IMPROVING',
  WORSENING: 'WORSENING',
  STABLE: 'STABLE',
});

/**
 * Validates a candidate snapshot structure.
 * 
 * @param {Object} snapshot - The snapshot object to validate
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateSnapshot(snapshot) {
  const errors = {};

  if (!snapshot || typeof snapshot !== 'object') {
    return {
      isValid: false,
      errors: { snapshot: 'Snapshot must be a valid non-null object.' },
    };
  }

  // 1. Required disasterId
  if (!snapshot.disasterId || typeof snapshot.disasterId !== 'string' || !snapshot.disasterId.trim()) {
    errors.disasterId = 'disasterId is required and must be a non-empty string.';
  }

  // 2. Required timestamp
  if (!snapshot.timestamp || typeof snapshot.timestamp !== 'string') {
    errors.timestamp = 'timestamp is required and must be a valid ISO date string.';
  } else {
    const parsedTime = Date.parse(snapshot.timestamp);
    if (Number.isNaN(parsedTime)) {
      errors.timestamp = 'timestamp must be a valid parsable date.';
    }
  }

  // 3. reports structure
  if (!snapshot.reports || typeof snapshot.reports !== 'object') {
    errors.reports = 'reports object is required.';
  } else {
    if (typeof snapshot.reports.total !== 'number' || Number.isNaN(snapshot.reports.total)) {
      errors['reports.total'] = 'reports.total must be a number.';
    }
    if (typeof snapshot.reports.critical !== 'number' || Number.isNaN(snapshot.reports.critical)) {
      errors['reports.critical'] = 'reports.critical must be a number.';
    }
    if (typeof snapshot.reports.high !== 'number' || Number.isNaN(snapshot.reports.high)) {
      errors['reports.high'] = 'reports.high must be a number.';
    }
  }

  // 4. priority structure
  if (!snapshot.priority || typeof snapshot.priority !== 'object') {
    errors.priority = 'priority object is required.';
  } else {
    if (typeof snapshot.priority.criticalZones !== 'number' || Number.isNaN(snapshot.priority.criticalZones)) {
      errors['priority.criticalZones'] = 'priority.criticalZones must be a number.';
    }
    if (typeof snapshot.priority.highPriorityZones !== 'number' || Number.isNaN(snapshot.priority.highPriorityZones)) {
      errors['priority.highPriorityZones'] = 'priority.highPriorityZones must be a number.';
    }
    if (typeof snapshot.priority.highestScore !== 'number' || Number.isNaN(snapshot.priority.highestScore)) {
      errors['priority.highestScore'] = 'priority.highestScore must be a number.';
    }
  }

  // 5. resources structure
  if (!snapshot.resources || typeof snapshot.resources !== 'object') {
    errors.resources = 'resources object is required.';
  } else {
    if (typeof snapshot.resources.overallCoverage !== 'number' || Number.isNaN(snapshot.resources.overallCoverage)) {
      errors['resources.overallCoverage'] = 'resources.overallCoverage must be a number.';
    }
    if (typeof snapshot.resources.totalUnmet !== 'number' || Number.isNaN(snapshot.resources.totalUnmet)) {
      errors['resources.totalUnmet'] = 'resources.totalUnmet must be a number.';
    }
  }

  // 6. response structure
  if (!snapshot.response || typeof snapshot.response !== 'object') {
    errors.response = 'response object is required.';
  } else {
    if (typeof snapshot.response.overallProgress !== 'number' || Number.isNaN(snapshot.response.overallProgress)) {
      errors['response.overallProgress'] = 'response.overallProgress must be a number.';
    }
  }

  // 7. safety structure
  if (!snapshot.safety || typeof snapshot.safety !== 'object') {
    errors.safety = 'safety object is required.';
  } else {
    if (typeof snapshot.safety.publishedUpdates !== 'number' || Number.isNaN(snapshot.safety.publishedUpdates)) {
      errors['safety.publishedUpdates'] = 'safety.publishedUpdates must be a number.';
    }
    if (typeof snapshot.safety.urgentUpdates !== 'number' || Number.isNaN(snapshot.safety.urgentUpdates)) {
      errors['safety.urgentUpdates'] = 'safety.urgentUpdates must be a number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Formats a sequential snapshot ID (e.g. TS-0001).
 * 
 * @param {number} seq - Sequence number
 * @returns {string} Formatted ID
 */
export function formatSnapshotId(seq = 1) {
  const safeSeq = Math.max(1, parseInt(seq, 10) || 1);
  return `TS-${String(safeSeq).padStart(4, '0')}`;
}
