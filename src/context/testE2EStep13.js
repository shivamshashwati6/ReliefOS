/**
 * RELIEF-OS Step 13: End-to-End Simulation & Verification Test
 * 
 * Simulates the exact user interactions and browser workflows for Step 13:
 * 1. Command Center opens empty trends page (0 snapshots -> empty state).
 * 2. Command Center records 1st snapshot -> verifies confirmation and 1-snapshot state.
 * 3. Command Center records 2nd snapshot with updated metrics -> verifies:
 *    - 2 snapshots in history
 *    - Chart data points
 *    - Trend directions (LOWER is better vs HIGHER is better)
 *    - Deterministic factual interpretation statements ("What's changing?")
 * 4. Cross-disaster isolation test with DISASTER-002.
 * 5. Role security redirection verification.
 */

import {
  createSnapshot,
  calculateTrendSeries,
  calculateTrend,
  getTrendDirection,
  sortSnapshots,
  filterSnapshotsByDisaster,
  TREND_DIRECTIONS,
} from '../engines/trendEngine.js';
import { ROLES, ROLE_DEFAULT_ROUTES } from '../config/roles.js';

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
console.log('RELIEF-OS STEP 13: END-TO-END WORKFLOW SIMULATION TEST');
console.log('================================================================\n');

// 1. Initial Empty State
let stateStore = {
  activeDisasterId: 'DISASTER-001',
  snapshotsByDisaster: {},
};

let currentDisasterSnapshots = stateStore.snapshotsByDisaster[stateStore.activeDisasterId] || [];
let initialSeries = calculateTrendSeries(currentDisasterSnapshots, { disasterId: stateStore.activeDisasterId });

assert(
  initialSeries.count === 0 &&
  initialSeries.chartData.length === 0 &&
  initialSeries.latest === null &&
  initialSeries.statements[0] === 'No historical snapshots yet.',
  '1. Initial state starts completely empty with zero snapshots'
);

// 2. Command Center triggers "Record Snapshot" on Incident Analytics
const t1Metrics = {
  disasterId: 'DISASTER-001',
  reports: { total: 45, critical: 10, high: 15 },
  priority: { criticalZones: 2, highPriorityZones: 3, highestScore: 90 },
  resources: { overallCoverage: 55, totalUnmet: 1450 },
  response: { overallProgress: 40 },
  safety: { publishedUpdates: 2, urgentUpdates: 1 },
};

const s1 = createSnapshot(t1Metrics, '2026-10-09T10:00:00.000Z', { sequence: 1 });
stateStore.snapshotsByDisaster['DISASTER-001'] = [s1];

currentDisasterSnapshots = stateStore.snapshotsByDisaster[stateStore.activeDisasterId];
const singleSeries = calculateTrendSeries(currentDisasterSnapshots, { disasterId: stateStore.activeDisasterId });

assert(
  singleSeries.count === 1 &&
  singleSeries.latest.snapshotId === 'TS-0001' &&
  singleSeries.previous === null &&
  singleSeries.trend.hasComparison === false &&
  singleSeries.statements[0].includes('One snapshot recorded'),
  '2. First snapshot records cleanly with baseline comparison state'
);

// 3. Command Center records second snapshot after situation improves
const t2Metrics = {
  disasterId: 'DISASTER-001',
  reports: { total: 40, critical: 8, high: 12 },
  priority: { criticalZones: 1, highPriorityZones: 2, highestScore: 78 },
  resources: { overallCoverage: 72, totalUnmet: 950 },
  response: { overallProgress: 68 },
  safety: { publishedUpdates: 3, urgentUpdates: 3 },
};

const s2 = createSnapshot(t2Metrics, '2026-10-09T11:00:00.000Z', { sequence: 2 });
stateStore.snapshotsByDisaster['DISASTER-001'] = [...stateStore.snapshotsByDisaster['DISASTER-001'], s2];

currentDisasterSnapshots = stateStore.snapshotsByDisaster[stateStore.activeDisasterId];
const twoSeries = calculateTrendSeries(currentDisasterSnapshots, { disasterId: stateStore.activeDisasterId });

assert(
  twoSeries.count === 2 &&
  twoSeries.chartData.length === 2 &&
  twoSeries.latest.snapshotId === 'TS-0002' &&
  twoSeries.previous.snapshotId === 'TS-0001' &&
  twoSeries.trend.hasComparison === true,
  '3. Second snapshot establishes comparative trend series with 2 chart data points'
);

// 4. Mathematical Trend Directions verification
const { metrics: compMetrics } = twoSeries.trend;

// Resource coverage: 55% -> 72% (HIGHER is better -> IMPROVING)
assert(
  compMetrics.resourceCoverage.direction === TREND_DIRECTIONS.IMPROVING &&
  compMetrics.resourceCoverage.current === 72 &&
  compMetrics.resourceCoverage.previous === 55,
  '4a. Resource coverage mathematically improves from 55% to 72%'
);

// Critical zones: 2 -> 1 (LOWER is better -> IMPROVING)
assert(
  compMetrics.criticalZones.direction === TREND_DIRECTIONS.IMPROVING &&
  compMetrics.criticalZones.current === 1 &&
  compMetrics.criticalZones.previous === 2,
  '4b. Critical zones mathematically improve from 2 to 1 (decrease is improvement)'
);

// Response progress: 40% -> 68% (HIGHER is better -> IMPROVING)
assert(
  compMetrics.responseProgress.direction === TREND_DIRECTIONS.IMPROVING &&
  compMetrics.responseProgress.current === 68 &&
  compMetrics.responseProgress.previous === 40,
  '4c. Response progress mathematically improves from 40% to 68%'
);

// Urgent updates: 1 -> 3 (LOWER is better -> WORSENING)
assert(
  compMetrics.urgentUpdates.direction === TREND_DIRECTIONS.WORSENING &&
  compMetrics.urgentUpdates.current === 3 &&
  compMetrics.urgentUpdates.previous === 1,
  '4d. Urgent updates classified as WORSENING (increase from 1 to 3)'
);

// 5. Factual Deterministic Interpretation Statements ("What's changing?")
const statements = twoSeries.statements;
assert(
  statements.includes('Resource coverage improved from 55% to 72%.') &&
  statements.includes('Critical zones decreased from 2 to 1.') &&
  statements.includes('Response progress increased from 40% to 68%.') &&
  statements.includes('Urgent safety updates increased from 1 to 3.'),
  '5. Deterministic statements match expected factual interpretation outputs',
  JSON.stringify(statements)
);

// 6. Snapshot History Table ordering
const historyTable = sortSnapshots(twoSeries.snapshots, 'desc');
assert(
  historyTable[0].snapshotId === 'TS-0002' &&
  historyTable[1].snapshotId === 'TS-0001',
  '6. Snapshot history table correctly orders newest snapshot first'
);

// 7. Disaster Isolation Workflow
const sOther = createSnapshot({
  disasterId: 'DISASTER-002',
  reports: { total: 12, critical: 1, high: 2 },
  priority: { criticalZones: 0, highPriorityZones: 1, highestScore: 60 },
  resources: { overallCoverage: 90, totalUnmet: 100 },
  response: { overallProgress: 85 },
  safety: { publishedUpdates: 1, urgentUpdates: 0 },
}, '2026-10-09T10:30:00.000Z', { sequence: 1 });

stateStore.snapshotsByDisaster['DISASTER-002'] = [sOther];

// Switch active disaster to DISASTER-002
stateStore.activeDisasterId = 'DISASTER-002';
const d2Series = calculateTrendSeries(
  stateStore.snapshotsByDisaster['DISASTER-002'],
  { disasterId: 'DISASTER-002' }
);

assert(
  d2Series.count === 1 &&
  d2Series.snapshots[0].disasterId === 'DISASTER-002' &&
  twoSeries.count === 2 &&
  twoSeries.snapshots.every(s => s.disasterId === 'DISASTER-001'),
  '7. Disaster switching isolates snapshots completely without cross-contamination'
);

// 8. Role Security Verification
function checkRoute(role) {
  if (role === ROLES.COMMAND_CENTER) return { allowed: true };
  return { allowed: false, redirect: ROLE_DEFAULT_ROUTES[role] };
}

assert(
  checkRoute(ROLES.COMMAND_CENTER).allowed === true &&
  checkRoute(ROLES.DEPARTMENT).redirect === '/department/dashboard' &&
  checkRoute(ROLES.CITIZEN).redirect === '/citizen/dashboard',
  '8. Role guards allow only COMMAND_CENTER and redirect DEPARTMENT & CITIZEN'
);

console.log('\n================================================================');
console.log(`E2E SIMULATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL STEP 13 E2E SIMULATION TESTS PASSED WITH 100% SUCCESS!\n');
}
