/**
 * RELIEF-OS Deterministic A* Route Engine
 * 
 * Provides disaster-aware road pathfinding from relief/resource hubs to affected zones.
 * 
 * CORE DESIGN PRINCIPLES:
 * 1. PURE & DETERMINISTIC: Zero external API calls, zero random seeds, zero Gemini dependency.
 * 2. STRICTLY ADMISSIBLE A*: Euclidean distance heuristic scaled to guarantee h(n) <= d*(n).
 * 3. TIE-BREAKING STABILITY: Predictable f-score, h-score, and lexicographic node ID tie-breaking.
 * 4. BLOCKED ROAD EXCLUSION: Never traverses a BLOCKED road segment; reports NO_ROUTE if all blocked.
 * 5. PARTIAL ROAD COST PENALTY: Traverses PARTIAL segments with configurable cost multiplier (1.8x).
 * 6. DECISION EXPLANATIONS: Generates clear, human-readable rationale for selected routes & detours.
 * 7. PROTOTYPE INTEGRITY: All outputs marked with simulation metadata and safety disclaimers.
 */

import { 
  ROAD_SEGMENT_STATUS, 
  ROUTE_STATUS, 
  ROUTE_PARAMETERS, 
  SIMULATED_ROAD_SAFETY_DISCLAIMER 
} from '../config/routeParameters.js';

/**
 * Calculates admissible Euclidean distance between two nodes in cost units (km).
 * Scale factor ensures heuristic never overestimates the true road network distance.
 */
export function calculateHeuristic(nodeA, nodeB) {
  if (!nodeA || !nodeB || !nodeA.coordinates || !nodeB.coordinates) {
    return 0; // Trivial 0 heuristic (equivalent to Dijkstra, strictly admissible)
  }

  const dx = (nodeA.coordinates.x || 0) - (nodeB.coordinates.x || 0);
  const dy = (nodeA.coordinates.y || 0) - (nodeB.coordinates.y || 0);
  const pixelDist = Math.sqrt(dx * dx + dy * dy);

  // Scaled factor: 1 px ≈ 0.04 km (strictly <= actual road distance per pixel)
  return Math.round(pixelDist * 0.04 * 100) / 100;
}

/**
 * Builds an adjacency map from graph nodes and road segments.
 */
export function buildAdjacencyList(nodes = {}, segments = []) {
  const adj = {};

  // Initialize adjacency for all defined nodes
  Object.keys(nodes).forEach(nodeId => {
    adj[nodeId] = [];
  });

  segments.forEach(seg => {
    if (!seg || !seg.from || !seg.to) return;

    if (!adj[seg.from]) adj[seg.from] = [];
    adj[seg.from].push({
      neighborId: seg.to,
      segment: seg,
    });

    // If bidirectional road segment, allow reverse traversal
    if (seg.bidirectional !== false) {
      if (!adj[seg.to]) adj[seg.to] = [];
      adj[seg.to].push({
        neighborId: seg.from,
        segment: seg,
      });
    }
  });

  return adj;
}

/**
 * Resolves effective traversal cost of a road segment given its status and multipliers.
 * Returns Infinity if the road is BLOCKED (cannot be traversed).
 */
export function getSegmentEffectiveCost(segment, options = {}) {
  if (!segment) return Infinity;

  const status = segment.status || ROAD_SEGMENT_STATUS.OPEN;
  const baseCost = Number(segment.baseCost ?? segment.distanceKm ?? 10);
  const partialMultiplier = Number(
    options.partialCostMultiplier ?? ROUTE_PARAMETERS.DEFAULT_PARTIAL_COST_MULTIPLIER
  );

  if (status === ROAD_SEGMENT_STATUS.BLOCKED) {
    return Infinity;
  }

  if (status === ROAD_SEGMENT_STATUS.PARTIAL) {
    return Math.round(baseCost * partialMultiplier * 100) / 100;
  }

  return baseCost;
}

/**
 * Deterministic A* Shortest Pathfinding Algorithm.
 * 
 * @param {Object} graph - { nodes: Object, segments: Array }
 * @param {string} startNodeId - Origin node ID (e.g. 'node-central-depot')
 * @param {string} endNodeId - Destination node ID (e.g. 'node-zone-a')
 * @param {Object} options - Configuration overrides (partialCostMultiplier, etc.)
 * 
 * @returns {Object} Deterministic route resolution record
 */
export function findOptimalRoute(graph, startNodeId, endNodeId, options = {}) {
  const nodes = graph?.nodes || {};
  const segments = graph?.segments || [];

  // 1. Validate inputs
  if (!graph || typeof graph !== 'object' || !startNodeId || !endNodeId) {
    return {
      success: false,
      status: ROUTE_STATUS.INVALID_INPUT,
      path: [],
      segments: [],
      totalCost: 0,
      totalDistanceKm: 0,
      routeCondition: 'UNAVAILABLE',
      explanation: 'Invalid route parameters: start or destination endpoint is missing.',
      metadata: { isSimulated: true, disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER }
    };
  }

  const startNode = nodes[startNodeId];
  const endNode = nodes[endNodeId];

  if (!startNode || !endNode) {
    return {
      success: false,
      status: ROUTE_STATUS.INVALID_INPUT,
      path: [],
      segments: [],
      totalCost: 0,
      totalDistanceKm: 0,
      routeCondition: 'UNAVAILABLE',
      explanation: `Endpoint node not found in road network graph: ${!startNode ? startNodeId : endNodeId}.`,
      metadata: { isSimulated: true, disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER }
    };
  }

  // 2. Trivial case: start is destination
  if (startNodeId === endNodeId) {
    return {
      success: true,
      status: ROUTE_STATUS.OPTIMAL,
      path: [startNodeId],
      segments: [],
      totalCost: 0,
      totalDistanceKm: 0,
      routeCondition: ROAD_SEGMENT_STATUS.OPEN,
      estimatedMinutes: 0,
      explanation: `Origin is already at destination point (${startNode.name || startNodeId}).`,
      metadata: { evaluatedNodes: 1, isSimulated: true, disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER }
    };
  }

  // 3. Setup A* search data structures
  const adj = buildAdjacencyList(nodes, segments);

  // gScore[n]: cost of cheapest path from start to n currently known
  const gScore = {};
  // fScore[n]: gScore[n] + h(n)
  const fScore = {};
  // cameFrom[n]: { prevNodeId, segment }
  const cameFrom = {};

  Object.keys(nodes).forEach(id => {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  });

  gScore[startNodeId] = 0;
  fScore[startNodeId] = calculateHeuristic(startNode, endNode);

  // Open set with deterministic sorted array
  const openSet = [startNodeId];
  const closedSet = new Set();
  let evaluatedNodesCount = 0;

  while (openSet.length > 0) {
    // Deterministic selection:
    // Sort by fScore asc -> hScore asc -> nodeId lexicographically
    openSet.sort((a, b) => {
      const fDiff = fScore[a] - fScore[b];
      if (Math.abs(fDiff) > 0.0001) return fDiff;

      const hA = calculateHeuristic(nodes[a], endNode);
      const hB = calculateHeuristic(nodes[b], endNode);
      const hDiff = hA - hB;
      if (Math.abs(hDiff) > 0.0001) return hDiff;

      return a.localeCompare(b);
    });

    const currentId = openSet.shift();
    evaluatedNodesCount += 1;

    // Goal reached!
    if (currentId === endNodeId) {
      return reconstructPathRecord({
        startNode,
        endNode,
        cameFrom,
        endNodeId,
        gScore,
        evaluatedNodesCount,
        options,
      });
    }

    closedSet.add(currentId);

    const neighbors = adj[currentId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.neighborId;
      if (closedSet.has(neighborId)) continue;

      const seg = edge.segment;
      const effectiveEdgeCost = getSegmentEffectiveCost(seg, options);

      // Skip fully blocked road segments completely
      if (!isFinite(effectiveEdgeCost)) {
        continue;
      }

      const tentativeGScore = gScore[currentId] + effectiveEdgeCost;

      if (tentativeGScore < gScore[neighborId] - 0.0001) {
        cameFrom[neighborId] = {
          prevNodeId: currentId,
          segment: seg,
          cost: effectiveEdgeCost,
        };
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = tentativeGScore + calculateHeuristic(nodes[neighborId], endNode);

        if (!openSet.includes(neighborId)) {
          openSet.push(neighborId);
        }
      }
    }
  }

  // 4. No valid path found (disconnected or all paths blocked)
  return {
    success: false,
    status: ROUTE_STATUS.NO_ROUTE,
    path: [],
    segments: [],
    totalCost: Infinity,
    totalDistanceKm: 0,
    routeCondition: ROAD_SEGMENT_STATUS.BLOCKED,
    estimatedMinutes: null,
    explanation: `No valid navigable corridor available between ${startNode.name} and ${endNode.name}. ` +
      `All connecting road segments are currently blocked or inundated by flood water.`,
    metadata: {
      evaluatedNodes: evaluatedNodesCount,
      isSimulated: true,
      disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER
    }
  };
}

/**
 * Helper to reconstruct the complete path and human-readable metadata.
 */
function reconstructPathRecord({
  startNode,
  endNode,
  cameFrom,
  endNodeId,
  gScore,
  evaluatedNodesCount,
  options
}) {
  const path = [];
  const segments = [];
  let curr = endNodeId;

  while (cameFrom[curr]) {
    path.unshift(curr);
    segments.unshift(cameFrom[curr].segment);
    curr = cameFrom[curr].prevNodeId;
  }
  path.unshift(curr); // Add starting node

  const totalCost = Math.round(gScore[endNodeId] * 100) / 100;
  const totalDistanceKm = Math.round(
    segments.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0) * 10
  ) / 10;

  // Determine overall route condition (if any segment is PARTIAL, mark PARTIAL)
  const hasPartial = segments.some(s => s.status === ROAD_SEGMENT_STATUS.PARTIAL);
  const routeCondition = hasPartial ? ROAD_SEGMENT_STATUS.PARTIAL : ROAD_SEGMENT_STATUS.OPEN;

  // Calculate estimated transit minutes
  const speed = hasPartial 
    ? ROUTE_PARAMETERS.AVERAGE_SPEED_PARTIAL_KMH 
    : ROUTE_PARAMETERS.AVERAGE_SPEED_OPEN_KMH;
  const estimatedMinutes = Math.max(5, Math.round((totalDistanceKm / speed) * 60));

  // Determine primary corridor code (e.g. ROUTE_A, ROUTE_C)
  const corridorCodes = [...new Set(segments.map(s => s.routeCode).filter(Boolean))];
  const primaryCorridor = corridorCodes.length === 1 ? corridorCodes[0] : corridorCodes.join(' + ');

  // Generate explanation
  let explanation = '';
  if (primaryCorridor === 'ROUTE_A') {
    explanation = `Selected Route A as the optimal direct corridor to ${endNode.name} (${totalDistanceKm} km, ~${estimatedMinutes} mins). ` +
      `All segments are open and clear for all-terrain transit.`;
  } else if (primaryCorridor === 'ROUTE_C') {
    explanation = `Selected Route C (Elevated High Bypass) to ${endNode.name} (${totalDistanceKm} km, ~${estimatedMinutes} mins). ` +
      `Route A lowlands are bypassed via reinforced high ridge corridors.`;
  } else if (hasPartial) {
    explanation = `Selected transit corridor to ${endNode.name} (${totalDistanceKm} km, ~${estimatedMinutes} mins) with caution. ` +
      `One or more segments exhibit partial water inundation on shoulders. High-clearance vehicles advised.`;
  } else {
    explanation = `Selected optimal relief corridor connecting ${startNode.name} to ${endNode.name} (${totalDistanceKm} km, ~${estimatedMinutes} mins).`;
  }

  return {
    success: true,
    status: ROUTE_STATUS.OPTIMAL,
    path,
    segments,
    totalCost,
    totalDistanceKm,
    routeCondition,
    estimatedMinutes,
    primaryCorridor,
    corridorCodes,
    explanation,
    metadata: {
      evaluatedNodes: evaluatedNodesCount,
      isSimulated: true,
      disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER
    }
  };
}

/**
 * Compares a baseline route against an alternative route after road condition changes.
 * Returns comparative metrics including detour distance, time delta, and reasoning.
 */
export function compareRouteAlternatives(baselineRoute, recalculatedRoute) {
  if (!baselineRoute?.success && !recalculatedRoute?.success) {
    return {
      statusChange: 'BOTH_UNAVAILABLE',
      detourKm: 0,
      detourMinutes: 0,
      summary: 'No navigable paths available in either configuration.'
    };
  }

  if (baselineRoute?.success && !recalculatedRoute?.success) {
    return {
      statusChange: 'ROUTE_SEVERED',
      detourKm: null,
      detourMinutes: null,
      summary: 'Previously open route has been completely severed. No valid alternative exists.'
    };
  }

  if (!baselineRoute?.success && recalculatedRoute?.success) {
    return {
      statusChange: 'ROUTE_RESTORED',
      detourKm: 0,
      detourMinutes: 0,
      summary: 'Navigable corridor restored following road clearance.'
    };
  }

  const detourKm = Math.round((recalculatedRoute.totalDistanceKm - baselineRoute.totalDistanceKm) * 10) / 10;
  const detourMinutes = (recalculatedRoute.estimatedMinutes || 0) - (baselineRoute.estimatedMinutes || 0);

  let summary = '';
  if (detourKm > 0.1) {
    summary = `Alternative corridor selected with +${detourKm} km detour (+${detourMinutes} mins delay).`;
  } else if (detourKm < -0.1) {
    summary = `Shorter corridor selected with ${Math.abs(detourKm)} km reduction.`;
  } else {
    summary = 'Identical route cost and distance maintained.';
  }

  return {
    statusChange: detourKm > 0.1 ? 'DETOUR_SELECTED' : 'IDENTICAL',
    detourKm,
    detourMinutes,
    baselineDistanceKm: baselineRoute.totalDistanceKm,
    recalculatedDistanceKm: recalculatedRoute.totalDistanceKm,
    baselineCorridor: baselineRoute.primaryCorridor,
    recalculatedCorridor: recalculatedRoute.primaryCorridor,
    summary,
  };
}

/**
 * Creates a modified copy of the graph with updated segment statuses.
 */
export function updateGraphSegmentStatus(graph, segmentId, newStatus) {
  if (!graph || !Array.isArray(graph.segments)) return graph;

  const updatedSegments = graph.segments.map(seg => {
    if (seg.id === segmentId) {
      return { ...seg, status: newStatus };
    }
    return seg;
  });

  return {
    ...graph,
    segments: updatedSegments,
  };
}
