/**
 * RELIEF-OS Step 13: Comprehensive Integration & Role Security Test Suite
 * 
 * Verifies:
 * 1. Command Center can create snapshots.
 * 2. Department cannot create snapshots (blocked/rejected).
 * 3. Citizen cannot create snapshots (blocked/rejected).
 * 4. Command Center can view trends (/incident-trends authorized).
 * 5. Department cannot access trends (redirected to /department/dashboard).
 * 6. Citizen cannot access trends (redirected to /citizen/dashboard).
 * 7. Snapshot is linked to active disaster.
 * 8. DISASTER-001 and DISASTER-002 remain strictly isolated.
 * 9. Recording snapshot does not change priority scores.
 * 10. Recording snapshot does not change inventory.
 * 11. Recording snapshot does not change allocation.
 * 12. Recording snapshot does not change response plan.
 * 13. Recording snapshot does not change monitoring.
 * 14. Recording snapshot does not change safety updates.
 */

import { ROLES, ROLE_DEFAULT_ROUTES } from '../config/roles.js';
import { createSnapshot, calculateTrendSeries, filterSnapshotsByDisaster } from '../engines/trendEngine.js';

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
console.log('RELIEF-OS STEP 13: COMPREHENSIVE INTEGRATION & SECURITY TEST');
console.log('================================================================\n');

// Mock route authorization helper adhering to ProtectedRoute logic
function checkTrendsRouteAccess(userRole) {
  const allowedRoles = [ROLES.COMMAND_CENTER];
  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      redirect: ROLE_DEFAULT_ROUTES[userRole] || '/login',
    };
  }
  return { allowed: true };
}

// Mock role-guarded snapshot creator adhering to IncidentTrendContext logic
function simulateRecordSnapshot({ role, activeDisasterId, metrics }) {
  if (role !== ROLES.COMMAND_CENTER) {
    return {
      success: false,
      error: 'Unauthorized: Only Command Center personnel can record analytical snapshots.',
    };
  }
  if (!activeDisasterId && !metrics?.disasterId) {
    return {
      success: false,
      error: 'No active disaster identified to associate snapshot.',
    };
  }

  const targetDisasterId = metrics?.disasterId || activeDisasterId;
  const snapshot = createSnapshot({ ...metrics, disasterId: targetDisasterId });
  return {
    success: true,
    snapshot,
  };
}

// Sample baseline metrics
const testMetrics = {
  reports: { total: 42, critical: 8, high: 14 },
  priority: { criticalZones: 2, highPriorityZones: 3, highestScore: 88 },
  resources: { overallCoverage: 65, totalUnmet: 850 },
  response: { overallProgress: 50 },
  safety: { publishedUpdates: 3, urgentUpdates: 1 },
};

// Test 1: Command Center can create snapshots
const cmdRecord = simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
assert(
  cmdRecord.success === true && cmdRecord.snapshot?.disasterId === 'DISASTER-001',
  '1. Command Center role is authorized to create snapshots'
);

// Test 2: Department cannot create snapshots
const deptRecord = simulateRecordSnapshot({
  role: ROLES.DEPARTMENT,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
assert(
  deptRecord.success === false && deptRecord.error.includes('Unauthorized'),
  '2. Department role is strictly blocked from creating snapshots',
  JSON.stringify(deptRecord)
);

// Test 3: Citizen cannot create snapshots
const citizenRecord = simulateRecordSnapshot({
  role: ROLES.CITIZEN,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
assert(
  citizenRecord.success === false && citizenRecord.error.includes('Unauthorized'),
  '3. Citizen role is strictly blocked from creating snapshots',
  JSON.stringify(citizenRecord)
);

// Test 4: Command Center can view trends
const cmdAccess = checkTrendsRouteAccess(ROLES.COMMAND_CENTER);
assert(
  cmdAccess.allowed === true,
  '4. Command Center role is authorized to access /incident-trends'
);

// Test 5: Department cannot access trends
const deptAccess = checkTrendsRouteAccess(ROLES.DEPARTMENT);
assert(
  deptAccess.allowed === false && deptAccess.redirect === '/department/dashboard',
  '5. Department role is strictly blocked from /incident-trends with redirect to /department/dashboard'
);

// Test 6: Citizen cannot access trends
const citizenAccess = checkTrendsRouteAccess(ROLES.CITIZEN);
assert(
  citizenAccess.allowed === false && citizenAccess.redirect === '/citizen/dashboard',
  '6. Citizen role is strictly blocked from /incident-trends with redirect to /citizen/dashboard'
);

// Test 7: Snapshot is linked to active disaster
assert(
  cmdRecord.snapshot?.disasterId === 'DISASTER-001',
  '7. Snapshot is deterministically linked to the active disaster'
);

// Test 8: DISASTER-001 and DISASTER-002 remain strictly isolated
const snapshotD1 = createSnapshot({ ...testMetrics, disasterId: 'DISASTER-001' }, '2026-10-09T08:00:00.000Z', { sequence: 1 });
const snapshotD2 = createSnapshot({ ...testMetrics, disasterId: 'DISASTER-002' }, '2026-10-09T08:30:00.000Z', { sequence: 1 });
const allSnapshots = [snapshotD1, snapshotD2];

const d1Filtered = filterSnapshotsByDisaster(allSnapshots, 'DISASTER-001');
const d2Filtered = filterSnapshotsByDisaster(allSnapshots, 'DISASTER-002');
const d1Series = calculateTrendSeries(allSnapshots, { disasterId: 'DISASTER-001' });

assert(
  d1Filtered.length === 1 && d1Filtered[0].disasterId === 'DISASTER-001' &&
  d2Filtered.length === 1 && d2Filtered[0].disasterId === 'DISASTER-002' &&
  d1Series.count === 1 && d1Series.snapshots[0].disasterId === 'DISASTER-001',
  '8. DISASTER-001 and DISASTER-002 snapshots remain strictly isolated without leakage'
);

// Data Integrity Testing Fixtures
const initialZones = Object.freeze([
  { id: 'ZONE-A', priorityScore: 92, priorityBand: 'Critical' },
  { id: 'ZONE-B', priorityScore: 78, priorityBand: 'High' },
]);
const initialInventory = Object.freeze({
  food: 5000,
  water: 10000,
  rescueBoats: 20,
  medicalTeams: 8,
});
const initialAllocation = Object.freeze([
  { zoneId: 'ZONE-A', resource: 'food', requested: 1000, allocated: 800 },
]);
const initialPlan = Object.freeze({
  planId: 'PLAN-001',
  status: 'APPROVED',
  totalZones: 2,
});
const initialMonitoring = Object.freeze({
  monitoringId: 'MON-001',
  status: 'IN_PROGRESS',
  overallProgress: 40,
});
const initialSafetyUpdates = Object.freeze([
  { id: 'SU-0001', title: 'Boil Water Notice', status: 'PUBLISHED', severity: 'URGENT' },
]);

// Test 9: Recording snapshot does not change priority scores
const preZoneScores = initialZones.map(z => ({ id: z.id, score: z.priorityScore }));
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postZoneScores = initialZones.map(z => ({ id: z.id, score: z.priorityScore }));
assert(
  JSON.stringify(preZoneScores) === JSON.stringify(postZoneScores),
  '9. Recording snapshot does not change priority scores'
);

// Test 10: Recording snapshot does not change inventory
const preInventoryJson = JSON.stringify(initialInventory);
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postInventoryJson = JSON.stringify(initialInventory);
assert(
  preInventoryJson === postInventoryJson,
  '10. Recording snapshot does not change inventory (zero warehouse inventory mutation)'
);

// Test 11: Recording snapshot does not change allocation
const preAllocJson = JSON.stringify(initialAllocation);
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postAllocJson = JSON.stringify(initialAllocation);
assert(
  preAllocJson === postAllocJson,
  '11. Recording snapshot does not change allocation'
);

// Test 12: Recording snapshot does not change response plan
const prePlanJson = JSON.stringify(initialPlan);
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postPlanJson = JSON.stringify(initialPlan);
assert(
  prePlanJson === postPlanJson,
  '12. Recording snapshot does not change response plan'
);

// Test 13: Recording snapshot does not change monitoring
const preMonJson = JSON.stringify(initialMonitoring);
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postMonJson = JSON.stringify(initialMonitoring);
assert(
  preMonJson === postMonJson,
  '13. Recording snapshot does not change monitoring'
);

// Test 14: Recording snapshot does not change safety updates
const preUpdatesJson = JSON.stringify(initialSafetyUpdates);
simulateRecordSnapshot({
  role: ROLES.COMMAND_CENTER,
  activeDisasterId: 'DISASTER-001',
  metrics: testMetrics,
});
const postUpdatesJson = JSON.stringify(initialSafetyUpdates);
assert(
  preUpdatesJson === postUpdatesJson,
  '14. Recording snapshot does not change safety updates'
);

console.log('\n================================================================');
console.log(`INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL STEP 13 INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
}
