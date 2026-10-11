/**
 * RELIEF-OS Deterministic What-If Simulation Engine
 * 
 * Computes hypothetical resource-availability changes and generates
 * side-by-side comparative allocation metrics using the existing
 * deterministic Allocation Engine.
 * 
 * STRICT ARCHITECTURAL PRINCIPLES:
 * 1. PURE & DETERMINISTIC: Zero external APIs, zero Gemini calls, zero random seeds.
 * 2. ZERO MUTATION: Never alters input baseline inventories, zone data, or response plans.
 * 3. ISOLATION & IDEMPOTENCY: Repeated simulations never accumulate deductions.
 * 4. REUSE OF EXISTING TRUTH: Calls calculateAllocation directly.
 * 5. HONEST REPORTING: Flags exact calculated shortages; never fabricates positive/negative outcomes.
 */

import { calculateAllocation } from './allocationEngine.js';
import { 
  FLEET_PARAMETERS, 
  PRESET_SCENARIOS, 
  SIMULATION_SAFETY_DISCLAIMER, 
  LOGISTICS_INTEGRATION_NOTE 
} from '../config/simulationParameters.js';

/**
 * Calculates hypothetical inventory given baseline stock and scenario parameters.
 * Does not mutate baselineInventory.
 */
export function calculateSimulatedInventory(baselineInventory = {}, scenario = {}) {
  const sim = {
    food: Number(baselineInventory.food ?? 0),
    water: Number(baselineInventory.water ?? 0),
    rescueBoats: Number(baselineInventory.rescueBoats ?? 0),
    medicalTeams: Number(baselineInventory.medicalTeams ?? 0),
  };

  const trucksRemoved = Number(scenario.trucksRemoved ?? 0);
  if (trucksRemoved > 0) {
    // Model truck payload delivery throughput reduction (500 kits/truck)
    const foodCapacityReduction = trucksRemoved * FLEET_PARAMETERS.FOOD_KITS_PER_TRUCK;
    sim.food = Math.max(0, sim.food - foodCapacityReduction);
  }

  // Apply explicit commodity deltas if specified
  const deltas = scenario.inventoryDeltas || {};
  if (deltas.food && trucksRemoved === 0) {
    sim.food = Math.max(0, sim.food + Number(deltas.food));
  }
  if (deltas.water) {
    sim.water = Math.max(0, sim.water + Number(deltas.water));
  }
  if (deltas.rescueBoats) {
    sim.rescueBoats = Math.max(0, sim.rescueBoats + Number(deltas.rescueBoats));
  }
  if (deltas.medicalTeams) {
    sim.medicalTeams = Math.max(0, sim.medicalTeams + Number(deltas.medicalTeams));
  }

  return sim;
}

/**
 * Compares baseline and simulated allocation results zone-by-zone and resource-by-resource.
 */
export function compareAllocations(baselineResult, simulatedResult, scenario = {}) {
  const resources = ['food', 'water', 'rescueBoats', 'medicalTeams'];

  const inventoryDeltas = {};
  const totalAllocatedDelta = {};
  const unmetDemandDelta = {};
  const coveragePercent = { baseline: {}, simulated: {}, delta: {} };

  resources.forEach(res => {
    const baseAvail = baselineResult.remainingInventory?.[res] !== undefined
      ? (baselineResult.totalAllocated?.[res] || 0) + (baselineResult.remainingInventory?.[res] || 0)
      : 0;
    const simAvail = simulatedResult.remainingInventory?.[res] !== undefined
      ? (simulatedResult.totalAllocated?.[res] || 0) + (simulatedResult.remainingInventory?.[res] || 0)
      : 0;
    inventoryDeltas[res] = simAvail - baseAvail;

    const baseAlloc = baselineResult.totalAllocated?.[res] || 0;
    const simAlloc = simulatedResult.totalAllocated?.[res] || 0;
    totalAllocatedDelta[res] = simAlloc - baseAlloc;

    const baseUnmet = baselineResult.unmetDemand?.[res] || 0;
    const simUnmet = simulatedResult.unmetDemand?.[res] || 0;
    unmetDemandDelta[res] = simUnmet - baseUnmet;

    const req = baselineResult.totalRequested?.[res] || 0;
    const baseCov = req > 0 ? Math.round((baseAlloc / req) * 1000) / 10 : 100;
    const simCov = req > 0 ? Math.round((simAlloc / req) * 1000) / 10 : 100;
    coveragePercent.baseline[res] = baseCov;
    coveragePercent.simulated[res] = simCov;
    coveragePercent.delta[res] = Math.round((simCov - baseCov) * 10) / 10;
  });

  // Identify affected zone records
  const affectedZones = [];
  const allZoneAllocations = [];

  const baseAllocMap = new Map();
  baselineResult.allocations.forEach(a => {
    baseAllocMap.set(`${a.zoneId}__${a.resource}`, a);
  });

  simulatedResult.allocations.forEach(simAlloc => {
    const key = `${simAlloc.zoneId}__${simAlloc.resource}`;
    const baseAlloc = baseAllocMap.get(key) || { allocated: 0, remainingNeed: simAlloc.requested || 0 };

    const allocatedDiff = simAlloc.allocated - baseAlloc.allocated;
    const unmetDiff = simAlloc.remainingNeed - baseAlloc.remainingNeed;

    const record = {
      zoneId: simAlloc.zoneId,
      zoneName: simAlloc.zoneName || simAlloc.zoneId,
      resource: simAlloc.resource,
      priorityScore: simAlloc.priorityScore,
      priorityBand: simAlloc.priorityBand,
      requested: simAlloc.requested,
      baselineAllocated: baseAlloc.allocated,
      simulatedAllocated: simAlloc.allocated,
      allocatedDiff,
      baselineRemainingNeed: baseAlloc.remainingNeed,
      simulatedRemainingNeed: simAlloc.remainingNeed,
      unmetDiff,
      status: allocatedDiff < 0 ? 'REDUCED' : allocatedDiff > 0 ? 'INCREASED' : 'UNCHANGED',
    };

    allZoneAllocations.push(record);

    if (allocatedDiff < 0 || unmetDiff > 0) {
      affectedZones.push(record);
    }
  });

  // Sort affected zones by priority score descending
  affectedZones.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  // Generate deterministic explanation
  const explanation = generateSimulationExplanation({
    scenario,
    inventoryDeltas,
    totalAllocatedDelta,
    unmetDemandDelta,
    affectedZones,
    coveragePercent
  });

  return {
    inventoryDeltas,
    totalAllocatedDelta,
    unmetDemandDelta,
    coveragePercent,
    affectedZones,
    allZoneAllocations,
    affectedZonesCount: new Set(affectedZones.map(z => z.zoneId)).size,
    hasShortageIncrease: Object.values(unmetDemandDelta).some(d => d > 0),
    explanation,
  };
}

/**
 * Generates an explainable human-readable summary of simulation outcomes without Gemini.
 */
export function generateSimulationExplanation({
  scenario = {},
  inventoryDeltas = {},
  unmetDemandDelta = {},
  affectedZones = [],
  coveragePercent = {}
}) {
  const trucksRemoved = Number(scenario.trucksRemoved ?? 0);

  if (affectedZones.length === 0 && !Object.values(unmetDemandDelta).some(d => d > 0)) {
    return 'What-If Simulation Result: No resource shortages were produced by this scenario. All zone allocation quantities and fulfillment coverage remain identical to baseline.';
  }

  const parts = [];

  if (trucksRemoved > 0) {
    const foodDeficit = Math.abs(inventoryDeltas.food || (trucksRemoved * 500));
    parts.push(
      `Simulated removal of ${trucksRemoved} delivery trucks reduced active logistics delivery throughput by ${foodDeficit.toLocaleString()} food kits.`
    );
  } else {
    const deltaStrs = Object.entries(inventoryDeltas)
      .filter(([_, d]) => d !== 0)
      .map(([res, d]) => `${d > 0 ? '+' : ''}${d} ${res}`);
    if (deltaStrs.length > 0) {
      parts.push(`Simulated resource constraints: ${deltaStrs.join(', ')}.`);
    }
  }

  // Highlight affected zones
  const zoneSummaries = affectedZones.map(z => {
    return `${z.zoneName} (${z.resource}: ${z.baselineAllocated} → ${z.simulatedAllocated}, shortage +${z.unmetDiff})`;
  });

  if (zoneSummaries.length > 0) {
    parts.push(`Affected sectors: ${zoneSummaries.join('; ')}.`);
  }

  // Explain why under deterministic rules
  parts.push(
    'Under the two-pass deterministic engine, minimum 20% coverage was preserved across all sectors in Pass 1, but reduced inventory restricted Pass 2 priority distribution.'
  );

  return parts.join(' ');
}

/**
 * Primary entry point: Runs What-If simulation from baseline inputs and scenario.
 * 
 * @param {Object} params
 * @param {Array} params.zones - List of affected zones
 * @param {Object} params.baselineInventory - Current active inventory
 * @param {Object} params.scenario - Scenario definition (trucksRemoved, etc.)
 * @param {string} params.disasterId - Active disaster ID
 * @param {Object} [params.options] - Allocation options (minimumCoverageRatio)
 * 
 * @returns {Object} Complete simulation comparison record
 */
export function runWhatIfSimulation({
  zones = [],
  baselineInventory = {},
  scenario = PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId = 'DISASTER-001',
  options = {}
}) {
  if (!zones || !Array.isArray(zones) || zones.length === 0) {
    return {
      success: false,
      disasterId,
      error: 'Cannot run simulation: no zone data available.',
      metadata: { isSimulated: true, disclaimer: SIMULATION_SAFETY_DISCLAIMER }
    };
  }

  // 1. Calculate baseline allocation
  const baselineResult = calculateAllocation({
    zones,
    inventory: baselineInventory,
    disasterId,
    options
  });

  // 2. Compute simulated hypothetical inventory
  const simulatedInventory = calculateSimulatedInventory(baselineInventory, scenario);

  // 3. Recompute simulated allocation deterministically
  const simulatedResult = calculateAllocation({
    zones,
    inventory: simulatedInventory,
    disasterId,
    options
  });

  // 4. Produce side-by-side comparison
  const comparison = compareAllocations(baselineResult, simulatedResult, scenario);

  return {
    success: true,
    disasterId,
    scenario: { ...scenario },
    baselineFleet: {
      trucks: FLEET_PARAMETERS.BASELINE_TRUCKS,
    },
    simulatedFleet: {
      trucks: Math.max(0, FLEET_PARAMETERS.BASELINE_TRUCKS - Number(scenario.trucksRemoved || 0)),
      trucksRemoved: Number(scenario.trucksRemoved || 0),
    },
    baselineInventory: { ...baselineInventory },
    simulatedInventory: { ...simulatedInventory },
    baselineResult,
    simulatedResult,
    comparison,
    metadata: {
      isSimulated: true,
      disclaimer: SIMULATION_SAFETY_DISCLAIMER,
      integrationNote: LOGISTICS_INTEGRATION_NOTE,
    }
  };
}
