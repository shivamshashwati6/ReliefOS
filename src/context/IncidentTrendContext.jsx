/**
 * RELIEF-OS Incident Trend Context
 * 
 * Manages point-in-time analytical snapshots across disaster lifecycles.
 * 
 * STRICT COMPLIANCE:
 * - Isolate snapshots strictly by disasterId.
 * - ZERO modification to inventory, allocations, response plans, monitoring, or safety updates.
 * - Recording a snapshot is purely a read-only analytical observation.
 * - Role security: Only COMMAND_CENTER is authorized to record snapshots.
 * - No automatic snapshot generation on page load or timer. Human-triggered only.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDisaster } from './DisasterContext';
import { ROLES } from '../config/roles';
import { createSnapshot, calculateTrendSeries } from '../engines/trendEngine';

const IncidentTrendContext = createContext(null);

export function IncidentTrendProvider({ children }) {
  const { currentUser, role } = useAuth();
  const { currentDisaster } = useDisaster();

  // Internal dictionary keyed strictly by disasterId: { [disasterId]: Snapshot[] }
  const [snapshotsByDisaster, setSnapshotsByDisaster] = useState({});

  // Active disaster ID
  const activeDisasterId = currentDisaster?.id || null;

  // Active disaster snapshots (chronological)
  const activeSnapshots = useMemo(() => {
    if (!activeDisasterId) return [];
    return snapshotsByDisaster[activeDisasterId] || [];
  }, [snapshotsByDisaster, activeDisasterId]);

  // Derived trend series for the active disaster
  const trendSeries = useMemo(() => {
    if (!activeDisasterId || activeSnapshots.length === 0) {
      return {
        snapshots: [],
        count: 0,
        latest: null,
        previous: null,
        trend: null,
        chartData: [],
        statements: ['No historical snapshots yet.'],
      };
    }

    return calculateTrendSeries(activeSnapshots, { disasterId: activeDisasterId });
  }, [activeSnapshots, activeDisasterId]);

  const latestSnapshot = trendSeries.latest;

  /**
   * Helper to retrieve snapshots for a specific disaster ID.
   */
  const getSnapshotsByDisaster = useCallback((disasterId) => {
    if (!disasterId) return [];
    return snapshotsByDisaster[disasterId] || [];
  }, [snapshotsByDisaster]);

  /**
   * Records an analytical point-in-time snapshot for the active disaster.
   * Only COMMAND_CENTER is authorized.
   * 
   * @param {Object} metrics - Analytical metrics (reports, priority, resources, response, safety)
   * @param {string} [customTimestamp] - Optional ISO timestamp
   * @returns {{ success: boolean, snapshot?: Object, error?: string }}
   */
  const recordSnapshot = useCallback((metrics = {}, customTimestamp = null) => {
    // 1. Role Security Check
    const effectiveRole = currentUser?.role || role;
    if (effectiveRole !== ROLES.COMMAND_CENTER) {
      const errorMsg = 'Unauthorized: Only Command Center personnel can record analytical snapshots.';
      return { success: false, error: errorMsg };
    }

    // 2. Active Disaster Validation
    const targetDisasterId = metrics?.disasterId || activeDisasterId;
    if (!targetDisasterId) {
      const errorMsg = 'No active disaster identified to associate snapshot.';
      return { success: false, error: errorMsg };
    }

    try {
      const currentList = snapshotsByDisaster[targetDisasterId] || [];
      const sequence = currentList.length + 1;

      const newSnapshot = createSnapshot(
        { ...metrics, disasterId: targetDisasterId },
        customTimestamp,
        { sequence }
      );

      setSnapshotsByDisaster((prev) => ({
        ...prev,
        [targetDisasterId]: [...(prev[targetDisasterId] || []), newSnapshot],
      }));

      return {
        success: true,
        snapshot: newSnapshot,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to record snapshot.',
      };
    }
  }, [currentUser?.role, role, activeDisasterId, snapshotsByDisaster]);

  /**
   * Clears snapshots for a specific disaster (e.g., reset/testing).
   */
  const clearSnapshots = useCallback((disasterId) => {
    if (!disasterId) return;
    setSnapshotsByDisaster((prev) => {
      const updated = { ...prev };
      delete updated[disasterId];
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    snapshots: activeSnapshots,
    snapshotsByDisaster,
    latestSnapshot,
    trendSeries,
    recordSnapshot,
    clearSnapshots,
    getSnapshotsByDisaster,
  }), [
    activeSnapshots,
    snapshotsByDisaster,
    latestSnapshot,
    trendSeries,
    recordSnapshot,
    clearSnapshots,
    getSnapshotsByDisaster,
  ]);

  return (
    <IncidentTrendContext.Provider value={value}>
      {children}
    </IncidentTrendContext.Provider>
  );
}

export function useIncidentTrend() {
  const context = useContext(IncidentTrendContext);
  if (!context) {
    throw new Error('useIncidentTrend must be used within an IncidentTrendProvider');
  }
  return context;
}
