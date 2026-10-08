/**
 * RELIEF-OS Resource Allocation Configuration
 * 
 * Central configuration for the deterministic, explainable resource allocation engine.
 * 
 * IMPORTANT DISCLAIMER:
 * These parameters govern prototype simulation recommendations and decision support.
 * They are NOT automatic dispatch orders or statutory distribution mandates.
 */

export const ALLOCATION_PARAMETERS = {
  // Minimum coverage safeguard ratio (Pass 1)
  // Attempt to provide up to 20% of each eligible zone's requested demand before priority distribution
  MINIMUM_COVERAGE_RATIO: 0.20,

  // Resource types supported by the deterministic allocation engine
  SUPPORTED_RESOURCES: ['food', 'water', 'rescueBoats', 'medicalTeams'],
};

/**
 * Human-readable metadata for each resource type
 */
export const RESOURCE_METADATA = {
  food: {
    id: 'food',
    name: 'Food Kits',
    unit: 'kits',
    category: 'Supply',
    department: 'FOOD_SUPPLY',
  },
  water: {
    id: 'water',
    name: 'Water Units',
    unit: 'units',
    category: 'Supply',
    department: 'FOOD_SUPPLY',
  },
  rescueBoats: {
    id: 'rescueBoats',
    name: 'Rescue Boats',
    unit: 'boats',
    category: 'Rescue',
    department: 'RESCUE',
  },
  medicalTeams: {
    id: 'medicalTeams',
    name: 'Medical Teams',
    unit: 'teams',
    category: 'Health',
    department: 'HEALTH',
  },
};

/**
 * Canonical Assam Flood (DISASTER-001) simulated inventory baseline.
 * Used for decision support recommendations without mutating inventory.
 */
export const CANONICAL_SIMULATED_INVENTORY = {
  food: 2000,
  water: 1500,
  rescueBoats: 6,
  medicalTeams: 2,
};
