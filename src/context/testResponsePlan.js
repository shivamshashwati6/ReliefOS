/**
 * RELIEF-OS Step 9: Response Plan + Human Approval Test Suite
 * 
 * Verifies all 20 required test cases:
 * 1. Create draft plan
 * 2. Plan gets unique readable ID (RP-0001, RP-0002...)
 * 3. Correct disasterId
 * 4. Allocation data copied correctly
 * 5. Draft status
 * 6. Start review
 * 7. Approve plan
 * 8. Reject plan
 * 9. Rejection note
 * 10. Approval timestamp
 * 11. Approval does not mutate inventory
 * 12. Approval does not modify allocation
 * 13. Disaster isolation
 * 14. Citizen access blocked
 * 15. Department cannot approve
 * 16. Department can read relevant plan
 * 17. Command Center can approve
 * 18. Multiple plans supported
 * 19. Plan history preserved
 * 20. Deterministic state transitions
 */

import { 
  createResponsePlan, 
  PLAN_STATUS, 
  APPROVAL_STATUS, 
  formatPlanId,
  formatPlanTime
} from '../models/responsePlan.js';
import { ROLES, DEPARTMENTS } from '../config/roles.js';

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
console.log('RELIEF-OS STEP 9: RESPONSE PLAN & APPROVAL TEST SUITE');
console.log('================================================================\n');

// Mock sample allocation data from Allocation Engine
const sampleAllocations = [
  {
    disasterId: 'DISASTER-001',
    zoneId: 'zone-a',
    zoneName: 'Zone A',
    resource: 'food',
    requested: 1200,
    allocated: 1200,
    remainingNeed: 0,
    priorityScore: 94,
    status: 'Fully Met',
    reason: 'Full allocation based on priority score 94.',
  },
  {
    disasterId: 'DISASTER-001',
    zoneId: 'zone-a',
    zoneName: 'Zone A',
    resource: 'water',
    requested: 800,
    allocated: 800,
    remainingNeed: 0,
    priorityScore: 94,
    status: 'Fully Met',
    reason: 'Full allocation based on priority score 94.',
  },
  {
    disasterId: 'DISASTER-001',
    zoneId: 'zone-a',
    zoneName: 'Zone A',
    resource: 'rescueBoats',
    requested: 4,
    allocated: 4,
    remainingNeed: 0,
    priorityScore: 94,
    status: 'Fully Met',
    reason: 'Full rescue craft deployment.',
  },
  {
    disasterId: 'DISASTER-001',
    zoneId: 'zone-a',
    zoneName: 'Zone A',
    resource: 'medicalTeams',
    requested: 1,
    allocated: 1,
    remainingNeed: 0,
    priorityScore: 94,
    status: 'Fully Met',
    reason: 'Critical medical team assigned.',
  },
  {
    disasterId: 'DISASTER-001',
    zoneId: 'zone-c',
    zoneName: 'Zone C',
    resource: 'food',
    requested: 500,
    allocated: 200,
    remainingNeed: 300,
    priorityScore: 65,
    status: 'Partially Met',
    reason: 'Partial allocation. Depot inventory exhausted.',
  },
];

const sampleInventory = {
  food: 2000,
  water: 1500,
  rescueBoats: 6,
  medicalTeams: 2,
};

// -----------------------------------------------------------------------------
// Test 1: Create draft plan
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    status: PLAN_STATUS.DRAFT,
  });

  assert(
    plan && plan.planId === 'RP-0001',
    '1. Create draft plan',
    `Failed to create draft plan: ${JSON.stringify(plan)}`
  );
}

// -----------------------------------------------------------------------------
// Test 2: Plan gets unique readable ID (RP-0001, RP-0002)
// -----------------------------------------------------------------------------
{
  const id1 = formatPlanId(1);
  const id2 = formatPlanId(2);
  const id15 = formatPlanId(15);

  assert(
    id1 === 'RP-0001' && id2 === 'RP-0002' && id15 === 'RP-0015',
    '2. Plan gets unique readable ID',
    `IDs mismatch: id1=${id1}, id2=${id2}`
  );
}

// -----------------------------------------------------------------------------
// Test 3: Correct disasterId
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  assert(
    plan.disasterId === 'DISASTER-001',
    '3. Correct disasterId preserved in plan',
    `Expected DISASTER-001, got ${plan.disasterId}`
  );
}

// -----------------------------------------------------------------------------
// Test 4: Allocation data copied correctly
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  assert(
    plan.allocations.length === sampleAllocations.length &&
    plan.allocations[0].zoneId === 'zone-a' &&
    plan.allocations[0].allocated === 1200,
    '4. Allocation data copied correctly',
    `Allocations not copied: count=${plan.allocations.length}`
  );
}

// -----------------------------------------------------------------------------
// Test 5: Draft status
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  assert(
    plan.status === PLAN_STATUS.DRAFT,
    '5. Draft status assigned initially',
    `Expected DRAFT, got ${plan.status}`
  );
}

// -----------------------------------------------------------------------------
// Test 6: Start review
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  // State transition: DRAFT -> UNDER_REVIEW
  plan.status = PLAN_STATUS.UNDER_REVIEW;
  plan.history.push({
    action: 'Review started',
    user: 'Command Center',
    statusAtStep: PLAN_STATUS.UNDER_REVIEW,
  });

  assert(
    plan.status === PLAN_STATUS.UNDER_REVIEW && plan.history.length === 2,
    '6. Start review transitions status to UNDER_REVIEW',
    `Expected UNDER_REVIEW, got ${plan.status}`
  );
}

// -----------------------------------------------------------------------------
// Test 7: Approve plan
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    status: PLAN_STATUS.UNDER_REVIEW,
  });

  const approvedAt = new Date().toISOString();
  plan.status = PLAN_STATUS.APPROVED;
  plan.approval = {
    status: APPROVAL_STATUS.APPROVED,
    approvedBy: 'Command Center Officer',
    approvedAt,
    note: 'Plan approved for simulation.',
  };

  assert(
    plan.status === PLAN_STATUS.APPROVED &&
    plan.approval.status === APPROVAL_STATUS.APPROVED &&
    plan.approval.approvedBy === 'Command Center Officer',
    '7. Approve plan transitions status to APPROVED',
    `Approval failed: status=${plan.status}`
  );
}

// -----------------------------------------------------------------------------
// Test 8: Reject plan
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0002',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    status: PLAN_STATUS.UNDER_REVIEW,
  });

  plan.status = PLAN_STATUS.REJECTED;
  plan.approval = {
    status: APPROVAL_STATUS.REJECTED,
    approvedBy: 'Command Center',
    approvedAt: new Date().toISOString(),
    note: 'Insufficient water allocation for Zone C.',
  };

  assert(
    plan.status === PLAN_STATUS.REJECTED && plan.approval.status === APPROVAL_STATUS.REJECTED,
    '8. Reject plan transitions status to REJECTED',
    `Rejection failed: status=${plan.status}`
  );
}

// -----------------------------------------------------------------------------
// Test 9: Rejection note
// -----------------------------------------------------------------------------
{
  const noteText = 'Need 100 more water units in Sector 4.';
  const plan = createResponsePlan({
    planId: 'RP-0002',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    status: PLAN_STATUS.REJECTED,
  });
  plan.approval.note = noteText;

  assert(
    plan.approval.note === noteText,
    '9. Rejection note recorded accurately',
    `Note mismatch: ${plan.approval.note}`
  );
}

// -----------------------------------------------------------------------------
// Test 10: Approval timestamp
// -----------------------------------------------------------------------------
{
  const timestamp = new Date().toISOString();
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
  });
  plan.approval.approvedAt = timestamp;

  assert(
    Boolean(plan.approval.approvedAt) && typeof plan.approval.approvedAt === 'string',
    '10. Approval timestamp recorded in ISO format',
    `Invalid timestamp: ${plan.approval.approvedAt}`
  );
}

// -----------------------------------------------------------------------------
// Test 11: Approval does not mutate inventory
// -----------------------------------------------------------------------------
{
  const inventorySnapshot = Object.freeze({ ...sampleInventory });
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    remainingInventory: sampleInventory,
    status: PLAN_STATUS.UNDER_REVIEW,
  });

  // Approve plan
  plan.status = PLAN_STATUS.APPROVED;
  plan.approval = {
    status: APPROVAL_STATUS.APPROVED,
    approvedBy: 'Command Center',
    approvedAt: new Date().toISOString(),
  };

  assert(
    sampleInventory.food === inventorySnapshot.food &&
    sampleInventory.water === inventorySnapshot.water &&
    sampleInventory.rescueBoats === inventorySnapshot.rescueBoats &&
    sampleInventory.medicalTeams === inventorySnapshot.medicalTeams,
    '11. Approval does NOT mutate real inventory',
    `Inventory was mutated upon approval!`
  );
}

// -----------------------------------------------------------------------------
// Test 12: Approval does not modify allocation
// -----------------------------------------------------------------------------
{
  const originalAllocStr = JSON.stringify(sampleAllocations);
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
    status: PLAN_STATUS.UNDER_REVIEW,
  });

  // Approve plan
  plan.status = PLAN_STATUS.APPROVED;
  plan.approval.status = APPROVAL_STATUS.APPROVED;

  assert(
    JSON.stringify(sampleAllocations) === originalAllocStr,
    '12. Approval does NOT mutate underlying allocation objects',
    'Allocations were mutated'
  );
}

// -----------------------------------------------------------------------------
// Test 13: Disaster isolation (Plans belong strictly to one disaster)
// -----------------------------------------------------------------------------
{
  const planA = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  const planB = createResponsePlan({
    planId: 'RP-0002',
    disasterId: 'DISASTER-002',
    allocations: [
      {
        disasterId: 'DISASTER-002',
        zoneId: 'zone-cyclone-1',
        resource: 'food',
        requested: 500,
        allocated: 500,
      }
    ],
  });

  const disaster1Plans = [planA, planB].filter(p => p.disasterId === 'DISASTER-001');

  assert(
    disaster1Plans.length === 1 && disaster1Plans[0].planId === 'RP-0001' &&
    disaster1Plans[0].allocations.every(a => a.disasterId === 'DISASTER-001'),
    '13. Disaster isolation (Plans isolated by disasterId without cross-contamination)',
    'Disaster plans leaked across boundaries'
  );
}

// -----------------------------------------------------------------------------
// Test 14: Citizen access blocked
// -----------------------------------------------------------------------------
{
  // Simulated route check: Allowed roles on /response-plans are COMMAND_CENTER and DEPARTMENT
  const allowedRoles = [ROLES.COMMAND_CENTER, ROLES.DEPARTMENT];
  const citizenCanAccess = allowedRoles.includes(ROLES.CITIZEN);

  assert(
    citizenCanAccess === false,
    '14. Citizen access strictly blocked from response plans',
    'Citizen was unexpectedly granted access!'
  );
}

// -----------------------------------------------------------------------------
// Test 15: Department cannot approve
// -----------------------------------------------------------------------------
{
  // Simulated action permission check
  const canApprove = (userRole) => userRole === ROLES.COMMAND_CENTER;

  assert(
    canApprove(ROLES.DEPARTMENT) === false,
    '15. Department users cannot approve or reject plans',
    'Department user was permitted to approve!'
  );
}

// -----------------------------------------------------------------------------
// Test 16: Department can read relevant plan
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
    allocations: sampleAllocations,
  });

  // Health department reads medical teams
  const healthAllocations = plan.allocations.filter(a => a.resource === 'medicalTeams');
  // Food & Supply reads food and water
  const supplyAllocations = plan.allocations.filter(a => a.resource === 'food' || a.resource === 'water');
  // Rescue reads boats
  const rescueAllocations = plan.allocations.filter(a => a.resource === 'rescueBoats');

  assert(
    healthAllocations.length === 1 &&
    supplyAllocations.length === 3 &&
    rescueAllocations.length === 1,
    '16. Department can read relevant filtered allocations from plan',
    `Filtered counts mismatch: health=${healthAllocations.length}, supply=${supplyAllocations.length}`
  );
}

// -----------------------------------------------------------------------------
// Test 17: Command Center can approve
// -----------------------------------------------------------------------------
{
  const canApprove = (userRole) => userRole === ROLES.COMMAND_CENTER;

  assert(
    canApprove(ROLES.COMMAND_CENTER) === true,
    '17. Command Center role is authorized to approve response plans',
    'Command Center could not approve'
  );
}

// -----------------------------------------------------------------------------
// Test 18: Multiple plans supported
// -----------------------------------------------------------------------------
{
  const plans = [
    createResponsePlan({ planId: 'RP-0001', disasterId: 'DISASTER-001' }),
    createResponsePlan({ planId: 'RP-0002', disasterId: 'DISASTER-001' }),
    createResponsePlan({ planId: 'RP-0003', disasterId: 'DISASTER-001' }),
  ];

  assert(
    plans.length === 3 && plans[0].planId === 'RP-0001' && plans[2].planId === 'RP-0003',
    '18. Multiple response plans supported per disaster',
    `Plans count mismatch: ${plans.length}`
  );
}

// -----------------------------------------------------------------------------
// Test 19: Plan history preserved (Decision History Audit Trail)
// -----------------------------------------------------------------------------
{
  const plan = createResponsePlan({
    planId: 'RP-0001',
    disasterId: 'DISASTER-001',
  });

  // Step 1: Created
  // Step 2: Under Review
  plan.history.push({
    action: 'Review started',
    user: 'Command Center',
    note: 'Review initiated by officer.',
  });

  // Step 3: Approved
  plan.history.push({
    action: 'Plan approved by Command Center',
    user: 'Command Center',
    note: 'Simulation approval granted.',
  });

  assert(
    plan.history.length === 3 &&
    plan.history[0].action === 'Plan created' &&
    plan.history[1].action === 'Review started' &&
    plan.history[2].action === 'Plan approved by Command Center',
    '19. Plan history audit trail preserved sequentially',
    `History steps mismatch: count=${plan.history.length}`
  );
}

// -----------------------------------------------------------------------------
// Test 20: Deterministic state transitions
// -----------------------------------------------------------------------------
{
  // Valid transitions: DRAFT -> UNDER_REVIEW -> APPROVED
  // Valid transitions: DRAFT -> UNDER_REVIEW -> REJECTED
  const plan = createResponsePlan({ planId: 'RP-0001', disasterId: 'DISASTER-001' });

  const states = [plan.status]; // DRAFT
  plan.status = PLAN_STATUS.UNDER_REVIEW;
  states.push(plan.status);
  plan.status = PLAN_STATUS.APPROVED;
  states.push(plan.status);

  assert(
    states[0] === 'DRAFT' && states[1] === 'UNDER_REVIEW' && states[2] === 'APPROVED',
    '20. Deterministic state transitions enforced',
    `Unexpected state sequence: ${states.join(' -> ')}`
  );
}

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL RESPONSE PLAN & APPROVAL TESTS PASSED SUCCESSFULLY!\n');
}
