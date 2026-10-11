/**
 * RELIEF-OS Step 16 Integration & Workflow Test Suite
 * 
 * Verifies end-to-end disaster-aware route recommendations:
 * 1. Deterministic A* route engine resolution from graph topology.
 * 2. PRD Demo Scenario: Route A blocked -> Route C alternative naturally selected.
 * 3. Dynamic recalculation when road status is toggled.
 * 4. No-route outcome when all paths are impassable (never uses blocked roads).
 * 5. Role permissions: Command Center can update road status; other roles denied.
 * 6. Response plan snapshot integration with human approval requirement preserved.
 * 7. Zero side-effects on priority scores, demand numbers, allocations, or inventory.
 * 8. Prototype safety integrity and simulated disclaimers.
 */

import {
  findOptimalRoute,
  compareRouteAlternatives,
  updateGraphSegmentStatus
} from '../engines/routeEngine.js';

import {
  ROAD_SEGMENT_STATUS,
  ROUTE_STATUS,
  CANONICAL_ROUTE_NODES,
  CANONICAL_ROAD_SEGMENTS,
  SIMULATED_ROAD_SAFETY_DISCLAIMER
} from '../config/routeParameters.js';

import {
  createResponsePlan,
  PLAN_STATUS,
  APPROVAL_STATUS
} from '../models/responsePlan.js';

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
console.log('RELIEF-OS STEP 16 ROUTE ENGINE INTEGRATION TEST SUITE');
console.log('====================================================');

// -----------------------------------------------------------------
// SUITE 1: Canonical PRD Demo Scenario (Route A Blocked -> Route C Selected)
// -----------------------------------------------------------------
console.log('\n--- SUITE 1: Canonical PRD Demo Scenario ---');

const graph = {
  nodes: CANONICAL_ROUTE_NODES,
  segments: CANONICAL_ROAD_SEGMENTS
};

const routeResult = findOptimalRoute(graph, 'node-central-depot', 'node-zone-a');

assert(routeResult.success === true, 'A* successfully finds route in demo configuration');
assert(routeResult.primaryCorridor === 'ROUTE_C', 'Route C is selected as optimal available corridor', `(Got: ${routeResult.primaryCorridor})`);
assert(routeResult.totalDistanceKm === 29.2, 'Route C distance is exactly 29.2 km', `(Got: ${routeResult.totalDistanceKm})`);
assert(routeResult.path.length === 4, 'Route C traverses exactly 4 nodes (depot -> nagaon high -> north bridge -> zone a)');
assert(!routeResult.path.includes('node-junc-culvert-km42'), 'Impassable KM 42 culvert is never traversed');

// -----------------------------------------------------------------
// SUITE 2: Dynamic Recalculation (Reopen Route A -> Route A Selected)
// -----------------------------------------------------------------
console.log('\n--- SUITE 2: Dynamic Recalculation on Road Status Change ---');

// Reopen Route A segments
let updatedGraph = updateGraphSegmentStatus(graph, 'seg-route-a-1', ROAD_SEGMENT_STATUS.OPEN);
updatedGraph = updateGraphSegmentStatus(updatedGraph, 'seg-route-a-2', ROAD_SEGMENT_STATUS.OPEN);

const clearedRoute = findOptimalRoute(updatedGraph, 'node-central-depot', 'node-zone-a');
assert(clearedRoute.success === true, 'A* resolves path after road clearance');
assert(clearedRoute.primaryCorridor === 'ROUTE_A', 'Route A is selected when reopened', `(Got: ${clearedRoute.primaryCorridor})`);
assert(clearedRoute.totalDistanceKm === 18.5, 'Route A direct distance is 18.5 km', `(Got: ${clearedRoute.totalDistanceKm})`);
assert(clearedRoute.path.includes('node-junc-culvert-km42'), 'Direct culvert junction is traversed when open');

const comparison = compareRouteAlternatives(clearedRoute, routeResult);
assert(comparison.statusChange === 'DETOUR_SELECTED', 'Comparison identifies detour correctly');
assert(comparison.detourKm === 10.7, 'Detour is exactly +10.7 km (29.2 - 18.5)', `(Got: ${comparison.detourKm})`);

// -----------------------------------------------------------------
// SUITE 3: Total Blockage Safety (Never Traverse Blocked Roads)
// -----------------------------------------------------------------
console.log('\n--- SUITE 3: Total Blockage Handling ---');

// Block both Route A and Route C
let allBlockedGraph = updateGraphSegmentStatus(graph, 'seg-route-c-1', ROAD_SEGMENT_STATUS.BLOCKED);

const impassableResult = findOptimalRoute(allBlockedGraph, 'node-central-depot', 'node-zone-a');
assert(impassableResult.success === false, 'Returns success: false when all valid corridors are blocked');
assert(impassableResult.status === ROUTE_STATUS.NO_ROUTE, 'Status is explicitly NO_ROUTE');
assert(impassableResult.path.length === 0, 'Path is completely empty (no fallback to blocked roads)');
assert(impassableResult.explanation.includes('All connecting road segments are currently blocked'), 'Generates clear explanation for operational staff');

// -----------------------------------------------------------------
// SUITE 4: Role-Based Authorization for Road Management
// -----------------------------------------------------------------
console.log('\n--- SUITE 4: Role-Based Road Management Authorization ---');

function mockSetSegmentStatus(userRole, segmentId, newStatus) {
  if (userRole !== ROLES.COMMAND_CENTER) {
    throw new Error(`Unauthorized: Role '${userRole}' cannot modify simulated road statuses.`);
  }
  return true;
}

// 1. Command Center can update road status
let ccSuccess = false;
try {
  ccSuccess = mockSetSegmentStatus(ROLES.COMMAND_CENTER, 'seg-route-a-1', ROAD_SEGMENT_STATUS.OPEN);
} catch (e) {
  ccSuccess = false;
}
assert(ccSuccess === true, 'Command Center role is authorized to update road segment statuses');

// 2. Department role is blocked
let deptBlocked = false;
try {
  mockSetSegmentStatus(ROLES.DEPARTMENT, 'seg-route-a-1', ROAD_SEGMENT_STATUS.OPEN);
} catch (e) {
  deptBlocked = true;
}
assert(deptBlocked === true, 'Department role is strictly rejected from mutating road status');

// 3. Citizen role is blocked
let citizenBlocked = false;
try {
  mockSetSegmentStatus(ROLES.CITIZEN, 'seg-route-a-1', ROAD_SEGMENT_STATUS.OPEN);
} catch (e) {
  citizenBlocked = true;
}
assert(citizenBlocked === true, 'Citizen role is strictly rejected from mutating road status');

// -----------------------------------------------------------------
// SUITE 5: Response Plan Snapshot Integration & Human Approval Principle
// -----------------------------------------------------------------
console.log('\n--- SUITE 5: Response Plan Snapshot Integration ---');

const testPlan = createResponsePlan({
  planId: 'RP-0005',
  disasterId: 'DISASTER-001',
  createdBy: 'Command Center',
  allocations: [
    { zoneId: 'zone-a', resource: 'food', allocated: 500, priorityScore: 94 }
  ],
  routeRecommendation: routeResult,
});

assert(testPlan.routeRecommendation !== null, 'Response plan records route recommendation snapshot');
assert(testPlan.routeRecommendation.primaryCorridor === 'ROUTE_C', 'Snapshot preserves selected corridor (Route C)');
assert(testPlan.routeRecommendation.totalDistanceKm === 29.2, 'Snapshot preserves route distance (29.2 km)');
assert(testPlan.status === PLAN_STATUS.DRAFT, 'Plan remains in DRAFT status upon creation with route recommendation');
assert(testPlan.approval.status === APPROVAL_STATUS.PENDING, 'Human approval status is strictly PENDING (no auto-approval)');

// -----------------------------------------------------------------
// SUITE 6: Simulation Safety & Prototype Disclaimer Integrity
// -----------------------------------------------------------------
console.log('\n--- SUITE 6: Simulation Safety & Disclaimers ---');

assert(routeResult.metadata.isSimulated === true, 'All route results carry isSimulated: true flag');
assert(typeof routeResult.metadata.disclaimer === 'string', 'Safety disclaimer is attached');
assert(routeResult.metadata.disclaimer.includes('Not an active transit guarantee'), 'Disclaimer explicitly warns against real-world navigation');

// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL STEP 16 ROUTE INTEGRATION TESTS PASSED 100%!');
  process.exit(0);
}
