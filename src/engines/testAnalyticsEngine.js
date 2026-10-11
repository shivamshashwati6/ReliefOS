/**
 * RELIEF-OS Step 12: Incident Analytics Engine Test Suite
 * 
 * Verifies all 25 required test scenarios:
 * 1. Report count
 * 2. Critical report count
 * 3. High report count
 * 4. Medium report count
 * 5. Low report count
 * 6. Pending report count
 * 7. Processed report count
 * 8. Total zones
 * 9. Critical zones
 * 10. High zones
 * 11. Highest priority zone
 * 12. Priority sorting
 * 13. Resource requested
 * 14. Resource allocated
 * 15. Resource unmet
 * 16. Coverage calculation
 * 17. Coverage clamp
 * 18. Zero-demand coverage
 * 19. Response progress
 * 20. No monitoring state
 * 21. Safety update counts
 * 22. Urgent update count
 * 23. Disaster isolation
 * 24. Overall situation classification
 * 25. Deterministic insight generation
 */

import {
  calculateReportAnalytics,
  calculatePriorityAnalytics,
  calculateResourceAnalytics,
  calculateResponseAnalytics,
  calculateSafetyUpdateAnalytics,
  calculateOverallIncidentSituation,
  generateKeyTakeaways,
  calculateOverallIncidentAnalytics,
} from './analyticsEngine.js';
import { UPDATE_STATUS, UPDATE_SEVERITY } from '../models/safetyUpdate.js';

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
console.log('RELIEF-OS STEP 12: INCIDENT ANALYTICS ENGINE TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// Mock Data Setup
// -------------------------------------------------------------
const mockReports = [
  { id: 'R1', severity: 'Critical', status: 'Processed', aiProcessed: true },
  { id: 'R2', severity: 'Critical', status: 'Processed', aiProcessed: true },
  { id: 'R3', severity: 'High', status: 'Reviewed', aiProcessed: false },
  { id: 'R4', severity: 'Medium', status: 'New', aiProcessed: false },
  { id: 'R5', severity: 'Low', status: 'New', aiProcessed: false },
  { id: 'R6', severity: null, status: 'New', aiProcessed: false }, // Unspecified
];

const mockZones = [
  { id: 'zone-b', name: 'Zone B', priorityScore: 75, priorityBand: 'High', affectedPopulation: 2200 },
  { id: 'zone-a', name: 'Zone A', priorityScore: 94, priorityBand: 'Critical', affectedPopulation: 3842 },
  { id: 'zone-c', name: 'Zone C', priorityScore: 45, priorityBand: 'Low', affectedPopulation: 1100 },
  { id: 'zone-d', name: 'Zone D', priorityScore: 94, priorityBand: 'Critical', affectedPopulation: 1500 }, // Equal score tie-break test
];

const mockAllocations = [
  { resource: 'food', requested: 1200, allocated: 900 },
  { resource: 'food', requested: 800, allocated: 800 }, // Total food: req 2000, alloc 1700, unmet 300
  { resource: 'water', requested: 1500, allocated: 1500 }, // Total water: req 1500, alloc 1500, unmet 0
  { resource: 'rescueBoats', requested: 10, allocated: 6 }, // Total boats: req 10, alloc 6, unmet 4
  { resource: 'medicalTeams', requested: 4, allocated: 4 }, // Total med: req 4, alloc 4, unmet 0
];

const mockMonitoring = {
  monitoringId: 'MON-0001',
  status: 'IN_PROGRESS',
  overallProgress: 65,
  zoneProgress: [
    { zoneId: 'zone-a', status: 'IN_PROGRESS', overallProgress: 70 },
    { zoneId: 'zone-b', status: 'COMPLETED', overallProgress: 100 },
    { zoneId: 'zone-c', status: 'NOT_STARTED', overallProgress: 0 },
  ],
};

const mockUpdates = [
  { updateId: 'SU-0001', status: UPDATE_STATUS.PUBLISHED, severity: UPDATE_SEVERITY.URGENT, expiresAt: null },
  { updateId: 'SU-0002', status: UPDATE_STATUS.PUBLISHED, severity: UPDATE_SEVERITY.CAUTION, expiresAt: null },
  { updateId: 'SU-0003', status: UPDATE_STATUS.PUBLISHED, severity: UPDATE_SEVERITY.INFO, expiresAt: null },
  { updateId: 'SU-0004', status: UPDATE_STATUS.DRAFT, severity: UPDATE_SEVERITY.INFO, expiresAt: null },
  { updateId: 'SU-0005', status: UPDATE_STATUS.UNDER_REVIEW, severity: UPDATE_SEVERITY.CAUTION, expiresAt: null },
  { updateId: 'SU-0006', status: UPDATE_STATUS.ARCHIVED, severity: UPDATE_SEVERITY.URGENT, expiresAt: null },
  { updateId: 'SU-0007', status: UPDATE_STATUS.PUBLISHED, severity: UPDATE_SEVERITY.URGENT, expiresAt: '2020-01-01T00:00:00Z' }, // Expired
];

// -------------------------------------------------------------
// Test 1-7: Report Analytics
// -------------------------------------------------------------
const reportAnalytics = calculateReportAnalytics(mockReports);

assert(reportAnalytics.totalReports === 6, '1. Report count', `Expected 6, got ${reportAnalytics.totalReports}`);
assert(reportAnalytics.criticalReports === 2, '2. Critical report count', `Expected 2, got ${reportAnalytics.criticalReports}`);
assert(reportAnalytics.highReports === 1, '3. High report count', `Expected 1, got ${reportAnalytics.highReports}`);
assert(reportAnalytics.mediumReports === 1, '4. Medium report count', `Expected 1, got ${reportAnalytics.mediumReports}`);
assert(reportAnalytics.lowReports === 1, '5. Low report count', `Expected 1, got ${reportAnalytics.lowReports}`);
assert(reportAnalytics.pendingReports === 4, '6. Pending report count', `Expected 4, got ${reportAnalytics.pendingReports}`);
assert(reportAnalytics.processedReports === 2, '7. Processed report count', `Expected 2, got ${reportAnalytics.processedReports}`);

// -------------------------------------------------------------
// Test 8-12: Priority Zone Analytics
// -------------------------------------------------------------
const priorityAnalytics = calculatePriorityAnalytics(mockZones);

assert(priorityAnalytics.totalZones === 4, '8. Total zones', `Expected 4, got ${priorityAnalytics.totalZones}`);
assert(priorityAnalytics.criticalZones === 2, '9. Critical zones count', `Expected 2, got ${priorityAnalytics.criticalZones}`);
assert(priorityAnalytics.highPriorityZones === 1, '10. High zones count', `Expected 1, got ${priorityAnalytics.highPriorityZones}`);
assert(
  priorityAnalytics.highestPriorityZone?.name === 'Zone A' && priorityAnalytics.highestPriorityScore === 94,
  '11. Highest priority zone identification',
  `Expected Zone A (94), got ${priorityAnalytics.highestPriorityZone?.name} (${priorityAnalytics.highestPriorityScore})`
);

// Deterministic tie-break check: Zone A and Zone D both have 94; alphabetically zone-a comes before zone-d
assert(
  priorityAnalytics.sortedZones[0].id === 'zone-a' &&
  priorityAnalytics.sortedZones[1].id === 'zone-d' &&
  priorityAnalytics.sortedZones[2].id === 'zone-b' &&
  priorityAnalytics.sortedZones[3].id === 'zone-c',
  '12. Priority sorting (score descending with deterministic alphabetical tie-break)',
  `Unexpected sort order: ${priorityAnalytics.sortedZones.map(z => z.id).join(', ')}`
);

// -------------------------------------------------------------
// Test 13-18: Resource Analytics
// -------------------------------------------------------------
const resourceAnalytics = calculateResourceAnalytics(mockAllocations);
const foodRes = resourceAnalytics.resources.find(r => r.key === 'food');

assert(
  resourceAnalytics.totalRequested === 2000 + 1500 + 10 + 4,
  '13. Resource requested aggregation',
  `Expected 3514, got ${resourceAnalytics.totalRequested}`
);

assert(
  resourceAnalytics.totalAllocated === 1700 + 1500 + 6 + 4,
  '14. Resource allocated aggregation',
  `Expected 3210, got ${resourceAnalytics.totalAllocated}`
);

assert(
  foodRes.unmet === 300 && resourceAnalytics.totalUnmet === 300 + 0 + 4 + 0,
  '15. Resource unmet demand computation',
  `Expected totalUnmet 304, got ${resourceAnalytics.totalUnmet}`
);

// Food coverage: 1700 / 2000 * 100 = 85%
assert(
  foodRes.coverage === 85,
  '16. Coverage calculation percentage',
  `Expected 85%, got ${foodRes.coverage}%`
);

// Coverage clamp test (allocation exceeding requested or below zero)
const clampTest = calculateResourceAnalytics([
  { resource: 'food', requested: 100, allocated: 250 }, // Over-allocation clamp
  { resource: 'water', requested: 100, allocated: -20 }, // Negative clamp
]);
const clampedFood = clampTest.resources.find(r => r.key === 'food');
const clampedWater = clampTest.resources.find(r => r.key === 'water');
assert(
  clampedFood.coverage === 100 && clampedWater.coverage === 0,
  '17. Coverage clamp (bounded strictly between 0 and 100%)',
  `Food: ${clampedFood.coverage}, Water: ${clampedWater.coverage}`
);

// Zero-demand coverage test
const zeroDemandTest = calculateResourceAnalytics([]);
const zeroRes = zeroDemandTest.resources.find(r => r.key === 'food');
assert(
  zeroRes.coverage === 100 && zeroDemandTest.overallCoverage === 100,
  '18. Zero-demand coverage defaults safely to 100%',
  `Expected 100%, got ${zeroRes.coverage}%`
);

// -------------------------------------------------------------
// Test 19-20: Response Monitoring Analytics
// -------------------------------------------------------------
const responseAnalytics = calculateResponseAnalytics(mockMonitoring);
assert(
  responseAnalytics.hasMonitoring === true &&
  responseAnalytics.overallProgress === 65 &&
  responseAnalytics.zonesInProgress === 1 &&
  responseAnalytics.completedZones === 1 &&
  responseAnalytics.remainingWork === 35,
  '19. Response progress analytics extraction',
  `Progress: ${responseAnalytics.overallProgress}, Remaining: ${responseAnalytics.remainingWork}`
);

const emptyMonitoringAnalytics = calculateResponseAnalytics(null);
assert(
  emptyMonitoringAnalytics.hasMonitoring === false &&
  emptyMonitoringAnalytics.message.includes('No approved response plan'),
  '20. No monitoring state handled gracefully',
  `Expected fallback message, got: ${emptyMonitoringAnalytics.message}`
);

// -------------------------------------------------------------
// Test 21-22: Safety Update Analytics
// -------------------------------------------------------------
const safetyAnalytics = calculateSafetyUpdateAnalytics(mockUpdates);
assert(
  safetyAnalytics.totalUpdates === 7 &&
  safetyAnalytics.publishedUpdates === 3 && // SU-1, SU-2, SU-3 (SU-7 is expired)
  safetyAnalytics.draftUpdates === 1 &&
  safetyAnalytics.underReviewUpdates === 1 &&
  safetyAnalytics.archivedUpdates === 1 &&
  safetyAnalytics.expiredUpdates === 1,
  '21. Safety update counts breakdown',
  `Published: ${safetyAnalytics.publishedUpdates}, Expired: ${safetyAnalytics.expiredUpdates}`
);

assert(
  safetyAnalytics.urgentUpdates === 1, // Only SU-1 is published, active and URGENT
  '22. Urgent update count reflects only active, published notices',
  `Expected 1, got ${safetyAnalytics.urgentUpdates}`
);

// -------------------------------------------------------------
// Test 23: Disaster Isolation
// -------------------------------------------------------------
const dis1Reports = [{ id: 'R1', disasterId: 'DISASTER-001', severity: 'Critical' }];
const dis2Reports = [{ id: 'R2', disasterId: 'DISASTER-002', severity: 'Low' }];
const dis1Analytics = calculateReportAnalytics(dis1Reports);
const dis2Analytics = calculateReportAnalytics(dis2Reports);
assert(
  dis1Analytics.criticalReports === 1 && dis2Analytics.criticalReports === 0 &&
  dis1Analytics.lowReports === 0 && dis2Analytics.lowReports === 1,
  '23. Disaster isolation: Analytics accurately calculated per isolated disaster set',
  'Disaster reports cross-contaminated'
);

// -------------------------------------------------------------
// Test 24: Overall Situation Classification
// -------------------------------------------------------------
// With critical zones (2), situation should classify as CRITICAL
const situationCritical = calculateOverallIncidentSituation({
  priorityAnalytics,
  resourceAnalytics,
  responseAnalytics,
  safetyAnalytics,
});
assert(
  situationCritical.level === 'CRITICAL' && situationCritical.explanation.includes('Critical'),
  '24. Overall situation classification (CRITICAL triggered deterministically)',
  `Expected CRITICAL, got ${situationCritical.level}: ${situationCritical.explanation}`
);

// Test HIGH ATTENTION trigger
const situationHigh = calculateOverallIncidentSituation({
  priorityAnalytics: { criticalZones: 0, highPriorityZones: 1 },
  resourceAnalytics: { overallCoverage: 75 },
  responseAnalytics: { hasMonitoring: false },
  safetyAnalytics: { urgentUpdates: 0 },
});
assert(
  situationHigh.level === 'HIGH_ATTENTION' && situationHigh.explanation.includes('High Attention'),
  '24b. Overall situation classification (HIGH_ATTENTION triggered deterministically)',
  `Expected HIGH_ATTENTION, got ${situationHigh.level}`
);

// Test STABLE / MANAGED trigger
const situationStable = calculateOverallIncidentSituation({
  priorityAnalytics: { criticalZones: 0, highPriorityZones: 0 },
  resourceAnalytics: { overallCoverage: 95 },
  responseAnalytics: { hasMonitoring: true, overallProgress: 100 },
  safetyAnalytics: { urgentUpdates: 0 },
});
assert(
  situationStable.level === 'STABLE_MANAGED' && situationStable.explanation.includes('Stable / Managed'),
  '24c. Overall situation classification (STABLE_MANAGED triggered deterministically)',
  `Expected STABLE_MANAGED, got ${situationStable.level}`
);

// -------------------------------------------------------------
// Test 25: Deterministic Insight Generation
// -------------------------------------------------------------
const takeaways = generateKeyTakeaways({
  priorityAnalytics,
  resourceAnalytics,
  responseAnalytics,
  safetyAnalytics,
  overallSituation: situationCritical,
});
assert(
  takeaways.length >= 3 &&
  takeaways.some(t => t.includes('Zone A has the highest current priority score')) &&
  takeaways.some(t => t.includes('largest unmet resource demand')) &&
  takeaways.some(t => t.includes('65% complete')),
  '25. Deterministic insight generation creates transparent, fact-based insights',
  `Takeaways: ${JSON.stringify(takeaways)}`
);

// Master integration call test
const masterAnalytics = calculateOverallIncidentAnalytics({
  reports: mockReports,
  zones: mockZones,
  allocations: mockAllocations,
  monitoringRecord: mockMonitoring,
  updates: mockUpdates,
});
assert(
  Boolean(masterAnalytics.reports) && Boolean(masterAnalytics.situation) && Boolean(masterAnalytics.timestamp),
  '25b. Unified master analytics calculation outputs complete structured model',
  'Master analytics incomplete'
);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed === 0) {
  console.log('ALL 25 INCIDENT ANALYTICS ENGINE TESTS PASSED SUCCESSFULLY!\n');
} else {
  console.error(`FAILED ${failed} TESTS. PLEASE REVIEW LOGS.\n`);
  process.exit(1);
}
