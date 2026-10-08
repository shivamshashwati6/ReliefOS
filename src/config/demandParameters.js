/**
 * RELIEF-OS Resource Demand Prediction Configuration
 * 
 * Keep all resource demand simulation parameters and assumptions in this single file.
 * 
 * IMPORTANT DISCLAIMER:
 * These are prototype simulation assumptions designed for disaster response decision-support.
 * They are configurable operational assumptions and NOT official statutory government relief
 * scales or statutory standards.
 */

export const DEMAND_PARAMETERS = {
  // Food demand: kits per person per day
  FOOD_KITS_PER_PERSON_PER_DAY: 0.6,

  // Water demand: liters / potable units per person per day
  WATER_UNITS_PER_PERSON_PER_DAY: 1.2,

  // Default response planning window in days
  DEFAULT_RESPONSE_DURATION_DAYS: 3,

  // Rescue boat capacity in persons per vessel
  RESCUE_BOAT_CAPACITY: 15,

  // Medical team coverage capacity: affected persons per deployed team
  MEDICAL_TEAM_CAPACITY: 1000,
};

/**
 * Controlled medical-need adjustments applied to base medical team demand.
 * 
 * Formula: Base Teams = Math.ceil(People Affected / MEDICAL_TEAM_CAPACITY)
 * Adjusted Teams = Base Teams + MEDICAL_NEED_ADJUSTMENTS[level]
 * Capped reasonably, never negative.
 */
export const MEDICAL_NEED_ADJUSTMENTS = {
  NONE: 0,
  LOW: 0,
  MEDIUM: 1,
  HIGH: 1,
  CRITICAL: 2,
};

/**
 * Bounded severity modifiers.
 * Low: 1.0, Medium: 1.1, High: 1.2, Critical: 1.3
 */
export const SEVERITY_MODIFIERS = {
  LOW: 1.0,
  MEDIUM: 1.1,
  HIGH: 1.2,
  CRITICAL: 1.3,
};

/**
 * Accessibility difficulty / situation adjustments.
 * UI Label: "Situation adjustment" (NOT "Contextual Modifier")
 * Easy: 1.0, Difficult: 1.1, Very difficult: 1.2
 */
export const SITUATION_ADJUSTMENTS = {
  EASY: 1.0,
  DIFFICULT: 1.1,
  VERY_DIFFICULT: 1.2,
};

/**
 * Medicine demand levels mapped from clinical distress indicators.
 * LOW: Standard supplies / no acute outbreak
 * MEDIUM: Moderate first-aid & wound dressings needed
 * HIGH: Multiple emergency trauma/dehydration reports flagged
 * CRITICAL: Severe widespread medical epidemic / acute casualty count
 */
export const MEDICINE_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * CANONICAL ASSAM FLOOD DEMO PRESERVATION (DISASTER-001)
 * 
 * Section 11:
 * Preserves the exact canonical numbers established for the live Assam Flood demonstration:
 * Food: 1,200 kits (500 available, 700 gap)
 * Water: 800 units (300 available, 500 gap)
 * Rescue boats: 4 (1 available, 3 gap)
 * Medical team: 1 (0 available, 1 gap)
 * Medicine: HIGH
 * 
 * This enables the generalized pure engine to calculate realistic mathematical formulas
 * while guaranteeing the canonical demo retains its proven demonstration values.
 */
export const CANONICAL_ASSAM_DEMO_DATA = {
  'zone-a': {
    food: {
      needed: 1200,
      available: 500,
      gap: 700,
      unit: 'kits',
      isSimulatedDemo: true,
    },
    water: {
      needed: 800,
      available: 300,
      gap: 500,
      unit: 'units',
      isSimulatedDemo: true,
    },
    rescueBoats: {
      needed: 4,
      available: 1,
      gap: 3,
      unit: 'boats',
      status: 'Active Response',
      isSimulatedDemo: true,
    },
    medicalTeams: {
      needed: 1,
      available: 0,
      gap: 1,
      unit: 'teams',
      isSimulatedDemo: true,
    },
    medicine: {
      level: 'HIGH',
      reason: 'Infant dehydration clusters and trauma reported in Zone A',
      isSimulatedDemo: true,
    },
  },
  'zone-b': {
    food: {
      needed: 1500,
      available: 800,
      gap: 700,
      unit: 'kits',
      isSimulatedDemo: true,
    },
    water: {
      needed: 1200,
      available: 600,
      gap: 600,
      unit: 'units',
      isSimulatedDemo: true,
    },
    rescueBoats: {
      needed: 2,
      available: 1,
      gap: 1,
      unit: 'boats',
      status: 'Route Clearance',
      isSimulatedDemo: true,
    },
    medicalTeams: {
      needed: 1,
      available: 1,
      gap: 0,
      unit: 'teams',
      isSimulatedDemo: true,
    },
    medicine: {
      level: 'MEDIUM',
      reason: 'Evacuation cut dressings and mobile clinic requested',
      isSimulatedDemo: true,
    },
  },
  'zone-c': {
    food: {
      needed: 600,
      available: 400,
      gap: 200,
      unit: 'kits',
      isSimulatedDemo: true,
    },
    water: {
      needed: 500,
      available: 350,
      gap: 150,
      unit: 'units',
      isSimulatedDemo: true,
    },
    rescueBoats: {
      needed: null,
      available: 0,
      gap: null,
      unit: 'boats',
      status: 'Assessment Required',
      isSimulatedDemo: true,
    },
    medicalTeams: {
      needed: 1,
      available: 1,
      gap: 0,
      unit: 'teams',
      isSimulatedDemo: true,
    },
    medicine: {
      level: 'LOW',
      reason: 'Continuous monitoring of chronic conditions',
      isSimulatedDemo: true,
    },
  },
  'zone-d': {
    food: {
      needed: 300,
      available: 300,
      gap: 0,
      unit: 'kits',
      isSimulatedDemo: true,
    },
    water: {
      needed: 300,
      available: 300,
      gap: 0,
      unit: 'units',
      isSimulatedDemo: true,
    },
    rescueBoats: {
      needed: null,
      available: 0,
      gap: null,
      unit: 'boats',
      status: 'Assessment Required',
      isSimulatedDemo: true,
    },
    medicalTeams: {
      needed: 0,
      available: 1,
      gap: 0,
      unit: 'teams',
      isSimulatedDemo: true,
    },
    medicine: {
      level: 'LOW',
      reason: 'Relief cache deployed and verified',
      isSimulatedDemo: true,
    },
  },
};

/**
 * Standard simulated inventory defaults for non-canonical zones
 */
export const DEFAULT_AVAILABLE_INVENTORY = {
  food: 500,
  water: 400,
  rescueBoats: 1,
  medicalTeams: 1,
};
