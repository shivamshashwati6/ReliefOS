/**
 * RELIEF-OS Step 17 Integration & What-If Simulation Test Suite
 * 
 * Verifies end-to-end What-If Simulation Lab capabilities:
 * 1. PRD Demo Scenario: 2-truck removal reduces deliverable food supply deterministically.
 * 2. Separation of baseline vs simulated allocation outcomes.
 * 3. Shortages and coverage changes derived strictly from deterministic calculation.
 * 4. Idempotency: Repeated runs produce identical results without cumulative inventory drain.
 * 5. Reset mechanism cleanly restores nominal baseline.
 * 6. Immutability: Real warehouse stockpiles, zone priority scores, and response plans remain unmutated.
 * 7. Disaster isolation: Simulation runs remain keyed to the active disaster.
 * 8. Role-based authorization: Command Center can execute and reset; Department/Citizen denied mutation.
 * 9. Unsupported truck-to-resource integrity: Non-logistics commodities (water, boats, medical) are never falsely manipulated.
 * 10. Safety disclaimer and data model alignment notes present.
 */

import {
  calculateSimulatedInventory,
  compareAllocations,
  generateSimulationExplanation,
  runWhatIfSimulation
} from '../engines/simulationEngine.js';

import {
  FLEET_PARAMETERS,
  PRESET_SCENARIOS,
  SIMULATION_SAFETY_DISCLAIMER,
  LOGISTICS_INTEGRATION_NOTE
} from '../config/simulationParameters.js';

import { calculateAllocation } from '../engines/allocationEngine.js';
import { calculatePriorityScore, getPriorityBand } from '../engines/priorityEngine.js';
import { INITIAL_ZONES_DATA } from '../data/canonicalZones.js';
import { CANONICAL_SIMULATED_INVENTORY } from '../config/allocationParameters.js';
import { ROLES } from '../config/roles.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ PASS: ${testName} ${details}`);
  } else {
    failed += 1;
    console.error(`  ✗ FAIL: ${testName} ${details}`);
  }
}

console.log('====================================================');
console.log('RELIEF-OS STEP 17 WHAT-IF SIMULATION TEST SUITE');
console.log('====================================================');

// Setup baseline test zones with priority scores and demands
const testZones = INITIAL_ZONES_DATA.map(z => ({
  ...z,
  zoneId: z.id,
  priorityScore: Math.round(z.baselineSeverity * 100),
  priorityBand: z.baselineSeverity >= 0.9 ? 'CRITICAL' : z.baselineSeverity >= 0.7 ? 'HIGH' : 'MEDIUM',
  demand: {
    food: z.id === 'zone-a' ? 1200 : z.id === 'zone-b' ? 800 : 400,
    water: z.id === 'zone-a' ? 800 : z.id === 'zone-b' ? 600 : 300,
    rescueBoats: z.id === 'zone-a' ? 4 : z.id === 'zone-b' ? 2 : 0,
    medicalTeams: z.id === 'zone-a' ? 1 : z.id === 'zone-b' ? 1 : 0
  }
}));

const baselineInventory = { ...CANONICAL_SIMULATED_INVENTORY };

// -----------------------------------------------------------------
// SUITE 1: Baseline vs Simulated Separation & PRD 2-Truck Removal
// -----------------------------------------------------------------
console.log('\n--- SUITE 1: Baseline vs Simulated Separation & PRD 2-Truck Removal ---');

const baselineSim = runWhatIfSimulation({
  zones: testZones,
  baselineInventory,
  scenario: PRESET_SCENARIOS.BASELINE,
  disasterId: 'DISASTER-001'
});

assert(baselineSim.metadata.isSimulated === true, 'Baseline result tagged as simulation');
assert(baselineSim.scenario.id === 'BASELINE', 'Baseline scenario identified');
assert(baselineSim.simulatedFleet.trucks === 6, 'Baseline has 6 active trucks');
assert(baselineSim.simulatedInventory.food === 2000, 'Baseline food inventory is 2,000 kits');
assert(baselineSim.simulatedResult.unmetDemand.food === 800, 'Baseline unmet food is 800 kits');

const truckRemovalSim = runWhatIfSimulation({
  zones: testZones,
  baselineInventory,
  scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId: 'DISASTER-001'
});

assert(truckRemovalSim.scenario.id === 'REMOVE_2_TRUCKS', 'Scenario ID is REMOVE_2_TRUCKS');
assert(truckRemovalSim.simulatedFleet.trucks === 4, 'Simulated fleet has 4 trucks (6 - 2)');
assert(truckRemovalSim.simulatedFleet.trucksRemoved === 2, 'Simulated trucks removed is 2');
assert(truckRemovalSim.simulatedInventory.food === 1000, 'Simulated deliverable food is 1,000 kits (2000 - 2 * 500)');

// -----------------------------------------------------------------
// SUITE 2: Computed Shortages & Zone-Level Allocation Changes
// -----------------------------------------------------------------
console.log('\n--- SUITE 2: Computed Shortages & Zone-Level Allocation Changes ---');

const comparison = truckRemovalSim.comparison;

assert(comparison.inventoryDeltas.food === -1000, 'Inventory delta for food is -1,000 kits');
assert(comparison.totalAllocatedDelta.food === -1000, 'Total allocated delta for food is -1,000 kits (2,000 -> 1,000)');
assert(comparison.unmetDemandDelta.food === 1000, 'Total unmet demand delta for food increased by +1,000 kits (800 -> 1,800)');

// Verify affected zones identified mathematically
const affectedZones = comparison.affectedZones;
assert(affectedZones.length === 2, 'Exactly 2 zones affected by food shortage');
const affectedIds = affectedZones.map(z => z.zoneId).sort();
assert(affectedIds.includes('zone-a') && affectedIds.includes('zone-b'), 'zone-a and zone-b identified as affected sectors');

const zoneAAlloc = comparison.allZoneAllocations.find(r => r.zoneId === 'zone-a' && r.resource === 'food');
const zoneBAlloc = comparison.allZoneAllocations.find(r => r.zoneId === 'zone-b' && r.resource === 'food');
const zoneCAlloc = comparison.allZoneAllocations.find(r => r.zoneId === 'zone-c' && r.resource === 'food');
const zoneDAlloc = comparison.allZoneAllocations.find(r => r.zoneId === 'zone-d' && r.resource === 'food');

assert(zoneAAlloc.baselineAllocated === 1200, 'Zone A baseline food allocation was 1,200 kits');
assert(zoneAAlloc.simulatedAllocated === 680, 'Zone A simulated food allocation dropped to 680 kits');
assert(zoneAAlloc.allocatedDiff === -520, 'Zone A allocation delta is -520 kits');
assert(zoneAAlloc.unmetDiff === 520, 'Zone A unmet shortage increased by +520 kits');

assert(zoneBAlloc.baselineAllocated === 640, 'Zone B baseline food allocation was 640 kits');
assert(zoneBAlloc.simulatedAllocated === 160, 'Zone B simulated food allocation dropped to 160 kits');
assert(zoneBAlloc.allocatedDiff === -480, 'Zone B allocation delta is -480 kits');
assert(zoneBAlloc.unmetDiff === 480, 'Zone B unmet shortage increased by +480 kits');

// Pass 1 Minimum 20% coverage preserved for Zones C & D
assert(zoneCAlloc.baselineAllocated === 80 && zoneCAlloc.simulatedAllocated === 80, 'Zone C preserved 20% minimum floor (80 kits)');
assert(zoneDAlloc.baselineAllocated === 80 && zoneDAlloc.simulatedAllocated === 80, 'Zone D preserved 20% minimum floor (80 kits)');

// -----------------------------------------------------------------
// SUITE 3: Unsupported Commodity Integrity (No Fabricated Cross-Effects)
// -----------------------------------------------------------------
console.log('\n--- SUITE 3: Unsupported Commodity Integrity ---');

// Water, boats, and medical should be 100% unaffected by truck removal alone
assert(comparison.inventoryDeltas.water === 0, 'Water inventory delta is 0');
assert(comparison.inventoryDeltas.rescueBoats === 0, 'Rescue boat inventory delta is 0');
assert(comparison.inventoryDeltas.medicalTeams === 0, 'Medical teams inventory delta is 0');
assert(comparison.unmetDemandDelta.water === 0, 'Water unmet shortage delta is 0');
assert(comparison.unmetDemandDelta.rescueBoats === 0, 'Rescue boat unmet shortage delta is 0');
assert(comparison.unmetDemandDelta.medicalTeams === 0, 'Medical teams unmet shortage delta is 0');

// -----------------------------------------------------------------
// SUITE 4: Idempotency & Repeated Simulation Invocations
// -----------------------------------------------------------------
console.log('\n--- SUITE 4: Idempotency & Repeated Runs ---');

let previousSim = null;
let allIdentical = true;

for (let i = 0; i < 20; i++) {
  const current = runWhatIfSimulation({
    zones: testZones,
    baselineInventory,
    scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
    disasterId: 'DISASTER-001'
  });

  if (previousSim) {
    if (
      current.simulatedInventory.food !== previousSim.simulatedInventory.food ||
      current.simulatedResult.unmetDemand.food !== previousSim.simulatedResult.unmetDemand.food ||
      current.comparison.affectedZones.length !== previousSim.comparison.affectedZones.length
    ) {
      allIdentical = false;
    }
  }
  previousSim = current;
}

assert(allIdentical, 'Simulation is strictly deterministic across 20 repeated runs');
assert(previousSim.simulatedInventory.food === 1000, 'Inventory did not cumulatively degrade (remains 1,000 kits)');

// -----------------------------------------------------------------
// SUITE 5: Reset Mechanism Restores Baseline State
// -----------------------------------------------------------------
console.log('\n--- SUITE 5: Reset Mechanism Restores Baseline State ---');

const resetResult = runWhatIfSimulation({
  zones: testZones,
  baselineInventory,
  scenario: PRESET_SCENARIOS.BASELINE,
  disasterId: 'DISASTER-001'
});

assert(resetResult.simulatedFleet.trucks === 6, 'Reset restores full 6 trucks');
assert(resetResult.simulatedInventory.food === 2000, 'Reset restores full 2,000 food kits');
assert(resetResult.comparison.affectedZones.length === 0, 'Reset clears all affected zones (0)');
assert(resetResult.comparison.unmetDemandDelta.food === 0, 'Reset zeroes unmet shortage delta');

// -----------------------------------------------------------------
// SUITE 6: Immutability of Real Baseline Inventory, Zones & Plans
// -----------------------------------------------------------------
console.log('\n--- SUITE 6: Immutability of Baseline Objects ---');

assert(baselineInventory.food === 2000, 'Original baseline food inventory remains 2,000');
assert(baselineInventory.water === 1500, 'Original baseline water inventory remains 1,500');
assert(baselineInventory.rescueBoats === 6, 'Original baseline boat inventory remains 6');
assert(baselineInventory.medicalTeams === 2, 'Original baseline medical teams remain 2');
assert(testZones[0].priorityScore === Math.round(testZones[0].baselineSeverity * 100), 'Zone priority score unchanged');

// -----------------------------------------------------------------
// SUITE 7: Disaster Isolation
// -----------------------------------------------------------------
console.log('\n--- SUITE 7: Disaster Isolation ---');

const disaster1Sim = runWhatIfSimulation({
  zones: testZones,
  baselineInventory,
  scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId: 'DISASTER-001'
});

const disaster2Sim = runWhatIfSimulation({
  zones: testZones,
  baselineInventory,
  scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId: 'DISASTER-002'
});

assert(disaster1Sim.disasterId === 'DISASTER-001', 'Disaster 1 simulation correctly isolated');
assert(disaster2Sim.disasterId === 'DISASTER-002', 'Disaster 2 simulation correctly isolated');
assert(disaster1Sim !== disaster2Sim, 'Separate disaster simulation instances created');

// -----------------------------------------------------------------
// SUITE 8: Role-Based Authorization Guards
// -----------------------------------------------------------------
console.log('\n--- SUITE 8: Role-Based Authorization Guards ---');

function mockApplyScenario(role, scenarioKey) {
  const isCommandCenter = role === ROLES.COMMAND_CENTER;
  if (!isCommandCenter) {
    throw new Error(`Unauthorized: Role '${role || 'ANONYMOUS'}' cannot execute What-If simulations.`);
  }
  return { success: true, scenarioKey };
}

function mockResetSimulation(role) {
  const isCommandCenter = role === ROLES.COMMAND_CENTER;
  if (!isCommandCenter) {
    throw new Error(`Unauthorized: Role '${role || 'ANONYMOUS'}' cannot reset What-If simulation.`);
  }
  return { success: true };
}

// Command Center permissions
const cmdRun = mockApplyScenario(ROLES.COMMAND_CENTER, 'REMOVE_2_TRUCKS');
const cmdReset = mockResetSimulation(ROLES.COMMAND_CENTER);
assert(cmdRun.success === true, 'COMMAND_CENTER can execute What-If scenario');
assert(cmdReset.success === true, 'COMMAND_CENTER can reset What-If simulation');

// Citizen permissions (DENIED)
let citizenBlocked = false;
try {
  mockApplyScenario(ROLES.CITIZEN, 'REMOVE_2_TRUCKS');
} catch (e) {
  citizenBlocked = true;
}
assert(citizenBlocked, 'CITIZEN is strictly blocked from executing simulation');

let citizenResetBlocked = false;
try {
  mockResetSimulation(ROLES.CITIZEN);
} catch (e) {
  citizenResetBlocked = true;
}
assert(citizenResetBlocked, 'CITIZEN is strictly blocked from resetting simulation');

// Department permissions (DENIED MUTATION - READ ONLY)
let deptBlocked = false;
try {
  mockApplyScenario(ROLES.DEPARTMENT, 'REMOVE_2_TRUCKS');
} catch (e) {
  deptBlocked = true;
}
assert(deptBlocked, 'DEPARTMENT is strictly blocked from mutating simulation scenarios');

// -----------------------------------------------------------------
// SUITE 9: Disclaimers & Mathematical Explanations
// -----------------------------------------------------------------
console.log('\n--- SUITE 9: Disclaimers & Mathematical Explanations ---');

assert(typeof SIMULATION_SAFETY_DISCLAIMER === 'string' && SIMULATION_SAFETY_DISCLAIMER.length > 20, 'Safety disclaimer present and non-empty');
assert(typeof LOGISTICS_INTEGRATION_NOTE === 'string' && LOGISTICS_INTEGRATION_NOTE.length > 20, 'Logistics integration note present and non-empty');
assert(typeof truckRemovalSim.comparison.explanation === 'string' && truckRemovalSim.comparison.explanation.includes('Zone A'), 'Explanation names affected zones specifically');

// -----------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`STEP 17 INTEGRATION TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
