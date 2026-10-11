/**
 * RELIEF-OS Disaster-Aware Route Context
 * 
 * Provides state management and actions for simulated road networks,
 * deterministic A* route recommendations, and road segment status toggles.
 * 
 * STRICT COMPLIANCE:
 * 1. Role-based control: Only COMMAND_CENTER may mutate road segment statuses.
 * 2. Disaster isolation: Road network state scoped to active disaster.
 * 3. Deterministic recalculation: Automatically recalculates routes when road status changes.
 * 4. Human decision-making: Recommended routes never auto-dispatch or auto-approve plans.
 * 5. Simulation safety: Clear simulation disclaimers on all outputs.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDisaster } from './DisasterContext';
import { ROLES } from '../config/roles';
import {
  CANONICAL_ROUTE_NODES,
  CANONICAL_ROAD_SEGMENTS,
  ROAD_SEGMENT_STATUS,
  ROUTE_PARAMETERS,
  SIMULATED_ROAD_SAFETY_DISCLAIMER
} from '../config/routeParameters';
import {
  findOptimalRoute,
  compareRouteAlternatives,
  updateGraphSegmentStatus
} from '../engines/routeEngine';

const RouteContext = createContext(null);

export function RouteProvider({ children }) {
  const { currentUser } = useAuth();
  const { currentDisaster } = useDisaster();

  const activeDisasterId = currentDisaster?.id || 'DISASTER-001';

  // Road network state initialized from canonical configuration
  const [segments, setSegments] = useState(CANONICAL_ROAD_SEGMENTS);
  const nodes = CANONICAL_ROUTE_NODES;

  // Active graph object
  const activeGraph = useMemo(() => ({
    nodes,
    segments
  }), [segments]);

  // Baseline graph where Route A is OPEN (for detour comparison)
  const baselineGraph = useMemo(() => ({
    nodes,
    segments: CANONICAL_ROAD_SEGMENTS.map(s => {
      if (s.routeCode === 'ROUTE_A') return { ...s, status: ROAD_SEGMENT_STATUS.OPEN };
      return s;
    })
  }), []);

  // Baseline route for Hero Zone A (when Route A was open)
  const baselineHeroRoute = useMemo(() => {
    return findOptimalRoute(
      baselineGraph,
      ROUTE_PARAMETERS.DEFAULT_ORIGIN_NODE,
      ROUTE_PARAMETERS.DEFAULT_HERO_DESTINATION_NODE
    );
  }, [baselineGraph]);

  // Current optimal route for Hero Zone A
  const optimalHeroRoute = useMemo(() => {
    return findOptimalRoute(
      activeGraph,
      ROUTE_PARAMETERS.DEFAULT_ORIGIN_NODE,
      ROUTE_PARAMETERS.DEFAULT_HERO_DESTINATION_NODE
    );
  }, [activeGraph]);

  // Comparative metrics (detour distance, delay minutes, explanation)
  const heroRouteComparison = useMemo(() => {
    return compareRouteAlternatives(baselineHeroRoute, optimalHeroRoute);
  }, [baselineHeroRoute, optimalHeroRoute]);

  /**
   * Helper to check if current user has permission to update road statuses
   */
  const canManageRoads = useCallback(() => {
    return currentUser?.role === ROLES.COMMAND_CENTER;
  }, [currentUser?.role]);

  /**
   * Updates status of a road segment with role validation.
   */
  const setSegmentStatus = useCallback((segmentId, newStatus) => {
    if (!canManageRoads()) {
      throw new Error(`Unauthorized: Role '${currentUser?.role || 'ANONYMOUS'}' cannot modify simulated road statuses.`);
    }

    if (!Object.values(ROAD_SEGMENT_STATUS).includes(newStatus)) {
      throw new Error(`Invalid road status '${newStatus}'. Must be OPEN, PARTIAL, or BLOCKED.`);
    }

    setSegments(prev => prev.map(s => {
      if (s.id === segmentId) {
        return { ...s, status: newStatus };
      }
      return s;
    }));
  }, [canManageRoads, currentUser?.role]);

  /**
   * Convenience helpers for status toggles
   */
  const blockSegment = useCallback((segmentId) => {
    setSegmentStatus(segmentId, ROAD_SEGMENT_STATUS.BLOCKED);
  }, [setSegmentStatus]);

  const openSegment = useCallback((segmentId) => {
    setSegmentStatus(segmentId, ROAD_SEGMENT_STATUS.OPEN);
  }, [setSegmentStatus]);

  const setSegmentPartial = useCallback((segmentId) => {
    setSegmentStatus(segmentId, ROAD_SEGMENT_STATUS.PARTIAL);
  }, [setSegmentStatus]);

  /**
   * Resets all segments to the canonical demo configuration
   */
  const resetToDemoBaseline = useCallback(() => {
    if (!canManageRoads()) {
      throw new Error(`Unauthorized: Role '${currentUser?.role || 'ANONYMOUS'}' cannot reset simulated road graph.`);
    }
    setSegments(CANONICAL_ROAD_SEGMENTS);
  }, [canManageRoads, currentUser?.role]);

  /**
   * Helper to find route to any zone by zoneId
   */
  const findRouteToZone = useCallback((zoneId, originNodeId = ROUTE_PARAMETERS.DEFAULT_ORIGIN_NODE) => {
    const targetNodeEntry = Object.values(nodes).find(n => n.zoneId === zoneId);
    if (!targetNodeEntry) {
      return {
        success: false,
        status: 'INVALID_INPUT',
        explanation: `No route network node mapped to zone ID '${zoneId}'.`,
        metadata: { isSimulated: true, disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER }
      };
    }
    return findOptimalRoute(activeGraph, originNodeId, targetNodeEntry.id);
  }, [nodes, activeGraph]);

  const value = useMemo(() => ({
    disasterId: activeDisasterId,
    nodes,
    segments,
    activeGraph,
    optimalHeroRoute,
    baselineHeroRoute,
    heroRouteComparison,
    canManageRoads: canManageRoads(),
    setSegmentStatus,
    blockSegment,
    openSegment,
    setSegmentPartial,
    resetToDemoBaseline,
    findRouteToZone,
    findOptimalRoute: (start, end, opts) => findOptimalRoute(activeGraph, start, end, opts),
    disclaimer: SIMULATED_ROAD_SAFETY_DISCLAIMER,
  }), [
    activeDisasterId,
    nodes,
    segments,
    activeGraph,
    optimalHeroRoute,
    baselineHeroRoute,
    heroRouteComparison,
    canManageRoads,
    setSegmentStatus,
    blockSegment,
    openSegment,
    setSegmentPartial,
    resetToDemoBaseline,
    findRouteToZone
  ]);

  return (
    <RouteContext.Provider value={value}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRouteEngine() {
  return useContext(RouteContext);
}
