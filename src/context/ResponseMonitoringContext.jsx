/**
 * RELIEF-OS Response Monitoring Context
 * 
 * Manages human-directed simulated response progress of APPROVED response plans.
 * 
 * STRICT COMPLIANCE:
 * - Pure simulation layer — ZERO real-world dispatch or telemetry.
 * - ZERO mutation of Inventory, Demand, Priority, or Response Plan allocations.
 * - Strict disaster isolation (disasterId).
 * - Only APPROVED response plans can create/start monitoring records.
 * - Human-directed progress additions only (no random autonomous increments).
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useResponsePlan } from './ResponsePlanContext';
import { useDisaster } from './DisasterContext';
import { 
  MONITORING_STATUS, 
  RESOURCE_STATUS, 
  ZONE_STATUS,
  createResponseMonitoring, 
  calculateResourceProgress, 
  calculateZoneProgress, 
  calculateZoneStatus, 
  calculateOverallProgress, 
  deriveOverallStatus,
  formatMonitoringId 
} from '../models/responseMonitoring';
import { PLAN_STATUS } from '../models/responsePlan';

const ResponseMonitoringContext = createContext(null);

export function ResponseMonitoringProvider({ children }) {
  const { currentDisaster } = useDisaster();
  const { plans, disasterPlans, getPlanById } = useResponsePlan();

  const activeDisasterId = currentDisaster?.id || 'DISASTER-001';

  // Collection of simulated monitoring records
  const [monitoringRecords, setMonitoringRecords] = useState([]);
  const [selectedMonitoringId, setSelectedMonitoringId] = useState(null);

  /**
   * Automatically initializes MON-0001 if an approved plan exists and no monitoring record exists yet.
   */
  useEffect(() => {
    const approvedPlan = disasterPlans.find(p => p.status === PLAN_STATUS.APPROVED);
    if (approvedPlan && monitoringRecords.length === 0) {
      try {
        const initialMon = createResponseMonitoring(approvedPlan, {
          monitoringId: 'MON-0001',
          createdBy: 'Command Center',
        });
        setMonitoringRecords([initialMon]);
        setSelectedMonitoringId(initialMon.monitoringId);
      } catch (err) {
        console.warn('Monitoring auto-init skipped:', err.message);
      }
    }
  }, [disasterPlans, monitoringRecords.length]);

  /**
   * Monitoring records strictly isolated to active disaster event.
   */
  const disasterMonitoringRecords = useMemo(() => {
    return monitoringRecords.filter(m => m.disasterId === activeDisasterId);
  }, [monitoringRecords, activeDisasterId]);

  /**
   * Currently active/selected monitoring record
   */
  const currentMonitoring = useMemo(() => {
    if (selectedMonitoringId) {
      const found = disasterMonitoringRecords.find(m => m.monitoringId === selectedMonitoringId);
      if (found) return found;
    }
    return disasterMonitoringRecords[0] || null;
  }, [disasterMonitoringRecords, selectedMonitoringId]);

  /**
   * Creates or activates a monitoring record for a specific approved plan.
   * Section 5: ONLY APPROVED PLANS CAN START MONITORING.
   */
  const initializeMonitoringForPlan = useCallback((planId, options = {}) => {
    const targetPlan = getPlanById(planId);

    if (!targetPlan) {
      throw new Error(`Response plan ${planId} not found.`);
    }

    if (targetPlan.status !== PLAN_STATUS.APPROVED) {
      throw new Error('Only approved response plans can be monitored.');
    }

    // Check if monitoring record already exists for this plan
    const existing = monitoringRecords.find(m => m.planId === planId);
    if (existing) {
      setSelectedMonitoringId(existing.monitoringId);
      return existing;
    }

    const nextSeq = monitoringRecords.length + 1;
    const monitoringId = formatMonitoringId(nextSeq);

    const newRecord = createResponseMonitoring(targetPlan, {
      monitoringId,
      createdBy: options.createdBy || 'Command Center',
    });

    setMonitoringRecords(prev => [newRecord, ...prev]);
    setSelectedMonitoringId(newRecord.monitoringId);
    return newRecord;
  }, [getPlanById, monitoringRecords]);

  /**
   * Starts simulation for a NOT_STARTED monitoring record (Section 9).
   */
  const startSimulation = useCallback((monitoringId, options = {}) => {
    setMonitoringRecords(prev => prev.map(m => {
      if (m.monitoringId !== monitoringId) return m;

      const now = new Date().toISOString();
      const actor = options.actor || 'Command Center';

      return {
        ...m,
        status: MONITORING_STATUS.IN_PROGRESS,
        startedAt: m.startedAt || now,
        lastUpdatedAt: now,
        history: [
          ...m.history,
          {
            id: `mon-hist-${m.history.length + 1}`,
            action: 'Response simulation started',
            actor,
            timestamp: now,
            note: 'Operational commander launched simulated response monitoring.',
          },
        ],
      };
    }));
  }, []);

  /**
   * Adds human-directed simulated progress to a specific resource within a zone (Section 12).
   */
  const addProgress = useCallback((monitoringId, { zoneId, resource, amount, actor = 'Command Center' }) => {
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Progress amount must be a positive numeric value.');
    }

    let validationError = null;

    setMonitoringRecords(prev => prev.map(m => {
      if (m.monitoringId !== monitoringId) return m;

      const now = new Date().toISOString();

      // Deep clone zone progress array
      const updatedZoneProgress = m.zoneProgress.map(zone => {
        if (zone.zoneId !== zoneId) return zone;

        let resourceFound = false;

        const updatedResources = zone.resources.map(res => {
          if (res.resource !== resource) return res;
          resourceFound = true;

          if (numericAmount > res.remaining) {
            validationError = `Amount (${numericAmount}) cannot exceed remaining planned quantity (${res.remaining}).`;
            return res;
          }

          const newCompleted = Math.min(res.planned, res.completed + numericAmount);
          const newRemaining = Math.max(0, res.planned - newCompleted);
          const newProgress = calculateResourceProgress(newCompleted, res.planned);
          const newStatus = newCompleted >= res.planned ? RESOURCE_STATUS.COMPLETED : RESOURCE_STATUS.IN_PROGRESS;

          return {
            ...res,
            completed: newCompleted,
            remaining: newRemaining,
            progress: newProgress,
            status: newStatus,
          };
        });

        if (!resourceFound) {
          validationError = `Resource ${resource} not found in ${zone.zoneName || zoneId}.`;
          return zone;
        }

        const overallZoneProgress = calculateZoneProgress(updatedResources);
        const zoneStatus = calculateZoneStatus(updatedResources);

        return {
          ...zone,
          resources: updatedResources,
          overallProgress: overallZoneProgress,
          status: zoneStatus,
        };
      });

      if (validationError) {
        return m;
      }

      const overallResponseProgress = calculateOverallProgress(updatedZoneProgress);
      const overallStatus = deriveOverallStatus(updatedZoneProgress, m.status);

      return {
        ...m,
        zoneProgress: updatedZoneProgress,
        overallProgress: overallResponseProgress,
        status: overallStatus,
        lastUpdatedAt: now,
        history: [
          ...m.history,
          {
            id: `mon-hist-${m.history.length + 1}`,
            action: `${resource} progress updated for ${zoneId}`,
            actor,
            timestamp: now,
            note: `Added ${numericAmount} completed units for ${resource}. Overall progress: ${overallResponseProgress}%.`,
          },
        ],
      };
    }));

    if (validationError) {
      throw new Error(validationError);
    }
  }, []);

  /**
   * Pauses the simulation (Section 15).
   */
  const pauseSimulation = useCallback((monitoringId, options = {}) => {
    setMonitoringRecords(prev => prev.map(m => {
      if (m.monitoringId !== monitoringId) return m;

      const now = new Date().toISOString();
      const actor = options.actor || 'Command Center';

      return {
        ...m,
        status: MONITORING_STATUS.PAUSED,
        lastUpdatedAt: now,
        history: [
          ...m.history,
          {
            id: `mon-hist-${m.history.length + 1}`,
            action: 'Response simulation paused',
            actor,
            timestamp: now,
            note: 'Simulation temporarily paused by operational command.',
          },
        ],
      };
    }));
  }, []);

  /**
   * Resumes the paused simulation (Section 15).
   */
  const resumeSimulation = useCallback((monitoringId, options = {}) => {
    setMonitoringRecords(prev => prev.map(m => {
      if (m.monitoringId !== monitoringId) return m;

      const now = new Date().toISOString();
      const actor = options.actor || 'Command Center';
      const resumedStatus = deriveOverallStatus(m.zoneProgress, MONITORING_STATUS.IN_PROGRESS);

      return {
        ...m,
        status: resumedStatus,
        lastUpdatedAt: now,
        history: [
          ...m.history,
          {
            id: `mon-hist-${m.history.length + 1}`,
            action: 'Response simulation resumed',
            actor,
            timestamp: now,
            note: 'Operational commander resumed simulated response monitoring.',
          },
        ],
      };
    }));
  }, []);

  /**
   * Completes the simulation (Section 16).
   * Validates that all planned resources have reached 100%.
   */
  const completeSimulation = useCallback((monitoringId, options = {}) => {
    const target = monitoringRecords.find(m => m.monitoringId === monitoringId);
    if (!target) {
      throw new Error('Monitoring record not found.');
    }

    // Check if any resources are still incomplete
    let hasIncomplete = false;
    target.zoneProgress.forEach(z => {
      z.resources.forEach(r => {
        if (r.completed < r.planned) {
          hasIncomplete = true;
        }
      });
    });

    if (hasIncomplete || target.overallProgress < 100) {
      return {
        success: false,
        error: 'Simulation cannot be completed yet. Some planned actions are still incomplete.',
      };
    }

    const now = new Date().toISOString();
    const actor = options.actor || 'Command Center';

    setMonitoringRecords(prev => prev.map(m => {
      if (m.monitoringId !== monitoringId) return m;

      return {
        ...m,
        status: MONITORING_STATUS.COMPLETED,
        completedAt: now,
        lastUpdatedAt: now,
        history: [
          ...m.history,
          {
            id: `mon-hist-${m.history.length + 1}`,
            action: 'Response simulation completed',
            actor,
            timestamp: now,
            note: 'All planned resource actions have achieved 100% simulated completion.',
          },
        ],
      };
    }));

    return { success: true };
  }, [monitoringRecords]);

  /**
   * Helper: Retrieve filtered simulated progress for specific department roles (Section 21).
   */
  const getDepartmentProgress = useCallback((department, monitoringRecord = currentMonitoring) => {
    if (!monitoringRecord || !monitoringRecord.zoneProgress) return [];

    let targetResources = [];
    if (department === 'HEALTH') targetResources = ['medicalTeams'];
    if (department === 'FOOD_SUPPLY') targetResources = ['food', 'water'];
    if (department === 'RESCUE') targetResources = ['rescueBoats'];

    return monitoringRecord.zoneProgress.map(zone => {
      const filtered = zone.resources.filter(r => targetResources.includes(r.resource));
      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        priorityScore: zone.priorityScore,
        priorityBand: zone.priorityBand,
        resources: filtered,
        overallProgress: calculateZoneProgress(filtered),
        status: calculateZoneStatus(filtered),
      };
    }).filter(z => z.resources.length > 0);
  }, [currentMonitoring]);

  return (
    <ResponseMonitoringContext.Provider
      value={{
        monitoringRecords,
        disasterMonitoringRecords,
        currentMonitoring,
        selectedMonitoringId,
        setSelectedMonitoringId,
        initializeMonitoringForPlan,
        startSimulation,
        addProgress,
        pauseSimulation,
        resumeSimulation,
        completeSimulation,
        getDepartmentProgress,
      }}
    >
      {children}
    </ResponseMonitoringContext.Provider>
  );
}

export function useResponseMonitoring() {
  const context = useContext(ResponseMonitoringContext);
  if (!context) {
    throw new Error('useResponseMonitoring must be used within a ResponseMonitoringProvider');
  }
  return context;
}

export default ResponseMonitoringContext;
