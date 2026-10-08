/**
 * RELIEF-OS Deterministic Resource Demand Engine
 * 
 * PURE FUNCTIONS ONLY — ZERO ML, ZERO GEMINI CALLS, ZERO EXTERNAL APIS.
 * 
 * Architecture:
 *   Citizen Reports
 *         ↓
 *   Gemini AI Analysis
 *         ↓
 *   Structured Information
 *         ↓
 *   Deterministic Demand Engine (THIS FILE)
 *         ↓
 *   Resource Demand (Needed, Available, Gap)
 *         ↓
 *   Human Decision Support
 * 
 * This engine answers ONLY:
 * "What resources are needed in each affected zone?"
 * 
 * It does NOT allocate, route, or dispatch resources.
 */

import {
  DEMAND_PARAMETERS,
  MEDICAL_NEED_ADJUSTMENTS,
  SEVERITY_MODIFIERS,
  SITUATION_ADJUSTMENTS,
  MEDICINE_LEVELS,
  CANONICAL_ASSAM_DEMO_DATA,
  DEFAULT_AVAILABLE_INVENTORY,
} from '../config/demandParameters.js';

/**
 * Normalizes input population to a non-negative integer.
 */
export function normalizePopulationInput(population) {
  if (population === null || population === undefined) return 0;
  if (typeof population === 'number') {
    return isNaN(population) || population < 0 ? 0 : Math.floor(population);
  }
  if (typeof population === 'string') {
    const cleaned = parseInt(population.replace(/,/g, '').trim(), 10);
    return isNaN(cleaned) || cleaned < 0 ? 0 : cleaned;
  }
  return 0;
}

/**
 * Normalizes string keys to uppercase trimmed keys.
 */
function normalizeKey(str, fallback = 'LOW') {
  if (!str || typeof str !== 'string') return fallback;
  return str.trim().toUpperCase();
}

/**
 * Resolves severity modifier safely (bounded between 1.0 and 1.3).
 */
export function getSeverityModifier(severity) {
  const key = normalizeKey(severity, 'LOW');
  return SEVERITY_MODIFIERS[key] || 1.0;
}

/**
 * Resolves situation adjustment safely (bounded between 1.0 and 1.2).
 * UI Label: "Situation adjustment" (NOT "Contextual Modifier").
 */
export function getSituationAdjustment(accessibility) {
  if (typeof accessibility === 'number') {
    if (accessibility >= 0.8) return SITUATION_ADJUSTMENTS.VERY_DIFFICULT;
    if (accessibility >= 0.4) return SITUATION_ADJUSTMENTS.DIFFICULT;
    return SITUATION_ADJUSTMENTS.EASY;
  }
  const key = normalizeKey(accessibility, 'EASY');
  if (key.includes('VERY') || key.includes('CUT OFF') || key.includes('HIGH')) {
    return SITUATION_ADJUSTMENTS.VERY_DIFFICULT;
  }
  if (key.includes('DIFF') || key.includes('RESTRICT') || key.includes('FLOODED')) {
    return SITUATION_ADJUSTMENTS.DIFFICULT;
  }
  return SITUATION_ADJUSTMENTS.EASY;
}

/**
 * Calculates deterministic food demand.
 * 
 * Formula:
 *   Food Needed = People Affected × Food Kits Per Person Per Day × Response Duration
 * 
 * Example:
 *   3,842 people × 0.6 × 3 ≈ 6,916 food kits
 */
export function calculateFoodDemand(population, options = {}) {
  const pop = normalizePopulationInput(population);
  if (pop <= 0) return 0;

  const kitsPerDay = options.kitsPerPersonPerDay ?? DEMAND_PARAMETERS.FOOD_KITS_PER_PERSON_PER_DAY;
  const duration = options.durationDays ?? DEMAND_PARAMETERS.DEFAULT_RESPONSE_DURATION_DAYS;

  let demand = pop * kitsPerDay * duration;

  if (options.applySeverityModifier && options.severity) {
    demand *= getSeverityModifier(options.severity);
  }

  if (options.applySituationAdjustment && options.accessibility) {
    demand *= getSituationAdjustment(options.accessibility);
  }

  return Math.round(demand);
}

/**
 * Calculates deterministic water demand.
 * 
 * Formula:
 *   Water Needed = People Affected × Water Units Per Person Per Day × Response Duration
 * 
 * Example:
 *   3,842 people × 1.2 × 3 ≈ 13,831 water units
 */
export function calculateWaterDemand(population, options = {}) {
  const pop = normalizePopulationInput(population);
  if (pop <= 0) return 0;

  const unitsPerDay = options.unitsPerPersonPerDay ?? DEMAND_PARAMETERS.WATER_UNITS_PER_PERSON_PER_DAY;
  const duration = options.durationDays ?? DEMAND_PARAMETERS.DEFAULT_RESPONSE_DURATION_DAYS;

  let demand = pop * unitsPerDay * duration;

  if (options.applySeverityModifier && options.severity) {
    demand *= getSeverityModifier(options.severity);
  }

  if (options.applySituationAdjustment && options.accessibility) {
    demand *= getSituationAdjustment(options.accessibility);
  }

  return Math.round(demand);
}

/**
 * Calculates deterministic rescue boat demand.
 * 
 * Rule:
 * - If stranded/rescue-affected count is established:
 *     Boats Needed = CEILING(Stranded People / Boat Capacity)
 * - If data does NOT establish how many people require rescue:
 *     Do NOT invent stranded count. Return { needed: null, status: "Assessment Required" }.
 */
export function calculateRescueDemand(strandedPeople, options = {}) {
  if (strandedPeople === null || strandedPeople === undefined) {
    return {
      needed: null,
      status: 'Assessment Required',
      reason: 'No confirmed stranded count established in reports.',
    };
  }

  const count = typeof strandedPeople === 'number'
    ? strandedPeople
    : parseInt(String(strandedPeople).replace(/,/g, ''), 10);

  if (isNaN(count) || count < 0) {
    return {
      needed: null,
      status: 'Assessment Required',
      reason: 'Invalid stranded count data.',
    };
  }

  if (count === 0) {
    return {
      needed: 0,
      status: 'No Rescue Required',
      reason: '0 residents confirmed stranded in water.',
    };
  }

  const capacity = options.boatCapacity ?? DEMAND_PARAMETERS.RESCUE_BOAT_CAPACITY;
  const needed = Math.ceil(count / capacity);

  return {
    needed,
    status: 'Active Rescue Required',
    reason: `${count} residents requiring rescue ÷ ${capacity} per boat = ${needed} boats`,
  };
}

/**
 * Calculates deterministic medical team demand.
 * 
 * Formula:
 *   Base Medical Teams = CEILING(People Affected / Medical Team Capacity)
 *   Adjusted Medical Teams = Base Medical Teams + Medical Need Adjustment
 * 
 * Guard:
 *   - Never produces negative numbers
 *   - If population is 0, base is 0
 *   - If no evidence of medical need, no artificial increase
 */
export function calculateMedicalTeamDemand(population, medicalNeedLevel, options = {}) {
  const pop = normalizePopulationInput(population);
  if (pop <= 0) return 0;

  const teamCapacity = options.medicalTeamCapacity ?? DEMAND_PARAMETERS.MEDICAL_TEAM_CAPACITY;
  const baseTeams = Math.ceil(pop / teamCapacity);

  const levelKey = normalizeKey(medicalNeedLevel, 'NONE');
  const adjustment = MEDICAL_NEED_ADJUSTMENTS[levelKey] ?? 0;

  return Math.max(0, baseTeams + adjustment);
}

/**
 * Maps structured medical distress indicators to a categorical medicine demand level.
 * 
 * Does NOT invent fake drug pill quantities.
 * Returns: LOW | MEDIUM | HIGH | CRITICAL with human-readable rationale.
 */
export function calculateMedicineDemand(medicalNeedLevel, reports = []) {
  const key = normalizeKey(medicalNeedLevel, 'LOW');

  // Check if any report flags critical medical trauma or infant clusters
  let hasEmergencyCluster = false;
  let hasWoundInjuries = false;

  if (Array.isArray(reports)) {
    for (const r of reports) {
      const desc = `${r.description || ''} ${r.aiAnalysis?.summary || ''}`.toLowerCase();
      const redFlags = Array.isArray(r.aiAnalysis?.red_flags) ? r.aiAnalysis.red_flags : [];

      if (
        redFlags.some(f => String(f).toLowerCase().includes('medical') || String(f).toLowerCase().includes('dehydration')) ||
        desc.includes('dehydration') ||
        desc.includes('trauma') ||
        desc.includes('fever') ||
        desc.includes('infant')
      ) {
        hasEmergencyCluster = true;
      }

      if (desc.includes('injury') || desc.includes('cut') || desc.includes('wound') || desc.includes('first aid')) {
        hasWoundInjuries = true;
      }
    }
  }

  if (key === 'CRITICAL' || (key === 'HIGH' && hasEmergencyCluster)) {
    return {
      level: MEDICINE_LEVELS.HIGH,
      reason: 'Urgent medical kits, ORS sachets, and pediatric treatments required for clusters.',
    };
  }

  if (key === 'HIGH' || hasEmergencyCluster || hasWoundInjuries) {
    return {
      level: MEDICINE_LEVELS.HIGH,
      reason: 'Multiple medical incident reports flagged requiring field doctor kits.',
    };
  }

  if (key === 'MEDIUM' || hasWoundInjuries) {
    return {
      level: MEDICINE_LEVELS.MEDIUM,
      reason: 'First aid supplies, antiseptic dressings, and mobile clinic kits needed.',
    };
  }

  return {
    level: MEDICINE_LEVELS.LOW,
    reason: 'Routine monitoring and standard preventative medication supply.',
  };
}

/**
 * Calculates deterministic gap between needed and available resources.
 * 
 * Formula:
 *   Gap = Math.max(Needed - Available, 0)
 * 
 * Guard: Never negative. If needed is null (assessment required), gap is null.
 */
export function calculateGap(needed, available) {
  if (needed === null || needed === undefined) return null;
  const avail = typeof available === 'number' && !isNaN(available) ? Math.max(0, available) : 0;
  return Math.max(0, needed - avail);
}

/**
 * PURE MASTER FUNCTION: calculateZoneDemand
 * 
 * Evaluates a single zone deterministically given its demographic, clinical,
 * and geographic inputs.
 * 
 * Supports CANONICAL DEMO OVERRIDE:
 * - If `useCanonicalDemoOverride !== false` and the zone belongs to the canonical
 *   Assam Flood demonstration (DISASTER-001) with defined canonical values, the canonical
 *   values are preserved for live presentation, while formula-derived numbers are
 *   faithfully computed and exposed for transparent comparison.
 * - For all other scenarios, formula-derived values directly drive primary demand.
 */
export function calculateZoneDemand(input = {}, options = {}) {
  const {
    zoneId = 'zone-a',
    disasterId = 'DISASTER-001',
    peopleAffected,
    severity = 'HIGH',
    medicalNeed = 'HIGH',
    strandedPeople,
    accessibilityDifficulty = 'DIFFICULT',
    reports = [],
    availableInventory = {},
  } = input;

  const population = normalizePopulationInput(peopleAffected);
  const durationDays = options.durationDays ?? DEMAND_PARAMETERS.DEFAULT_RESPONSE_DURATION_DAYS;
  const foodRate = options.kitsPerPersonPerDay ?? DEMAND_PARAMETERS.FOOD_KITS_PER_PERSON_PER_DAY;
  const waterRate = options.unitsPerPersonPerDay ?? DEMAND_PARAMETERS.WATER_UNITS_PER_PERSON_PER_DAY;
  const boatCapacity = options.boatCapacity ?? DEMAND_PARAMETERS.RESCUE_BOAT_CAPACITY;
  const medicalTeamCapacity = options.medicalTeamCapacity ?? DEMAND_PARAMETERS.MEDICAL_TEAM_CAPACITY;

  // 1. Pure generalized formula calculations
  const formulaFood = calculateFoodDemand(population, {
    kitsPerPersonPerDay: foodRate,
    durationDays,
    applySeverityModifier: options.applySeverityModifier,
    severity,
    applySituationAdjustment: options.applySituationAdjustment,
    accessibility: accessibilityDifficulty,
  });

  const formulaWater = calculateWaterDemand(population, {
    unitsPerPersonPerDay: waterRate,
    durationDays,
    applySeverityModifier: options.applySeverityModifier,
    severity,
    applySituationAdjustment: options.applySituationAdjustment,
    accessibility: accessibilityDifficulty,
  });

  const rescueCalculation = calculateRescueDemand(strandedPeople, { boatCapacity });
  const formulaBoats = rescueCalculation.needed;

  const formulaMedicalTeams = calculateMedicalTeamDemand(population, medicalNeed, {
    medicalTeamCapacity,
  });

  const medicineResult = calculateMedicineDemand(medicalNeed, reports);

  // 2. Available inventory resolution
  const defaultInv = DEFAULT_AVAILABLE_INVENTORY;
  const canonicalData = CANONICAL_ASSAM_DEMO_DATA[zoneId];

  const availFood = availableInventory.food ?? canonicalData?.food?.available ?? defaultInv.food;
  const availWater = availableInventory.water ?? canonicalData?.water?.available ?? defaultInv.water;
  const availBoats = availableInventory.rescueBoats ?? canonicalData?.rescueBoats?.available ?? defaultInv.rescueBoats;
  const availMedical = availableInventory.medicalTeams ?? canonicalData?.medicalTeams?.available ?? defaultInv.medicalTeams;

  // 3. Canonical Demo Override resolution (Section 11)
  const isCanonicalTarget =
    (disasterId === 'DISASTER-001' || !disasterId) &&
    Boolean(canonicalData) &&
    options.useCanonicalDemoOverride !== false;

  const finalFoodNeeded = isCanonicalTarget ? canonicalData.food.needed : formulaFood;
  const finalWaterNeeded = isCanonicalTarget ? canonicalData.water.needed : formulaWater;
  const finalBoatsNeeded = isCanonicalTarget ? canonicalData.rescueBoats.needed : formulaBoats;
  const finalMedicalNeeded = isCanonicalTarget ? canonicalData.medicalTeams.needed : formulaMedicalTeams;
  const finalMedicineLevel = isCanonicalTarget ? canonicalData.medicine.level : medicineResult.level;
  const finalMedicineReason = isCanonicalTarget ? canonicalData.medicine.reason : medicineResult.reason;

  // 4. Calculate gaps safely
  const foodGap = calculateGap(finalFoodNeeded, availFood);
  const waterGap = calculateGap(finalWaterNeeded, availWater);
  const boatsGap = calculateGap(finalBoatsNeeded, availBoats);
  const medicalGap = calculateGap(finalMedicalNeeded, availMedical);

  // 5. Generate human-readable explanations (Section 12)
  const popStr = population.toLocaleString();
  const baseMedicalTeams = Math.ceil(population / (medicalTeamCapacity || 1000));
  const medicalAdj = MEDICAL_NEED_ADJUSTMENTS[normalizeKey(medicalNeed, 'NONE')] || 0;

  const explanation = {
    food: `${popStr} people × ${foodRate} kits/person/day × ${durationDays} days ≈ ${formulaFood.toLocaleString()} kits`,
    water: `${popStr} people × ${waterRate} units/person/day × ${durationDays} days ≈ ${formulaWater.toLocaleString()} units`,
    rescueBoats: rescueCalculation.needed !== null
      ? `${strandedPeople} people needing rescue ÷ ${boatCapacity} per boat = ${rescueCalculation.needed} boats`
      : 'Assessment required — no confirmed stranded count reported',
    medicalTeams: `${baseMedicalTeams} base teams (${popStr} ÷ ${medicalTeamCapacity.toLocaleString()}) + ${medicalAdj} medical need adjustment = ${formulaMedicalTeams} teams`,
    medicine: finalMedicineReason,
    situationAdjustment: `Situation adjustment: ${getSituationAdjustment(accessibilityDifficulty).toFixed(1)}`,
    severityModifier: `Severity modifier: ${getSeverityModifier(severity).toFixed(1)}`,
    isSimulatedDemo: isCanonicalTarget,
    formulaDetails: {
      population,
      durationDays,
      foodRate,
      waterRate,
      boatCapacity,
      medicalTeamCapacity,
      baseFood: formulaFood,
      baseWater: formulaWater,
      baseMedicalTeams,
      medicalAdjustment: medicalAdj,
      strandedCount: strandedPeople ?? null,
      formulaBoats,
      formulaMedicalTeams,
    },
  };

  return {
    zoneId,
    disasterId,
    isCanonicalDemo: isCanonicalTarget,

    food: {
      needed: finalFoodNeeded,
      available: availFood,
      gap: foodGap,
      unit: 'kits',
      formulaNeeded: formulaFood,
      isSimulatedDemo: isCanonicalTarget,
    },

    water: {
      needed: finalWaterNeeded,
      available: availWater,
      gap: waterGap,
      unit: 'units',
      formulaNeeded: formulaWater,
      isSimulatedDemo: isCanonicalTarget,
    },

    rescueBoats: {
      needed: finalBoatsNeeded,
      available: availBoats,
      gap: boatsGap,
      unit: 'boats',
      status: finalBoatsNeeded !== null ? (canonicalData?.rescueBoats?.status || rescueCalculation.status) : 'Assessment Required',
      formulaNeeded: formulaBoats,
      isSimulatedDemo: isCanonicalTarget,
    },

    medicalTeams: {
      needed: finalMedicalNeeded,
      available: availMedical,
      gap: medicalGap,
      unit: 'teams',
      formulaNeeded: formulaMedicalTeams,
      isSimulatedDemo: isCanonicalTarget,
    },

    medicine: {
      level: finalMedicineLevel,
      reason: finalMedicineReason,
      isSimulatedDemo: isCanonicalTarget,
    },

    explanation,
  };
}
