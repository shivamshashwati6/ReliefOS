/**
 * RELIEF-OS Safety Update Data Model
 * 
 * Defines the public safety information schema and lifecycle enums.
 * 
 * STRICT PRINCIPLE:
 * "Separates internal emergency response decisions from public safety information."
 * Citizens only see PUBLISHED and unexpired updates.
 * NO priority scores, allocation counts, inventory levels, or AI internal data are exposed.
 */

export const UPDATE_STATUS = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
};

export const UPDATE_SEVERITY = {
  INFO: 'INFO',
  CAUTION: 'CAUTION',
  URGENT: 'URGENT',
};

/**
 * Sequential ID generator (e.g., SU-0001, SU-0002)
 */
export function formatUpdateId(sequence = 1) {
  const padded = String(sequence).padStart(4, '0');
  return `SU-${padded}`;
}

/**
 * Determines if a safety update is currently active and eligible for public citizen viewing.
 * Rule: status === PUBLISHED AND (no expiresAt OR expiresAt > currentTime)
 */
export function isUpdateActive(update, currentTime = new Date()) {
  if (!update || update.status !== UPDATE_STATUS.PUBLISHED) {
    return false;
  }

  if (update.expiresAt) {
    const expiryDate = new Date(update.expiresAt);
    const currentDate = new Date(currentTime);
    if (!isNaN(expiryDate.getTime()) && currentDate >= expiryDate) {
      return false; // Expired
    }
  }

  return true;
}

/**
 * Validates required fields for safety update creation or editing.
 */
export function validateSafetyUpdateInput({ title, message, affectedArea, severity }) {
  const errors = {};

  if (!title || !title.trim()) {
    errors.title = 'Title is required.';
  } else if (title.trim().length > 120) {
    errors.title = 'Title must be 120 characters or less.';
  }

  if (!message || !message.trim()) {
    errors.message = 'Message is required.';
  }

  if (!affectedArea || !affectedArea.trim()) {
    errors.affectedArea = 'Affected area is required.';
  }

  if (severity && !Object.values(UPDATE_SEVERITY).includes(severity)) {
    errors.severity = 'Invalid severity. Must be INFO, CAUTION, or URGENT.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Factory function creating a new Safety Update record.
 * 
 * @param {Object} input
 * @param {Object} [options]
 * @returns {Object} Safety Update entity
 */
export function createSafetyUpdate(input, options = {}) {
  const validation = validateSafetyUpdateInput(input);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validation Error: ${firstError}`);
  }

  const updateId = options.updateId || formatUpdateId(options.sequence || 1);
  const now = options.now || new Date().toISOString();
  const createdBy = options.createdBy || 'Command Center';

  return {
    updateId,
    disasterId: input.disasterId || 'DISASTER-001',
    title: input.title.trim(),
    message: input.message.trim(),
    severity: input.severity || UPDATE_SEVERITY.INFO,
    status: UPDATE_STATUS.DRAFT,
    affectedArea: input.affectedArea.trim(),
    createdBy,
    createdAt: now,
    publishedAt: null,
    expiresAt: input.expiresAt || null,
    history: [
      {
        id: `su-hist-1`,
        action: 'Update created',
        actor: createdBy,
        timestamp: now,
        note: 'Draft safety update created by command operator.',
      },
    ],
  };
}
