/**
 * RELIEF-OS Step 17 What-If Simulation Engine Test Suite
 * 
 * Verifies pure deterministic simulation calculations:
 * 1. PRD Demo Scenario: Removal of 2 trucks constrains delivery throughput by 1,000 food kits.
 * 2. Deterministic recomputation of affected zone allocations.
 * 3. Shortage calculation and affected zones identification.
 * 4. Idempotency and stability across repeated runs (no cumulative resource loss).
 * 5. Reset to baseline restores original metrics.
 * 6. Immutability of baseline inventories and zone records.
 * 7. Disaster isolation.
 * 8. Transparency note and simulation safety disclaimers.
 */

import {
  calculateSimulatedInventory,
  compareAllocations,
  runWhatIfSimulation
} from './simulationEngine.js';

import {
  FLEET_PARAMETERS,
  PRESET_SCENARIOS,
  SIMULATION_SAFETY_DISCLAIMER,
  LOGISTICS_INTEGRATION_NOTE
} from '../config/simulationParameters.js';

import { INITIAL_ZONES_DATA } from '../data/canonicalZones.js';
import { CANONICAL_SIMULATED_INVENTORY } from '../config/allocationParameters.js';

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
console.log('RELIEF-OS STEP 17 WHAT-IF SIMULATION ENGINE TESTS');
console.log('====================================================');

// Canonical demo zones with explicit demand requested
const testZones = INITIAL_ZONES_DATA.map(z => ({
  ...z,
  zoneId: z.id,
  priorityScore: z.baselineSeverity * 100,
  demand: {
    food: z.id === 'zone-a' ? 1200 : z.id === 'zone-b' ? 800 : 400,
    water: z.id === 'zone-a' ? 800 : z.id === 'zone-b' ? 600 : 300,
    rescueBoats: z.id === 'zone-a' ? 4 : z.id === 'zone-b' ? 2 : 0,
    medicalTeams: z.id === 'zone-a' ? 1 : z.id === 'zone-b' ? 1 : 0
  }
}));

// -----------------------------------------------------------------
// TEST 1: Simulated Inventory Calculation (-2 Trucks Scenario)
// -----------------------------------------------------------------
console.log('\nTest 1: Simulated Inventory Calculation (-2 Trucks Scenario)');
const frozenBaseline = Object.freeze({ ...CANONICAL_SIMULATED_INVENTORY });

const simInv = calculateSimulatedInventory(frozenBaseline, PRESET_SCENARIOS.REMOVE_2_TRUCKS);

assert(simInv.food === 1000, 'Food inventory reduced by 1,000 kits (2 trucks * 500 kits)', `(Got: ${simInv.food})`);
assert(simInv.water === frozenBaseline.water, 'Water inventory remains unaffected by truck removal', `(Got: ${simInv.water})`);
assert(simInv.rescueBoats === frozenBaseline.rescueBoats, 'Boats remain unaffected', `(Got: ${simInv.rescueBoats})`);
assert(simInv.medicalTeams === frozenBaseline.medicalTeams, 'Medical teams remain unaffected', `(Got: ${simInv.medicalTeams})`);
assert(frozenBaseline.food === 2000, 'Original baseline inventory is NOT mutated');

// -----------------------------------------------------------------
// TEST 2: PRD Demo Scenario Recomputation (2-Truck-Removal)
// -----------------------------------------------------------------
console.log('\nTest 2: PRD Demo Scenario Recomputation (2-Truck-Removal)');
const simResult = runWhatIfSimulation({
  zones: testZones,
  baselineInventory: frozenBaseline,
  scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId: 'DISASTER-001'
});

assert(simResult.success === true, 'Simulation completes successfully');
assert(simResult.simulatedFleet.trucks === 4, 'Simulated fleet shows 4 trucks (6 baseline - 2 removed)', `(Got: ${simResult.simulatedFleet.trucks})`);
assert(simResult.simulatedInventory.food === 1000, 'Simulated deliverable food is 1,000 kits');

// Check allocations delta
const comparison = simResult.comparison;
assert(comparison.hasShortageIncrease === true, 'Shortage increase flag is true');
assert(comparison.unmetDemandDelta.food === 1000, 'Unmet food demand increases by exactly +1,000 kits', `(Got: ${comparison.unmetDemandDelta.food})`);
assert(comparison.totalAllocatedDelta.food === -1000, 'Total allocated food decreases by exactly -1,000 kits', `(Got: ${comparison.totalAllocatedDelta.food})`);

// -----------------------------------------------------------------
// TEST 3: Affected Zones Identification & Math
// -----------------------------------------------------------------
console.log('\nTest 3: Affected Zones Identification & Calculated Values');
const affectedFoodZones = comparison.affectedZones.filter(z => z.resource === 'food');
assert(affectedFoodZones.length >= 2, 'Identifies multiple affected zones for food supply');

const zoneA = comparison.allZoneAllocations.find(z => z.zoneId === 'zone-a' && z.resource === 'food');
const zoneB = comparison.allZoneAllocations.find(z => z.zoneId === 'zone-b' && z.resource === 'food');
const zoneC = comparison.allZoneAllocations.find(z => z.zoneId === 'zone-c' && z.resource === 'food');
const zoneD = comparison.allZoneAllocations.find(z => z.zoneId === 'zone-d' && z.resource === 'food');

assert(zoneA.baselineAllocated === 1200, 'Zone A baseline food allocation was 1,200 kits');
assert(zoneA.simulatedAllocated === 680, 'Zone A simulated food allocation drops to 680 kits', `(Got: ${zoneA.simulatedAllocated})`);
assert(zoneA.unmetDiff === 520, 'Zone A suffers a newly created shortage of 520 kits', `(Got: ${zoneA.unmetDiff})`);

assert(zoneB.baselineAllocated === 640, 'Zone B baseline food allocation was 640 kits');
assert(zoneB.simulatedAllocated === 160, 'Zone B simulated food allocation drops to 160 kits (20% minimum coverage)', `(Got: ${zoneB.simulatedAllocated})`);
assert(zoneB.unmetDiff === 480, 'Zone B shortage increases by 480 kits (160 to 640)', `(Got: ${zoneB.unmetDiff})`);

assert(zoneC.simulatedAllocated === 80 && zoneC.allocatedDiff === 0, 'Zone C preserves 80 kits minimum coverage');
assert(zoneD.simulatedAllocated === 80 && zoneD.allocatedDiff === 0, 'Zone D preserves 80 kits minimum coverage');

// -----------------------------------------------------------------
// TEST 4: Idempotency & Stability (No Cumulative Deductions)
// -----------------------------------------------------------------
console.log('\nTest 4: Idempotency & Stability Across Repeated Executions');
let isIdempotent = true;
const initialComparisonJson = JSON.stringify(comparison.unmetDemandDelta);

for (let i = 0; i < 20; i++) {
  const rerun = runWhatIfSimulation({
    zones: testZones,
    baselineInventory: frozenBaseline,
    scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
    disasterId: 'DISASTER-001'
  });
  if (
    JSON.stringify(rerun.comparison.unmetDemandDelta) !== initialComparisonJson ||
    rerun.simulatedInventory.food !== 1000
  ) {
    isIdempotent = false;
    break;
  }
}

assert(isIdempotent, '20 repeated executions produce identical numbers without cumulative deduction');

// -----------------------------------------------------------------
// TEST 5: Baseline Reset Restores Identical Allocations
// -----------------------------------------------------------------
console.log('\nTest 5: Baseline Scenario Reset');
const resetResult = runWhatIfSimulation({
  zones: testZones,
  baselineInventory: frozenBaseline,
  scenario: PRESET_SCENARIOS.BASELINE,
  disasterId: 'DISASTER-001'
});

assert(resetResult.simulatedFleet.trucks === 6, 'Reset restores 6 baseline trucks');
assert(resetResult.simulatedInventory.food === 2000, 'Reset restores 2,000 food kits');
assert(resetResult.comparison.hasShortageIncrease === false, 'Reset exhibits zero shortage increase');
assert(resetResult.comparison.affectedZones.length === 0, 'Reset shows 0 affected zones');

// -----------------------------------------------------------------
// TEST 6: Honest Reporting When Scenario Causes No Shortage
// -----------------------------------------------------------------
console.log('\nTest 6: Honest Reporting on Scenarios With Zero Shortage');
const noShortageScenario = {
  id: 'SLIGHT_WATER_CUT',
  name: 'Minor Water Adjustment (-10 Water)',
  trucksRemoved: 0,
  inventoryDeltas: { food: 0, water: -10, rescueBoats: 0, medicalTeams: 0 }
};
const noShortageResult = runWhatIfSimulation({
  zones: testZones,
  baselineInventory: frozenBaseline,
  scenario: noShortageScenario,
  disasterId: 'DISASTER-001'
});
// Total water requested was 800+600+300+300 = 2,000, inventory was 1,500.
// Cutting 10 units reduces water from 1,500 to 1,490, which causes exactly 10 units unmet increase.
assert(noShortageResult.comparison.totalAllocatedDelta.water === -10, 'Accurately reports exact 10 unit reduction without fabrication');

// -----------------------------------------------------------------
// TEST 7: Disaster Isolation
// -----------------------------------------------------------------
console.log('\nTest 7: Disaster Isolation');
const mixedZones = [
  ...testZones,
  { zoneId: 'zone-other', disasterId: 'DISASTER-999', priorityScore: 99, demand: { food: 900 } }
];

const isolatedResult = runWhatIfSimulation({
  zones: mixedZones,
  baselineInventory: frozenBaseline,
  scenario: PRESET_SCENARIOS.REMOVE_2_TRUCKS,
  disasterId: 'DISASTER-001'
});

const leakedZone = isolatedResult.comparison.allZoneAllocations.find(z => z.zoneId === 'zone-other');
assert(!leakedZone, 'Zones from DISASTER-999 are strictly excluded from DISASTER-001 simulation');

// -----------------------------------------------------------------
// TEST 8: Simulation Safety Disclaimer & Logistics Integration Note
// -----------------------------------------------------------------
console.log('\nTest 8: Simulation Safety Disclaimer & Logistics Integration Note');
assert(simResult.metadata.isSimulated === true, 'Simulation metadata flag is true');
assert(simResult.metadata.disclaimer === SIMULATION_SAFETY_DISCLAIMER, 'Safety disclaimer is strictly attached');
assert(simResult.metadata.integrationNote.includes('Data Model Alignment Note'), 'Explicit logistics integration note is present');

// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`WHAT-IF ENGINE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL WHAT-IF SIMULATION ENGINE TESTS PASSED 100%!');
  process.exit(0);
}
