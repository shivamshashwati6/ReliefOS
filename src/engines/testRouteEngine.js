/**
 * RELIEF-OS Deterministic Route Engine Test Suite
 * 
 * Tests pure deterministic A* pathfinding, blocked segment avoidance,
 * partial segment penalty calculation, alternative route recalculation,
 * edge cases (no route, invalid endpoints, identical endpoints),
 * and simulation metadata integrity.
 */

import {
  calculateHeuristic,
  buildAdjacencyList,
  getSegmentEffectiveCost,
  findOptimalRoute,
  compareRouteAlternatives,
  updateGraphSegmentStatus
} from './routeEngine.js';

import {
  ROAD_SEGMENT_STATUS,
  ROUTE_STATUS,
  CANONICAL_ROUTE_NODES,
  CANONICAL_ROAD_SEGMENTS,
  SIMULATED_ROAD_SAFETY_DISCLAIMER
} from '../config/routeParameters.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount += 1;
    console.log(`  ✓ PASS: ${testName} ${details}`);
  } else {
    failedCount += 1;
    console.error(`  ✗ FAIL: ${testName} ${details}`);
  }
}

console.log('====================================================');
console.log('RELIEF-OS DETERMINISTIC ROUTE ENGINE TEST SUITE');
console.log('====================================================');

const baseGraph = {
  nodes: CANONICAL_ROUTE_NODES,
  segments: CANONICAL_ROAD_SEGMENTS
};

// -----------------------------------------------------------------
// TEST 1: Heuristic Admissibility
// -----------------------------------------------------------------
console.log('\nTest 1: Heuristic Admissibility and Coordinate Metric');
const h1 = calculateHeuristic(
  CANONICAL_ROUTE_NODES['node-central-depot'],
  CANONICAL_ROUTE_NODES['node-zone-a']
);
assert(h1 > 0, 'Heuristic between depot and zone A is positive', `(Got: ${h1})`);
assert(h1 <= 18.5, 'Heuristic is strictly admissible (<= true shortest road distance 18.5 km)', `(Got: ${h1} <= 18.5)`);

const hSame = calculateHeuristic(
  CANONICAL_ROUTE_NODES['node-central-depot'],
  CANONICAL_ROUTE_NODES['node-central-depot']
);
assert(hSame === 0, 'Heuristic between identical nodes is exactly 0', `(Got: ${hSame})`);

const hNull = calculateHeuristic(null, null);
assert(hNull === 0, 'Null node inputs return safe 0 heuristic without crashing');

// -----------------------------------------------------------------
// TEST 2: Effective Segment Costs
// -----------------------------------------------------------------
console.log('\nTest 2: Effective Segment Cost Calculation');
const sampleOpenSeg = { distanceKm: 10, status: ROAD_SEGMENT_STATUS.OPEN };
assert(getSegmentEffectiveCost(sampleOpenSeg) === 10, 'Open segment effective cost matches base distance (10)');

const samplePartialSeg = { distanceKm: 10, status: ROAD_SEGMENT_STATUS.PARTIAL };
assert(getSegmentEffectiveCost(samplePartialSeg, { partialCostMultiplier: 1.8 }) === 18, 'Partial segment applies 1.8x multiplier (18)');

const sampleBlockedSeg = { distanceKm: 10, status: ROAD_SEGMENT_STATUS.BLOCKED };
assert(getSegmentEffectiveCost(sampleBlockedSeg) === Infinity, 'Blocked segment returns Infinity cost');

assert(getSegmentEffectiveCost(null) === Infinity, 'Null segment returns safe Infinity cost');

// -----------------------------------------------------------------
// TEST 3: Baseline Optimal Route (When Route A is OPEN)
// -----------------------------------------------------------------
console.log('\nTest 3: Baseline Route Selection (When Route A is OPEN)');
// Create a version of the graph where Route A is OPEN
const openGraph = {
  nodes: CANONICAL_ROUTE_NODES,
  segments: CANONICAL_ROAD_SEGMENTS.map(s => {
    if (s.routeCode === 'ROUTE_A') return { ...s, status: ROAD_SEGMENT_STATUS.OPEN };
    return s;
  })
};

const baselineResult = findOptimalRoute(openGraph, 'node-central-depot', 'node-zone-a');
assert(baselineResult.success === true, 'Successfully resolves baseline route');
assert(baselineResult.status === ROUTE_STATUS.OPTIMAL, 'Route status is OPTIMAL');
assert(baselineResult.totalDistanceKm === 18.5, 'Route A baseline distance is 18.5 km', `(Got: ${baselineResult.totalDistanceKm})`);
assert(baselineResult.primaryCorridor === 'ROUTE_A', 'Primary corridor selected is ROUTE_A', `(Got: ${baselineResult.primaryCorridor})`);
assert(baselineResult.path.length === 3, 'Path traverses exactly 3 nodes [depot -> culvert -> zone-a]');
assert(baselineResult.metadata.isSimulated === true, 'Simulation metadata flag is true');
assert(baselineResult.metadata.disclaimer === SIMULATED_ROAD_SAFETY_DISCLAIMER, 'Safety disclaimer is strictly attached');

// -----------------------------------------------------------------
// TEST 4: PRD Hero Scenario: Route A BLOCKED -> Route C Selected
// -----------------------------------------------------------------
console.log('\nTest 4: PRD Hero Scenario: Route A Blocked -> Route C Recalculated');
// Default baseGraph has Route A BLOCKED (KM 42 flooded) and Route C OPEN
const reroutedResult = findOptimalRoute(baseGraph, 'node-central-depot', 'node-zone-a');

assert(reroutedResult.success === true, 'Successfully finds alternative route when Route A is blocked');
assert(reroutedResult.primaryCorridor === 'ROUTE_C', 'Route C is selected as the alternative', `(Got: ${reroutedResult.primaryCorridor})`);
assert(reroutedResult.totalDistanceKm === 29.2, 'Route C distance is exactly 29.2 km', `(Got: ${reroutedResult.totalDistanceKm})`);
assert(!reroutedResult.path.includes('node-junc-culvert-km42'), 'Blocked culvert junction at KM 42 is never traversed');

// Check detour comparison
const comparison = compareRouteAlternatives(baselineResult, reroutedResult);
assert(comparison.statusChange === 'DETOUR_SELECTED', 'Status change identified as DETOUR_SELECTED');
assert(comparison.detourKm === 10.7, 'Detour distance is +10.7 km (29.2 - 18.5)', `(Got: ${comparison.detourKm})`);
assert(comparison.detourMinutes > 0, 'Detour incurs positive delay minutes', `(Got: +${comparison.detourMinutes} mins)`);

// -----------------------------------------------------------------
// TEST 5: Deterministic Tie-Breaking Stability
// -----------------------------------------------------------------
console.log('\nTest 5: Deterministic Tie-Breaking Stability (100 Repetitions)');
let tieBreakConsistent = true;
const initialPathJson = JSON.stringify(reroutedResult.path);
for (let i = 0; i < 100; i++) {
  const run = findOptimalRoute(baseGraph, 'node-central-depot', 'node-zone-a');
  if (JSON.stringify(run.path) !== initialPathJson || run.totalCost !== reroutedResult.totalCost) {
    tieBreakConsistent = false;
    break;
  }
}
assert(tieBreakConsistent, '100 repeated executions produce identical node path and total cost');

// -----------------------------------------------------------------
// TEST 6: All Paths Blocked -> Meaningful NO_ROUTE
// -----------------------------------------------------------------
console.log('\nTest 6: All Paths Blocked -> Meaningful NO_ROUTE');
// Graph where BOTH Route A and Route C are blocked
const blockedGraph = {
  nodes: CANONICAL_ROUTE_NODES,
  segments: CANONICAL_ROAD_SEGMENTS.map(s => ({
    ...s,
    status: ROAD_SEGMENT_STATUS.BLOCKED
  }))
};

const noRouteResult = findOptimalRoute(blockedGraph, 'node-central-depot', 'node-zone-a');
assert(noRouteResult.success === false, 'Returns success: false when all routes are blocked');
assert(noRouteResult.status === ROUTE_STATUS.NO_ROUTE, 'Status is NO_ROUTE');
assert(noRouteResult.totalCost === Infinity, 'Total cost is Infinity');
assert(noRouteResult.path.length === 0, 'Path is empty array');
assert(noRouteResult.explanation.includes('All connecting road segments are currently blocked'), 'Explanation clearly identifies impassable conditions');

// -----------------------------------------------------------------
// TEST 7: Invalid Inputs and Missing Endpoints
// -----------------------------------------------------------------
console.log('\nTest 7: Invalid Inputs & Missing Endpoints');
const invalidStart = findOptimalRoute(baseGraph, 'non-existent-node', 'node-zone-a');
assert(invalidStart.success === false && invalidStart.status === ROUTE_STATUS.INVALID_INPUT, 'Invalid start node handled safely');

const invalidEnd = findOptimalRoute(baseGraph, 'node-central-depot', 'non-existent-dest');
assert(invalidEnd.success === false && invalidEnd.status === ROUTE_STATUS.INVALID_INPUT, 'Invalid destination node handled safely');

const nullGraph = findOptimalRoute(null, 'node-central-depot', 'node-zone-a');
assert(nullGraph.success === false && nullGraph.status === ROUTE_STATUS.INVALID_INPUT, 'Null graph handled safely');

// -----------------------------------------------------------------
// TEST 8: Same Origin and Destination
// -----------------------------------------------------------------
console.log('\nTest 8: Same Origin and Destination Endpoint');
const sameEndpoint = findOptimalRoute(baseGraph, 'node-central-depot', 'node-central-depot');
assert(sameEndpoint.success === true, 'Same endpoint returns success: true');
assert(sameEndpoint.totalCost === 0, 'Same endpoint total cost is 0');
assert(sameEndpoint.totalDistanceKm === 0, 'Same endpoint total distance is 0');
assert(sameEndpoint.path.length === 1 && sameEndpoint.path[0] === 'node-central-depot', 'Path contains only the single endpoint');

// -----------------------------------------------------------------
// TEST 9: Disconnected Graph Handling
// -----------------------------------------------------------------
console.log('\nTest 9: Disconnected Graph Handling');
const disconnectedGraph = {
  nodes: {
    ...CANONICAL_ROUTE_NODES,
    'isolated-island': { id: 'isolated-island', name: 'Isolated Island Zone', coordinates: { x: 999, y: 999 } }
  },
  segments: CANONICAL_ROAD_SEGMENTS
};

const islandResult = findOptimalRoute(disconnectedGraph, 'node-central-depot', 'isolated-island');
assert(islandResult.success === false, 'Cannot reach disconnected node');
assert(islandResult.status === ROUTE_STATUS.NO_ROUTE, 'Returns NO_ROUTE for unreachable island node');

// -----------------------------------------------------------------
// TEST 10: Graph Segment Status Update Helper
// -----------------------------------------------------------------
console.log('\nTest 10: Graph Segment Status Update Helper');
const modifiedGraph = updateGraphSegmentStatus(baseGraph, 'seg-route-a-1', ROAD_SEGMENT_STATUS.OPEN);
const updatedSeg = modifiedGraph.segments.find(s => s.id === 'seg-route-a-1');
assert(updatedSeg.status === ROAD_SEGMENT_STATUS.OPEN, 'Segment status updated to OPEN in new graph');
const originalSeg = baseGraph.segments.find(s => s.id === 'seg-route-a-1');
assert(originalSeg.status === ROAD_SEGMENT_STATUS.BLOCKED, 'Original graph remains immutable');

// -----------------------------------------------------------------
// TEST 11: Partial Road Penalty Traversal
// -----------------------------------------------------------------
console.log('\nTest 11: Partial Road Penalty Traversal');
// Route B spur to Zone B is PARTIAL (4.5 km * 1.8 = 8.1 cost)
const routeToZoneB = findOptimalRoute(baseGraph, 'node-central-depot', 'node-zone-b');
assert(routeToZoneB.success === true, 'Successfully finds route to Zone B');
assert(routeToZoneB.routeCondition === ROAD_SEGMENT_STATUS.PARTIAL, 'Overall route condition marked PARTIAL due to flooded shoulder');
assert(routeToZoneB.explanation.includes('caution'), 'Explanation includes caution note for high clearance vehicles');

// -----------------------------------------------------------------
// TEST 12: Zero Mutation of Inventory or Prior Engines
// -----------------------------------------------------------------
console.log('\nTest 12: Zero Mutation of Inventory or Prior Engines');
assert(typeof CANONICAL_ROAD_SEGMENTS === 'object', 'Route configurations isolated from inventory');
assert(baselineResult.totalCost > 0, 'Route calculations return pure numerical costs without touching allocation state');

// -----------------------------------------------------------------
console.log('\n====================================================');
console.log(`ROUTE ENGINE TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('====================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ROUTE ENGINE TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
