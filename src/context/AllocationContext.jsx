/**
 * RELIEF-OS Allocation Context
 * 
 * Provides reactive access to deterministic resource allocation recommendations.
 * Derives allocations from ZoneContext without duplicating zone state.
 * 
 * IMPORTANT DISCLAIMER:
 * Allocations are recommendations for human review and decision support only.
 * No automated dispatching, vehicle routing, or inventory mutation occurs.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useZones } from './ZoneContext';
import { useDisaster } from './DisasterContext';
import { calculateAllocation } from '../engines/allocationEngine';
import { CANONICAL_SIMULATED_INVENTORY, ALLOCATION_PARAMETERS } from '../config/allocationParameters';

const AllocationContext = createContext(null);

export function AllocationProvider({ children }) {
  const { currentDisaster } = useDisaster();
  const { zones } = useZones();

  // Simulated inventory baseline (isolated per session, non-mutating)
  const [simulatedInventory, setSimulatedInventory] = useState(CANONICAL_SIMULATED_INVENTORY);
  const [coverageRatio, setCoverageRatio] = useState(ALLOCATION_PARAMETERS.MINIMUM_COVERAGE_RATIO);

  // Human Review & Simulation Approval state (Section 21: UI demonstration state only)
  const [simulationApproval, setSimulationApproval] = useState({
    status: 'PENDING_REVIEW', // 'PENDING_REVIEW' | 'SIMULATION_APPROVED'
    approvedAt: null,
    approvedBy: null,
    notes: 'Prototype recommendation awaiting human review.',
  });

  const targetDisasterId = currentDisaster?.id || 'DISASTER-001';

  // Deterministically derive allocations whenever zones, inventory, or disasterId changes
  const allocationResult = useMemo(() => {
    return calculateAllocation({
      zones,
      inventory: simulatedInventory,
      disasterId: targetDisasterId,
      options: {
        minimumCoverageRatio: coverageRatio,
      },
    });
  }, [zones, simulatedInventory, targetDisasterId, coverageRatio]);

  // Demo simulation approval interaction (Section 21)
  const approveSimulation = useCallback((reviewerName = 'Command Center Officer') => {
    setSimulationApproval({
      status: 'SIMULATION_APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: reviewerName,
      notes: 'Allocation approved for simulation only. Real-world dispatch remains manual.',
    });
  }, []);

  const resetSimulationApproval = useCallback(() => {
    setSimulationApproval({
      status: 'PENDING_REVIEW',
      approvedAt: null,
      approvedBy: null,
      notes: 'Prototype recommendation awaiting human review.',
    });
  }, []);

  // Update simulated inventory for "what-if" planning
  const updateSimulatedInventory = useCallback((newInventory) => {
    setSimulatedInventory(prev => ({
      ...prev,
      ...newInventory,
    }));
  }, []);

  // Reset inventory to canonical Assam Flood demonstration values
  const resetToCanonicalInventory = useCallback(() => {
    setSimulatedInventory(CANONICAL_SIMULATED_INVENTORY);
  }, []);

  // Helper: Filter allocations by resource type
  const getAllocationsByResource = useCallback((resourceKey) => {
    return allocationResult.allocations.filter(a => a.resource === resourceKey);
  }, [allocationResult]);

  // Helper: Filter allocations by zone ID
  const getAllocationsByZone = useCallback((zoneId) => {
    return allocationResult.allocations.filter(a => a.zoneId === zoneId);
  }, [allocationResult]);

  // Helper: Filter allocations for specific department roles (Section 23)
  const getDepartmentAllocations = useCallback((department) => {
    if (department === 'HEALTH') {
      return allocationResult.allocations.filter(a => a.resource === 'medicalTeams');
    }
    if (department === 'FOOD_SUPPLY') {
      return allocationResult.allocations.filter(a => a.resource === 'food' || a.resource === 'water');
    }
    if (department === 'RESCUE') {
      return allocationResult.allocations.filter(a => a.resource === 'rescueBoats');
    }
    return allocationResult.allocations;
  }, [allocationResult]);

  return (
    <AllocationContext.Provider
      value={{
        disasterId: targetDisasterId,
        allocations: allocationResult.allocations,
        remainingInventory: allocationResult.remainingInventory,
        unmetDemand: allocationResult.unmetDemand,
        totalRequested: allocationResult.totalRequested,
        totalAllocated: allocationResult.totalAllocated,
        explanation: allocationResult.explanation,
        calculationSteps: allocationResult.calculationSteps,
        simulatedInventory,
        coverageRatio,
        setCoverageRatio,
        updateSimulatedInventory,
        resetToCanonicalInventory,
        simulationApproval,
        approveSimulation,
        resetSimulationApproval,
        getAllocationsByResource,
        getAllocationsByZone,
        getDepartmentAllocations,
      }}
    >
      {children}
    </AllocationContext.Provider>
  );
}

export function useAllocation() {
  const context = useContext(AllocationContext);
  if (!context) {
    throw new Error('useAllocation must be used within an AllocationProvider');
  }
  return context;
}

export default AllocationContext;
