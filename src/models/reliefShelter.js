/**
 * RELIEF-OS Relief Shelter Data Model
 * 
 * Defines the schema and validation logic for simulated relief shelter points.
 * 
 * STRICT COMPLIANCE:
 * - Prototype / simulation data only.
 * - ZERO claim that shelters are real, verified, open, or government-endorsed.
 * - Latitude and longitude remain null for schematic locations (no fabricated coordinates).
 * - Capacity and occupancy must be non-negative, and occupancy cannot exceed capacity.
 * - Remaining simulated capacity is strictly max(capacity - occupancy, 0).
 */

export const SHELTER_STATUS = Object.freeze({
  SIMULATED: 'SIMULATED',
});

export const SHELTER_LOCATION_TYPE = Object.freeze({
  SCHEMATIC: 'SCHEMATIC',
  COORDINATE: 'COORDINATE',
});

export const SHELTER_SAFETY_DISCLAIMER =
  'Simulated shelter information — verify local availability before travelling.';

/**
 * Formats a sequential shelter ID (e.g. SH-0001).
 * 
 * @param {number} seq - Sequence number
 * @returns {string} Formatted shelter ID
 */
export function formatShelterId(seq = 1) {
  const safeSeq = Math.max(1, parseInt(seq, 10) || 1);
  return `SH-${String(safeSeq).padStart(4, '0')}`;
}

/**
 * Calculates remaining simulated capacity for a shelter.
 * max(capacity - occupancy, 0)
 * 
 * @param {Object} shelter - Shelter record
 * @returns {number} Remaining capacity
 */
export function calculateRemainingCapacity(shelter) {
  if (!shelter) return 0;
  const capacity = Number(shelter.capacity) || 0;
  const occupancy = Number(shelter.occupancy) || 0;
  return Math.max(capacity - occupancy, 0);
}

/**
 * Validates a shelter entity or candidate input.
 * 
 * @param {Object} input - Candidate shelter data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateShelterInput(input) {
  const errors = {};

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      errors: { shelter: 'Shelter must be a valid non-null object.' },
    };
  }

  // 1. Required disasterId
  if (!input.disasterId || typeof input.disasterId !== 'string' || !input.disasterId.trim()) {
    errors.disasterId = 'disasterId is required and must be a non-empty string.';
  }

  // 2. Required name
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    errors.name = 'Shelter name is required.';
  }

  // 3. Required area
  if (!input.area || typeof input.area !== 'string' || !input.area.trim()) {
    errors.area = 'Shelter area is required.';
  }

  // 4. Capacity validation (>= 0)
  const capacity = Number(input.capacity);
  if (input.capacity === undefined || input.capacity === null || Number.isNaN(capacity)) {
    errors.capacity = 'Capacity is required and must be a number.';
  } else if (capacity < 0) {
    errors.capacity = 'Capacity cannot be negative.';
  }

  // 5. Occupancy validation (>= 0 and <= capacity)
  const occupancy = Number(input.occupancy);
  if (input.occupancy === undefined || input.occupancy === null || Number.isNaN(occupancy)) {
    errors.occupancy = 'Occupancy is required and must be a number.';
  } else if (occupancy < 0) {
    errors.occupancy = 'Occupancy cannot be negative.';
  } else if (!errors.capacity && occupancy > capacity) {
    errors.occupancy = `Occupancy (${occupancy}) cannot exceed capacity (${capacity}).`;
  }

  // 6. Coordinates check: No fabricated coordinates for schematic shelters
  if (input.locationType === SHELTER_LOCATION_TYPE.SCHEMATIC) {
    if (input.latitude !== null && input.latitude !== undefined && typeof input.latitude !== 'number') {
      errors.latitude = 'Schematic shelter latitude must be null.';
    }
    if (input.longitude !== null && input.longitude !== undefined && typeof input.longitude !== 'number') {
      errors.longitude = 'Schematic shelter longitude must be null.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Factory creating an immutable simulated shelter entity.
 * 
 * @param {Object} input - Shelter input fields
 * @param {Object} [options] - Options (shelterId, sequence)
 * @returns {Object} Validated shelter entity
 */
export function createShelter(input = {}, options = {}) {
  const shelterId = options.shelterId || input.shelterId || formatShelterId(options.sequence || 1);
  const locationType = input.locationType || SHELTER_LOCATION_TYPE.SCHEMATIC;

  const candidate = {
    shelterId,
    disasterId: input.disasterId,
    name: input.name ? String(input.name).trim() : '',
    area: input.area ? String(input.area).trim() : '',
    status: SHELTER_STATUS.SIMULATED,
    capacity: Number(input.capacity) || 0,
    occupancy: Number(input.occupancy) || 0,
    services: Array.isArray(input.services) ? [...input.services] : ['First Aid', 'Drinking Water'],
    locationType,
    // Strictly preserve null for schematic shelters — never invent coordinates
    latitude: locationType === SHELTER_LOCATION_TYPE.SCHEMATIC ? null : (input.latitude ?? null),
    longitude: locationType === SHELTER_LOCATION_TYPE.SCHEMATIC ? null : (input.longitude ?? null),
    disclaimer: SHELTER_SAFETY_DISCLAIMER,
  };

  const validation = validateShelterInput(candidate);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Shelter Validation Error: ${firstError}`);
  }

  return Object.freeze(candidate);
}
