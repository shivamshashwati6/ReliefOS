/**
 * RELIEF-OS Step 13: Incident Trend Engine Unit Tests
 * 
 * Verifies all 25 core engine requirements:
 * 1. Snapshot creation
 * 2. Snapshot validation
 * 3. Required disasterId
 * 4. Required timestamp
 * 5. Snapshot sorting
 * 6. Latest snapshot
 * 7. Increasing report trend
 * 8. Decreasing report trend
 * 9. Stable report trend
 * 10. Increasing resource coverage
 * 11. Decreasing resource coverage
 * 12. Stable resource coverage
 * 13. Increasing response progress
 * 14. Decreasing response progress
 * 15. Stable response progress
 * 16. Critical zone trend
 * 17. High priority zone trend
 * 18. Unmet demand trend
 * 19. Urgent safety update trend
 * 20. Threshold handling
 * 21. Multiple snapshots
 * 22. Chronological ordering
 * 23. Disaster isolation
 * 24. Deterministic output
 * 25. No source-data mutation
 */

import {
  createSnapshot,
  validateSnapshot,
  sortSnapshots,
  getLatestSnapshot,
  getTrendDirection,
  calculateTrend,
  calculateTrendSeries,
  filterSnapshotsByDisaster,
  TREND_DIRECTIONS,
} from './trendEngine.js';

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
console.log('RELIEF-OS STEP 13: INCIDENT TREND ENGINE TEST SUITE');
console.log('================================================================\n');

// Sample valid metrics fixture
const sampleMetrics = {
  disasterId: 'DISASTER-001',
  reports: { total: 100, critical: 20, high: 35 },
  priority: { criticalZones: 2, highPriorityZones: 4, highestScore: 92 },
  resources: { overallCoverage: 60, totalUnmet: 1200 },
  response: { overallProgress: 45 },
  safety: { publishedUpdates: 5, urgentUpdates: 2 },
};

// 1. Snapshot creation
const snapshot1 = createSnapshot(sampleMetrics, '2026-10-09T08:00:00.000Z', { sequence: 1 });
assert(
  snapshot1.snapshotId === 'TS-0001' &&
  snapshot1.disasterId === 'DISASTER-001' &&
  snapshot1.timestamp === '2026-10-09T08:00:00.000Z' &&
  snapshot1.reports.total === 100 &&
  snapshot1.priority.criticalZones === 2 &&
  snapshot1.resources.overallCoverage === 60 &&
  snapshot1.response.overallProgress === 45 &&
  snapshot1.safety.urgentUpdates === 2,
  '1. Snapshot creation produces standard schema structure',
  JSON.stringify(snapshot1)
);

// 2. Snapshot validation
const validRes = validateSnapshot(snapshot1);
assert(
  validRes.isValid === true && Object.keys(validRes.errors).length === 0,
  '2. Snapshot validation passes for valid snapshot'
);

// 3. Required disasterId
let errorDisaster = null;
try {
  createSnapshot({ ...sampleMetrics, disasterId: '' });
} catch (err) {
  errorDisaster = err.message;
}
assert(
  errorDisaster !== null && errorDisaster.includes('disasterId'),
  '3. Required disasterId is enforced during creation and validation',
  `Error caught: ${errorDisaster}`
);

// 4. Required timestamp
const invalidTsRes = validateSnapshot({ ...snapshot1, timestamp: 'invalid-date' });
assert(
  invalidTsRes.isValid === false && invalidTsRes.errors.timestamp !== undefined,
  '4. Required timestamp validation rejects invalid timestamp string',
  JSON.stringify(invalidTsRes)
);

// 5. Snapshot sorting
const sA = { snapshotId: 'TS-0001', disasterId: 'D1', timestamp: '2026-10-09T08:00:00.000Z' };
const sB = { snapshotId: 'TS-0002', disasterId: 'D1', timestamp: '2026-10-09T10:00:00.000Z' };
const sC = { snapshotId: 'TS-0003', disasterId: 'D1', timestamp: '2026-10-09T09:00:00.000Z' };
const sortedAsc = sortSnapshots([sB, sA, sC], 'asc');
assert(
  sortedAsc[0].snapshotId === 'TS-0001' && sortedAsc[1].snapshotId === 'TS-0003' && sortedAsc[2].snapshotId === 'TS-0002',
  '5. Snapshot sorting correctly orders chronologically (oldest to newest)'
);

// 6. Latest snapshot
const latestFound = getLatestSnapshot([sB, sA, sC]);
assert(
  latestFound?.snapshotId === 'TS-0002',
  '6. Latest snapshot identifies snapshot with most recent timestamp'
);

// 7. Increasing report trend (LOWER is better -> increasing is WORSENING)
const incReportDir = getTrendDirection(120, 100, false, 5);
assert(
  incReportDir === TREND_DIRECTIONS.WORSENING,
  '7. Increasing report trend is classified as WORSENING (lower is better)'
);

// 8. Decreasing report trend (LOWER is better -> decreasing is IMPROVING)
const decReportDir = getTrendDirection(80, 100, false, 5);
assert(
  decReportDir === TREND_DIRECTIONS.IMPROVING,
  '8. Decreasing report trend is classified as IMPROVING (lower is better)'
);

// 9. Stable report trend (diff <= threshold -> STABLE)
const stableReportDir = getTrendDirection(102, 100, false, 5);
assert(
  stableReportDir === TREND_DIRECTIONS.STABLE,
  '9. Stable report trend when delta is within stability threshold'
);

// 10. Increasing resource coverage (HIGHER is better -> increasing is IMPROVING)
const incCovDir = getTrendDirection(75, 60, true, 5);
assert(
  incCovDir === TREND_DIRECTIONS.IMPROVING,
  '10. Increasing resource coverage is classified as IMPROVING'
);

// 11. Decreasing resource coverage (HIGHER is better -> decreasing is WORSENING)
const decCovDir = getTrendDirection(45, 60, true, 5);
assert(
  decCovDir === TREND_DIRECTIONS.WORSENING,
  '11. Decreasing resource coverage is classified as WORSENING'
);

// 12. Stable resource coverage
const stableCovDir = getTrendDirection(62, 60, true, 5);
assert(
  stableCovDir === TREND_DIRECTIONS.STABLE,
  '12. Stable resource coverage when change is <= threshold'
);

// 13. Increasing response progress (HIGHER is better -> increasing is IMPROVING)
const incProgDir = getTrendDirection(70, 45, true, 5);
assert(
  incProgDir === TREND_DIRECTIONS.IMPROVING,
  '13. Increasing response progress is classified as IMPROVING'
);

// 14. Decreasing response progress (HIGHER is better -> decreasing is WORSENING)
const decProgDir = getTrendDirection(35, 45, true, 5);
assert(
  decProgDir === TREND_DIRECTIONS.WORSENING,
  '14. Decreasing response progress is classified as WORSENING'
);

// 15. Stable response progress
const stableProgDir = getTrendDirection(47, 45, true, 5);
assert(
  stableProgDir === TREND_DIRECTIONS.STABLE,
  '15. Stable response progress within threshold'
);

// 16. Critical zone trend (LOWER is better -> 1 vs 2 is IMPROVING)
const decCritZonesDir = getTrendDirection(1, 2, false, 0);
assert(
  decCritZonesDir === TREND_DIRECTIONS.IMPROVING,
  '16. Critical zone trend: decrease from 2 to 1 is IMPROVING'
);

// 17. High priority zone trend (LOWER is better -> 5 vs 3 is WORSENING)
const incHighZonesDir = getTrendDirection(5, 3, false, 0);
assert(
  incHighZonesDir === TREND_DIRECTIONS.WORSENING,
  '17. High priority zone trend: increase from 3 to 5 is WORSENING'
);

// 18. Unmet demand trend (LOWER is better -> 800 vs 1200 is IMPROVING)
const decUnmetDir = getTrendDirection(800, 1200, false, 50);
assert(
  decUnmetDir === TREND_DIRECTIONS.IMPROVING,
  '18. Unmet demand trend: reduction in unmet demand is IMPROVING'
);

// 19. Urgent safety update trend (LOWER is better -> 4 vs 2 is WORSENING)
const incUrgentDir = getTrendDirection(4, 2, false, 0);
assert(
  incUrgentDir === TREND_DIRECTIONS.WORSENING,
  '19. Urgent safety update trend: increase from 2 to 4 is WORSENING'
);

// 20. Threshold handling
assert(
  getTrendDirection(54, 50, true, 5) === TREND_DIRECTIONS.STABLE &&
  getTrendDirection(56, 50, true, 5) === TREND_DIRECTIONS.IMPROVING &&
  getTrendDirection(44, 50, true, 5) === TREND_DIRECTIONS.WORSENING &&
  getTrendDirection(44, 50, false, 5) === TREND_DIRECTIONS.IMPROVING,
  '20. Threshold handling correctly evaluates values at and around threshold boundaries'
);

// 21. Multiple snapshots
const s1 = createSnapshot(sampleMetrics, '2026-10-09T08:00:00.000Z', { sequence: 1 });
const s2 = createSnapshot({
  ...sampleMetrics,
  resources: { overallCoverage: 75, totalUnmet: 800 },
  priority: { criticalZones: 1, highPriorityZones: 3, highestScore: 82 },
  response: { overallProgress: 65 },
  safety: { publishedUpdates: 6, urgentUpdates: 1 },
}, '2026-10-09T09:00:00.000Z', { sequence: 2 });
const s3 = createSnapshot({
  ...sampleMetrics,
  resources: { overallCoverage: 85, totalUnmet: 400 },
  priority: { criticalZones: 0, highPriorityZones: 2, highestScore: 68 },
  response: { overallProgress: 80 },
  safety: { publishedUpdates: 6, urgentUpdates: 0 },
}, '2026-10-09T10:00:00.000Z', { sequence: 3 });

const seriesRes = calculateTrendSeries([s1, s2, s3]);
assert(
  seriesRes.count === 3 && seriesRes.chartData.length === 3 && seriesRes.latest.snapshotId === 'TS-0003',
  '21. Multiple snapshots processed seamlessly in calculateTrendSeries'
);

// 22. Chronological ordering
const shuffledSeries = calculateTrendSeries([s3, s1, s2]);
assert(
  shuffledSeries.snapshots[0].snapshotId === 'TS-0001' &&
  shuffledSeries.snapshots[1].snapshotId === 'TS-0002' &&
  shuffledSeries.snapshots[2].snapshotId === 'TS-0003',
  '22. Chronological ordering preserved regardless of input array insertion order'
);

// 23. Disaster isolation
const sOther = createSnapshot({
  ...sampleMetrics,
  disasterId: 'DISASTER-002',
}, '2026-10-09T08:30:00.000Z', { sequence: 99 });
const isolatedList = filterSnapshotsByDisaster([s1, sOther, s2], 'DISASTER-001');
assert(
  isolatedList.length === 2 && isolatedList.every((s) => s.disasterId === 'DISASTER-001'),
  '23. Disaster isolation ensures DISASTER-001 does not leak into DISASTER-002'
);

// 24. Deterministic output
const trendResA = calculateTrend(s2, s1);
const trendResB = calculateTrend(s2, s1);
assert(
  JSON.stringify(trendResA) === JSON.stringify(trendResB) &&
  trendResA.metrics.resourceCoverage.direction === TREND_DIRECTIONS.IMPROVING &&
  trendResA.statements.length > 0,
  '24. Deterministic output produces identical calculations and factual interpretation statements'
);

// 25. No source-data mutation
const originalSample = JSON.parse(JSON.stringify(sampleMetrics));
const testSnapshot = createSnapshot(sampleMetrics, '2026-10-09T08:00:00.000Z');
calculateTrend(testSnapshot, s1);
calculateTrendSeries([testSnapshot, s1, s2]);
assert(
  JSON.stringify(sampleMetrics) === JSON.stringify(originalSample),
  '25. No source-data mutation occurs on inputs throughout engine lifecycle'
);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL 25 INCIDENT TREND ENGINE TESTS PASSED SUCCESSFULLY!\n');
}
