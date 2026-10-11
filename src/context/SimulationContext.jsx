/**
 * RELIEF-OS What-If Simulation Context
 * 
 * Provides reactive state management for hypothetical decision-support simulations.
 * Uses the deterministic What-If simulation engine without mutating baseline state.
 * 
 * STRICT ROLE & SAFETY RULES:
 * 1. Role-based execution: COMMAND_CENTER can execute scenarios and resets.
 * 2. DEPARTMENT role can view simulations in read-only mode.
 * 3. CITIZEN role is strictly denied access.
 * 4. Zero mutation of real warehouse inventories, response plans, or priority scores.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDisaster } from './DisasterContext';
import { useZones } from './ZoneContext';
import { useAllocation } from './AllocationContext';
import { ROLES } from '../config/roles';
import { 
  PRESET_SCENARIOS, 
  SIMULATION_SAFETY_DISCLAIMER, 
  LOGISTICS_INTEGRATION_NOTE 
} from '../config/simulationParameters';
import { runWhatIfSimulation } from '../engines/simulationEngine';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const { currentUser, role } = useAuth();
  const { currentDisaster } = useDisaster();
  const { zones } = useZones();
  const { simulatedInventory: baselineInventory } = useAllocation();

  const isCommandCenter = role === ROLES.COMMAND_CENTER;
  const isDepartment = role === ROLES.DEPARTMENT;
  const targetDisasterId = currentDisaster?.id || 'DISASTER-001';

  // Active scenario selection (default to PRD hero scenario: REMOVE_2_TRUCKS)
  const [activeScenario, setActiveScenario] = useState(PRESET_SCENARIOS.REMOVE_2_TRUCKS);

  // Custom scenario overrides
  const [customParams, setCustomParams] = useState({
    trucksRemoved: 2,
    inventoryDeltas: { food: 0, water: 0, rescueBoats: 0, medicalTeams: 0 }
  });

  /**
   * Evaluates the simulation deterministically
   */
  const simulationResult = useMemo(() => {
    return runWhatIfSimulation({
      zones,
      baselineInventory,
      scenario: activeScenario,
      disasterId: targetDisasterId,
    });
  }, [zones, baselineInventory, activeScenario, targetDisasterId]);

  /**
   * Applies a preset scenario with role validation
   */
  const applyScenario = useCallback((scenarioKey) => {
    if (!isCommandCenter) {
      throw new Error(`Unauthorized: Role '${role || 'ANONYMOUS'}' cannot execute What-If simulations.`);
    }

    const targetScenario = PRESET_SCENARIOS[scenarioKey] || PRESET_SCENARIOS.REMOVE_2_TRUCKS;
    setActiveScenario(targetScenario);
  }, [isCommandCenter, role]);

  /**
   * Applies custom parameters
   */
  const applyCustomSimulation = useCallback((params) => {
    if (!isCommandCenter) {
      throw new Error(`Unauthorized: Role '${role || 'ANONYMOUS'}' cannot execute custom What-If simulations.`);
    }

    const custom = {
      id: 'CUSTOM',
      name: 'Custom Parameter Simulation',
      description: 'Hypothetical resource availability adjustment.',
      trucksRemoved: Number(params.trucksRemoved ?? 0),
      inventoryDeltas: { ...(params.inventoryDeltas || {}) }
    };

    setCustomParams(params);
    setActiveScenario(custom);
  }, [isCommandCenter, role]);

  /**
   * Resets simulation to baseline state
   */
  const resetSimulation = useCallback(() => {
    if (!isCommandCenter) {
      throw new Error(`Unauthorized: Role '${role || 'ANONYMOUS'}' cannot reset What-If simulation.`);
    }
    setActiveScenario(PRESET_SCENARIOS.BASELINE);
  }, [isCommandCenter, role]);

  const value = useMemo(() => ({
    disasterId: targetDisasterId,
    activeScenario,
    customParams,
    simulationResult,
    canRunSimulation: isCommandCenter,
    isReadOnly: isDepartment,
    applyScenario,
    applyCustomSimulation,
    resetSimulation,
    disclaimer: SIMULATION_SAFETY_DISCLAIMER,
    integrationNote: LOGISTICS_INTEGRATION_NOTE,
  }), [
    targetDisasterId,
    activeScenario,
    customParams,
    simulationResult,
    isCommandCenter,
    isDepartment,
    applyScenario,
    applyCustomSimulation,
    resetSimulation
  ]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
