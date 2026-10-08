/**
 * RELIEF-OS Step 8: Resource Allocation Engine Test Suite
 * 
 * Verifies all 22 required test cases for the deterministic allocation engine:
 * 1. Basic food allocation
 * 2. Basic water allocation
 * 3. Priority ordering
 * 4. Equal priority deterministic tie-break
 * 5. Partial allocation
 * 6. Full allocation
 * 7. Remaining inventory
 * 8. Unmet demand
 * 9. No negative inventory
 * 10. No allocation above demand
 * 11. Minimum coverage
 * 12. Insufficient inventory for minimum coverage
 * 13. Rescue boat missing information
 * 14. Medical team allocation
 * 15. Multiple resource types independently
 * 16. Disaster isolation
 * 17. Existing priority score is consumed without recalculation
 * 18. Inventory is not mutated
 * 19. Zero inventory
 * 20. Zero demand
 * 21. Canonical Assam Flood demo allocation
 * 22. Deterministic repeated execution
 */

import { calculateAllocation, extractResourceDemand } from './allocationEngine.js';
import { ALLOCATION_PARAMETERS, CANONICAL_SIMULATED_INVENTORY } from '../config/allocationParameters.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}: ${message}`);
  }
}

console.log('================================================================');
console.log('RELIEF-OS STEP 8: ALLOCATION ENGINE UNIT TESTS');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Basic food allocation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 600 } }
    ]
  };
  const result = calculateAllocation(input);
  const foodAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    foodAlloc && foodAlloc.allocated === 600 && foodAlloc.remainingNeed === 0,
    '1. Basic food allocation',
    `Expected 600 allocated, got ${foodAlloc?.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 2: Basic water allocation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { water: 800 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { water: 500 } }
    ]
  };
  const result = calculateAllocation(input);
  const waterAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'water');
  assert(
    waterAlloc && waterAlloc.allocated === 500 && waterAlloc.remainingNeed === 0,
    '2. Basic water allocation',
    `Expected 500 allocated, got ${waterAlloc?.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 3: Priority ordering
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-LOW', disasterId: 'DISASTER-001', priorityScore: 40, demand: { food: 600 } },
      { zoneId: 'ZONE-HIGH', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 600 } }
    ],
    options: { minimumCoverageRatio: 0 } // test pure priority without minimum coverage
  };
  const result = calculateAllocation(input);
  const highAlloc = result.allocations.find(a => a.zoneId === 'ZONE-HIGH' && a.resource === 'food');
  const lowAlloc = result.allocations.find(a => a.zoneId === 'ZONE-LOW' && a.resource === 'food');
  assert(
    highAlloc.allocated === 600 && lowAlloc.allocated === 400,
    '3. Priority ordering',
    `Expected HIGH=600, LOW=400, got HIGH=${highAlloc.allocated}, LOW=${lowAlloc.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 4: Equal priority deterministic tie-break (zoneId ascending)
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-Z', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 800 } },
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 800 } }
    ],
    options: { minimumCoverageRatio: 0 }
  };
  const result = calculateAllocation(input);
  const aAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  const zAlloc = result.allocations.find(a => a.zoneId === 'ZONE-Z' && a.resource === 'food');
  assert(
    aAlloc.allocated === 800 && zAlloc.allocated === 200,
    '4. Equal priority deterministic tie-break (alphabetical order)',
    `Expected ZONE-A=800, ZONE-Z=200, got ZONE-A=${aAlloc.allocated}, ZONE-Z=${zAlloc.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 5: Partial allocation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 500 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 1000 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    alloc.allocated === 500 && alloc.remainingNeed === 500 && alloc.status === 'Partially Met',
    '5. Partial allocation',
    `Expected allocated=500, remainingNeed=500, got alloc=${alloc.allocated}, need=${alloc.remainingNeed}`
  );
}

// -----------------------------------------------------------------------------
// Test 6: Full allocation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1500 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 1000 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    alloc.allocated === 1000 && alloc.remainingNeed === 0 && alloc.status === 'Fully Met',
    '6. Full allocation',
    `Expected allocated=1000, remainingNeed=0, got alloc=${alloc.allocated}, need=${alloc.remainingNeed}`
  );
}

// -----------------------------------------------------------------------------
// Test 7: Remaining inventory
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 2000, water: 1500 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 1200, water: 800 } }
    ]
  };
  const result = calculateAllocation(input);
  assert(
    result.remainingInventory.food === 800 && result.remainingInventory.water === 700,
    '7. Remaining inventory',
    `Expected remaining food=800, water=700, got food=${result.remainingInventory.food}, water=${result.remainingInventory.water}`
  );
}

// -----------------------------------------------------------------------------
// Test 8: Unmet demand
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 800 } },
      { zoneId: 'ZONE-B', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 600 } }
    ]
  };
  const result = calculateAllocation(input);
  // Total demand = 1400. Stock = 1000. Unmet = 400.
  assert(
    result.unmetDemand.food === 400,
    '8. Unmet demand reporting',
    `Expected unmet food=400, got ${result.unmetDemand.food}`
  );
}

// -----------------------------------------------------------------------------
// Test 9: No negative inventory
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 100, water: 0 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 95, demand: { food: 5000, water: 2000 } }
    ]
  };
  const result = calculateAllocation(input);
  assert(
    result.remainingInventory.food >= 0 && result.remainingInventory.water >= 0 &&
    result.remainingInventory.food === 0 && result.remainingInventory.water === 0,
    '9. No negative inventory',
    `Inventory dropped below zero: food=${result.remainingInventory.food}`
  );
}

// -----------------------------------------------------------------------------
// Test 10: No allocation above demand
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 5000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 300 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    alloc.allocated === 300 && alloc.allocated <= alloc.requested,
    '10. No allocation above demand',
    `Allocated ${alloc.allocated} for requested ${alloc.requested}`
  );
}

// -----------------------------------------------------------------------------
// Test 11: Minimum coverage (20% safeguard)
// -----------------------------------------------------------------------------
{
  // Available food: 2,000. Zone A (p=94, need=1800), Zone B (p=82, need=600), Zone C (p=65, need=500).
  // Without minimum coverage: Zone A takes 1800, Zone B takes 200, Zone C gets 0.
  // With 20% minimum coverage:
  // Pass 1: Zone A gets 360, Zone B gets 120, Zone C gets 100 (Total 580, stock left 1420).
  // Pass 2: Zone A needs 1440, takes 1420 (total 1780). Stock left 0.
  // Result: Zone C receives at least 100 (not starved to 0!).
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 2000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 94, demand: { food: 1800 } },
      { zoneId: 'ZONE-B', disasterId: 'DISASTER-001', priorityScore: 82, demand: { food: 600 } },
      { zoneId: 'ZONE-C', disasterId: 'DISASTER-001', priorityScore: 65, demand: { food: 500 } }
    ],
    options: { minimumCoverageRatio: 0.20 }
  };
  const result = calculateAllocation(input);
  const cAlloc = result.allocations.find(a => a.zoneId === 'ZONE-C' && a.resource === 'food');
  assert(
    cAlloc.allocated === 100,
    '11. Minimum coverage safeguard',
    `Expected Zone C to receive 100 via minimum coverage, got ${cAlloc.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 12: Insufficient inventory for minimum coverage (priority decides)
// -----------------------------------------------------------------------------
{
  // Stock is only 300. Zone A 20% is 240. Zone B 20% is 120 (needs 360 total for full min coverage).
  // Zone A gets 240 in Pass 1. Stock left = 60. Zone B gets 60. Zone C gets 0.
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 300 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 1200 } },
      { zoneId: 'ZONE-B', disasterId: 'DISASTER-001', priorityScore: 80, demand: { food: 600 } },
      { zoneId: 'ZONE-C', disasterId: 'DISASTER-001', priorityScore: 70, demand: { food: 500 } }
    ],
    options: { minimumCoverageRatio: 0.20 }
  };
  const result = calculateAllocation(input);
  const aAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  const bAlloc = result.allocations.find(a => a.zoneId === 'ZONE-B' && a.resource === 'food');
  const cAlloc = result.allocations.find(a => a.zoneId === 'ZONE-C' && a.resource === 'food');
  assert(
    aAlloc.allocated === 240 && bAlloc.allocated === 60 && cAlloc.allocated === 0,
    '12. Insufficient inventory for minimum coverage (priority decides)',
    `Expected A=240, B=60, C=0, got A=${aAlloc.allocated}, B=${bAlloc.allocated}, C=${cAlloc.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 13: Rescue boat missing information (Assessment Required)
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { rescueBoats: 6 },
    zones: [
      {
        zoneId: 'ZONE-A',
        disasterId: 'DISASTER-001',
        priorityScore: 90,
        demand: { rescueBoats: { needed: 4, status: 'Calculated' } }
      },
      {
        zoneId: 'ZONE-B',
        disasterId: 'DISASTER-001',
        priorityScore: 80,
        demand: { rescueBoats: { needed: null, status: 'Assessment Required' } }
      }
    ]
  };
  const result = calculateAllocation(input);
  const bAlloc = result.allocations.find(a => a.zoneId === 'ZONE-B' && a.resource === 'rescueBoats');
  assert(
    bAlloc && bAlloc.status === 'Assessment Required' && bAlloc.allocated === 0 && bAlloc.requested === null,
    '13. Rescue boat missing information safeguard',
    `Expected status 'Assessment Required', got ${bAlloc?.status}, alloc=${bAlloc?.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 14: Medical team allocation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { medicalTeams: 2 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 95, demand: { medicalTeams: 1 } },
      { zoneId: 'ZONE-B', disasterId: 'DISASTER-001', priorityScore: 85, demand: { medicalTeams: 1 } },
      { zoneId: 'ZONE-C', disasterId: 'DISASTER-001', priorityScore: 70, demand: { medicalTeams: 1 } }
    ]
  };
  const result = calculateAllocation(input);
  const aAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'medicalTeams');
  const bAlloc = result.allocations.find(a => a.zoneId === 'ZONE-B' && a.resource === 'medicalTeams');
  const cAlloc = result.allocations.find(a => a.zoneId === 'ZONE-C' && a.resource === 'medicalTeams');
  assert(
    aAlloc.allocated === 1 && bAlloc.allocated === 1 && cAlloc.allocated === 0 && result.remainingInventory.medicalTeams === 0,
    '14. Medical team allocation by priority',
    `Expected A=1, B=1, C=0, got A=${aAlloc.allocated}, B=${bAlloc.allocated}, C=${cAlloc.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 15: Multiple resource types independently
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000, water: 500, rescueBoats: 2, medicalTeams: 1 },
    zones: [
      {
        zoneId: 'ZONE-A',
        disasterId: 'DISASTER-001',
        priorityScore: 90,
        demand: { food: 800, water: 600, rescueBoats: 2, medicalTeams: 1 }
      }
    ]
  };
  const result = calculateAllocation(input);
  const f = result.allocations.find(a => a.resource === 'food');
  const w = result.allocations.find(a => a.resource === 'water');
  const b = result.allocations.find(a => a.resource === 'rescueBoats');
  const m = result.allocations.find(a => a.resource === 'medicalTeams');
  assert(
    f.allocated === 800 && w.allocated === 500 && b.allocated === 2 && m.allocated === 1,
    '15. Multiple resource types handled independently',
    `Food: ${f.allocated}, Water: ${w.allocated}, Boats: ${b.allocated}, Medical: ${m.allocated}`
  );
}

// -----------------------------------------------------------------------------
// Test 16: Disaster isolation (Strict isolation by disasterId)
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 500 } },
      { zoneId: 'ZONE-X', disasterId: 'DISASTER-002', priorityScore: 99, demand: { food: 900 } }
    ]
  };
  const result = calculateAllocation(input);
  const xAlloc = result.allocations.find(a => a.zoneId === 'ZONE-X');
  const aAlloc = result.allocations.find(a => a.zoneId === 'ZONE-A');
  assert(
    !xAlloc && aAlloc.allocated === 500 && result.remainingInventory.food === 500,
    '16. Disaster isolation (excludes zones from other disasters)',
    `ZONE-X from DISASTER-002 was not excluded! Allocations: ${result.allocations.map(a => a.zoneId).join(', ')}`
  );
}

// -----------------------------------------------------------------------------
// Test 17: Existing priority score is consumed without recalculation
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-1', disasterId: 'DISASTER-001', priorityScore: 77.4, demand: { food: 500 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-1' && a.resource === 'food');
  assert(
    alloc.priorityScore === 77.4,
    '17. Existing priority score consumed directly without recalculation',
    `Expected priorityScore 77.4, got ${alloc.priorityScore}`
  );
}

// -----------------------------------------------------------------------------
// Test 18: Inventory is not mutated
// -----------------------------------------------------------------------------
{
  const originalInventory = Object.freeze({ food: 2000, water: 1500, rescueBoats: 6, medicalTeams: 2 });
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { ...originalInventory },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 1200, water: 800 } }
    ]
  };
  const result = calculateAllocation(input);
  assert(
    input.inventory.food === 2000 && input.inventory.water === 1500,
    '18. Input inventory object is NOT mutated',
    `Inventory was mutated! food=${input.inventory.food}`
  );
}

// -----------------------------------------------------------------------------
// Test 19: Zero inventory
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 0, water: 0, rescueBoats: 0, medicalTeams: 0 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 500 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    alloc.allocated === 0 && alloc.remainingNeed === 500 && alloc.status === 'Unmet' && result.remainingInventory.food === 0,
    '19. Zero inventory handled gracefully',
    `Allocated ${alloc.allocated} with 0 inventory`
  );
}

// -----------------------------------------------------------------------------
// Test 20: Zero demand
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 1000 },
    zones: [
      { zoneId: 'ZONE-A', disasterId: 'DISASTER-001', priorityScore: 90, demand: { food: 0 } }
    ]
  };
  const result = calculateAllocation(input);
  const alloc = result.allocations.find(a => a.zoneId === 'ZONE-A' && a.resource === 'food');
  assert(
    alloc.allocated === 0 && alloc.remainingNeed === 0 && alloc.status === 'Zero Demand' && result.remainingInventory.food === 1000,
    '20. Zero demand handled gracefully',
    `Expected 0 allocated and 1000 remaining, got alloc=${alloc.allocated}, rem=${result.remainingInventory.food}`
  );
}

// -----------------------------------------------------------------------------
// Test 21: Canonical Assam Flood demo allocation
// -----------------------------------------------------------------------------
{
  // Canonical demand:
  // Zone A: food=1200, water=800, rescueBoats=4, medicalTeams=1 (Priority: 94)
  // Zone B: food=600, water=400, rescueBoats=null, medicalTeams=1 (Priority: 82)
  // Zone C: food=500, water=300, rescueBoats=null, medicalTeams=0 (Priority: 65)
  // Inventory: food=2000, water=1500, rescueBoats=6, medicalTeams=2
  const input = {
    disasterId: 'DISASTER-001',
    inventory: CANONICAL_SIMULATED_INVENTORY, // { food: 2000, water: 1500, rescueBoats: 6, medicalTeams: 2 }
    zones: [
      {
        zoneId: 'zone-a',
        disasterId: 'DISASTER-001',
        priorityScore: 94,
        priorityBand: 'CRITICAL',
        demand: { food: 1200, water: 800, rescueBoats: 4, medicalTeams: 1 }
      },
      {
        zoneId: 'zone-b',
        disasterId: 'DISASTER-001',
        priorityScore: 82,
        priorityBand: 'HIGH',
        demand: { food: 600, water: 400, rescueBoats: { needed: null, status: 'Assessment Required' }, medicalTeams: 1 }
      },
      {
        zoneId: 'zone-c',
        disasterId: 'DISASTER-001',
        priorityScore: 65,
        priorityBand: 'MEDIUM',
        demand: { food: 500, water: 300, rescueBoats: { needed: null, status: 'Assessment Required' }, medicalTeams: 0 }
      }
    ],
    options: { minimumCoverageRatio: 0.20 }
  };
  const result = calculateAllocation(input);

  // Food check:
  // Total demand = 1200 + 600 + 500 = 2300. Stock = 2000.
  // Pass 1 (20% min coverage): A: 240, B: 120, C: 100. Stock left: 2000 - 460 = 1540.
  // Pass 2: A takes 960 (total 1200). Stock left: 1540 - 960 = 580.
  //         B takes 480 (total 600). Stock left: 580 - 480 = 100.
  //         C takes 100 (total 200). Stock left: 0.
  // Unmet C food: 300.
  const aFood = result.allocations.find(a => a.zoneId === 'zone-a' && a.resource === 'food');
  const bFood = result.allocations.find(a => a.zoneId === 'zone-b' && a.resource === 'food');
  const cFood = result.allocations.find(a => a.zoneId === 'zone-c' && a.resource === 'food');
  const aBoats = result.allocations.find(a => a.zoneId === 'zone-a' && a.resource === 'rescueBoats');
  const bBoats = result.allocations.find(a => a.zoneId === 'zone-b' && a.resource === 'rescueBoats');

  assert(
    aFood.allocated === 1200 && bFood.allocated === 600 && cFood.allocated === 200 &&
    result.remainingInventory.food === 0 && result.unmetDemand.food === 300 &&
    aBoats.allocated === 4 && bBoats.status === 'Assessment Required' &&
    result.remainingInventory.rescueBoats === 2,
    '21. Canonical Assam Flood demo allocation',
    `A Food: ${aFood.allocated}, B Food: ${bFood.allocated}, C Food: ${cFood.allocated}, Rem Food: ${result.remainingInventory.food}, A Boats: ${aBoats.allocated}, Rem Boats: ${result.remainingInventory.rescueBoats}`
  );
}

// -----------------------------------------------------------------------------
// Test 22: Deterministic repeated execution
// -----------------------------------------------------------------------------
{
  const input = {
    disasterId: 'DISASTER-001',
    inventory: { food: 2000, water: 1500, rescueBoats: 6, medicalTeams: 2 },
    zones: [
      { zoneId: 'zone-a', disasterId: 'DISASTER-001', priorityScore: 94, demand: { food: 1200, water: 800, rescueBoats: 4, medicalTeams: 1 } },
      { zoneId: 'zone-b', disasterId: 'DISASTER-001', priorityScore: 82, demand: { food: 600, water: 400, rescueBoats: null, medicalTeams: 1 } },
      { zoneId: 'zone-c', disasterId: 'DISASTER-001', priorityScore: 65, demand: { food: 500, water: 300, rescueBoats: null, medicalTeams: 0 } }
    ]
  };
  const run1 = JSON.stringify(calculateAllocation(input));
  const run2 = JSON.stringify(calculateAllocation(input));
  const run3 = JSON.stringify(calculateAllocation(input));
  assert(
    run1 === run2 && run2 === run3,
    '22. Deterministic repeated execution (identical across multiple runs)',
    'Results differed across runs'
  );
}

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL ALLOCATION ENGINE TESTS PASSED SUCCESSFULLY!\n');
}
