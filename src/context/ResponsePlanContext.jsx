/**
 * RELIEF-OS Response Plan Context
 * 
 * Provides state and actions for managing reviewable Response Plans.
 * Consumes AllocationContext directly — ZERO recalculation of priority or demand.
 * 
 * STRICT COMPLIANCE:
 * - Human approval workflow (DRAFT -> UNDER_REVIEW -> APPROVED / REJECTED)
 * - Strict disaster isolation (disasterId)
 * - Approval does NOT mutate real inventory or dispatch resources.
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useAllocation } from './AllocationContext';
import { useDisaster } from './DisasterContext';
import { 
  PLAN_STATUS, 
  APPROVAL_STATUS, 
  createResponsePlan, 
  formatPlanId, 
  formatPlanTime 
} from '../models/responsePlan';

const ResponsePlanContext = createContext(null);

export function ResponsePlanProvider({ children }) {
  const { currentDisaster } = useDisaster();
  const { 
    allocations, 
    unmetDemand, 
    totalRequested, 
    totalAllocated, 
    remainingInventory 
  } = useAllocation();

  const activeDisasterId = currentDisaster?.id || 'DISASTER-001';

  // In-memory collection of all response plans
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Initialize canonical RP-0001 for DISASTER-001 if none exists yet
  useEffect(() => {
    if (plans.length === 0 && allocations.length > 0) {
      const canonicalPlan = createResponsePlan({
        planId: 'RP-0001',
        disasterId: 'DISASTER-001',
        disasterName: currentDisaster?.name || 'Assam Flood Response',
        region: currentDisaster?.region || 'Morigaon, Assam',
        createdBy: 'Command Center',
        allocations,
        unmetDemand,
        totalRequested,
        totalAllocated,
        remainingInventory,
        status: PLAN_STATUS.UNDER_REVIEW,
        notes: 'Initial operational response plan generated for Morigaon Flood sectors.',
      });

      // Add "Review started" history entry for RP-0001
      canonicalPlan.history.push({
        id: 'hist-2',
        timestamp: new Date().toISOString(),
        timeFormatted: formatPlanTime(),
        action: 'Review started',
        user: 'Command Center',
        note: 'Response plan submitted for commander operational review.',
        statusAtStep: PLAN_STATUS.UNDER_REVIEW,
      });

      setPlans([canonicalPlan]);
      setSelectedPlanId('RP-0001');
    }
  }, [allocations.length, plans.length, currentDisaster?.name, currentDisaster?.region]);

  /**
   * Plans strictly isolated to the currently active disaster event.
   */
  const disasterPlans = useMemo(() => {
    return plans.filter(p => p.disasterId === activeDisasterId);
  }, [plans, activeDisasterId]);

  /**
   * Active selected plan (or latest disaster plan fallback)
   */
  const currentPlan = useMemo(() => {
    if (selectedPlanId) {
      const found = plans.find(p => p.planId === selectedPlanId);
      if (found) return found;
    }
    return disasterPlans[0] || null;
  }, [plans, selectedPlanId, disasterPlans]);

  /**
   * Creates a new Response Plan in DRAFT status using the CURRENT allocation recommendations.
   * Does NOT duplicate allocation calculations; snapshots directly from AllocationContext.
   */
  const createPlanFromCurrentAllocation = useCallback((options = {}) => {
    const nextSeq = plans.length + 1;
    const planId = formatPlanId(nextSeq);

    const newPlan = createResponsePlan({
      planId,
      disasterId: activeDisasterId,
      disasterName: currentDisaster?.name || 'Disaster Response',
      region: currentDisaster?.region || 'Affected Zone',
      createdBy: options.createdBy || 'Command Center',
      allocations,
      unmetDemand,
      totalRequested,
      totalAllocated,
      remainingInventory,
      notes: options.notes || 'Recommended distribution plan based on current zone priorities.',
      status: PLAN_STATUS.DRAFT,
    });

    setPlans(prev => [newPlan, ...prev]);
    setSelectedPlanId(newPlan.planId);
    return newPlan;
  }, [
    plans.length, 
    activeDisasterId, 
    currentDisaster?.name, 
    currentDisaster?.region, 
    allocations, 
    unmetDemand, 
    totalRequested, 
    totalAllocated, 
    remainingInventory
  ]);

  /**
   * Transitions plan status from DRAFT -> UNDER_REVIEW.
   */
  const startReview = useCallback((planId, options = {}) => {
    setPlans(prev => prev.map(p => {
      if (p.planId !== planId) return p;

      const now = new Date().toISOString();
      const timeStr = formatPlanTime(now);

      const updatedHistory = [
        ...p.history,
        {
          id: `hist-${p.history.length + 1}`,
          timestamp: now,
          timeFormatted: timeStr,
          action: 'Review started',
          user: options.user || 'Command Center',
          note: options.note || 'Plan placed under commander review.',
          statusAtStep: PLAN_STATUS.UNDER_REVIEW,
        },
      ];

      return {
        ...p,
        status: PLAN_STATUS.UNDER_REVIEW,
        history: updatedHistory,
      };
    }));
  }, []);

  /**
   * Transitions plan status from UNDER_REVIEW -> APPROVED.
   * IMPORTANT: Does NOT decrement inventory or trigger dispatch!
   */
  const approvePlan = useCallback((planId, options = {}) => {
    setPlans(prev => prev.map(p => {
      if (p.planId !== planId) return p;

      const now = new Date().toISOString();
      const timeStr = formatPlanTime(now);
      const approvedBy = options.approvedBy || 'Command Center';
      const approvalNote = options.note || 'Response plan approved for simulation.';

      const updatedHistory = [
        ...p.history,
        {
          id: `hist-${p.history.length + 1}`,
          timestamp: now,
          timeFormatted: timeStr,
          action: `Plan approved by ${approvedBy}`,
          user: approvedBy,
          note: approvalNote,
          statusAtStep: PLAN_STATUS.APPROVED,
        },
      ];

      return {
        ...p,
        status: PLAN_STATUS.APPROVED,
        approval: {
          status: APPROVAL_STATUS.APPROVED,
          approvedBy,
          approvedAt: now,
          note: approvalNote,
        },
        history: updatedHistory,
      };
    }));
  }, []);

  /**
   * Transitions plan status to REJECTED with an optional human rejection note.
   */
  const rejectPlan = useCallback((planId, options = {}) => {
    setPlans(prev => prev.map(p => {
      if (p.planId !== planId) return p;

      const now = new Date().toISOString();
      const timeStr = formatPlanTime(now);
      const rejectedBy = options.rejectedBy || 'Command Center';
      const rejectionNote = options.note || 'Plan rejected during operational review.';

      const updatedHistory = [
        ...p.history,
        {
          id: `hist-${p.history.length + 1}`,
          timestamp: now,
          timeFormatted: timeStr,
          action: `Plan rejected by ${rejectedBy}`,
          user: rejectedBy,
          note: rejectionNote,
          statusAtStep: PLAN_STATUS.REJECTED,
        },
      ];

      return {
        ...p,
        status: PLAN_STATUS.REJECTED,
        approval: {
          status: APPROVAL_STATUS.REJECTED,
          approvedBy: rejectedBy,
          approvedAt: now,
          note: rejectionNote,
        },
        history: updatedHistory,
      };
    }));
  }, []);

  /**
   * Helper: Retrieve a plan by ID
   */
  const getPlanById = useCallback((planId) => {
    return plans.find(p => p.planId === planId) || null;
  }, [plans]);

  /**
   * Helper: Retrieve plans by disasterId
   */
  const getPlansByDisaster = useCallback((disasterId) => {
    return plans.filter(p => p.disasterId === disasterId);
  }, [plans]);

  return (
    <ResponsePlanContext.Provider
      value={{
        plans,
        disasterPlans,
        currentPlan,
        selectedPlanId,
        setSelectedPlanId,
        createPlanFromCurrentAllocation,
        startReview,
        approvePlan,
        rejectPlan,
        getPlanById,
        getPlansByDisaster,
      }}
    >
      {children}
    </ResponsePlanContext.Provider>
  );
}

export function useResponsePlan() {
  const context = useContext(ResponsePlanContext);
  if (!context) {
    throw new Error('useResponsePlan must be used within a ResponsePlanProvider');
  }
  return context;
}

export default ResponsePlanContext;
