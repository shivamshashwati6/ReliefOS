/**
 * RELIEF-OS What-If Simulation Lab Configuration & Parameters
 * 
 * Defines preset simulation scenarios, fleet transport parameters,
 * and safety disclaimers for hypothetical decision-support modeling.
 * 
 * STRICT PROTOTYPE & ARCHITECTURAL INTEGRITY:
 * What-If simulations are strictly hypothetical and temporary.
 * They NEVER mutate real inventory baselines, disaster records,
 * priority scores, or approved response plans.
 */

export const SIMULATION_SAFETY_DISCLAIMER =
  'HYPOTHETICAL SIMULATION ONLY — Decision-support modeling for hackathon demonstration. ' +
  'No physical inventory is altered, and no actual fleet dispatch or resource movement occurs.';

/**
 * Architectural note on logistics integration:
 * The baseline Allocation Engine directly optimizes warehouse commodity stockpiles
 * ('food', 'water', 'rescueBoats', 'medicalTeams'). Heavy transport vehicles ('vehicles': 21 units)
 * are tracked in operational status (demoData.js). In this What-If Lab, removing trucks
 * models logistics delivery throughput constraint where each relief truck conveys 500 food kits.
 */
export const LOGISTICS_INTEGRATION_NOTE =
  'Data Model Alignment Note: In RELIEF-OS, the allocation engine models warehouse stockpiles. ' +
  'The What-If Lab models vehicle fleet constraints via delivery throughput (500 kits per transport truck). ' +
  'Removing 2 trucks reduces active deliverable food throughput by 1,000 kits.';

export const FLEET_PARAMETERS = {
  // Baseline active relief transport trucks in the operational convoy
  BASELINE_TRUCKS: 6,
  
  // Deliverable food kits capacity conveyed per transport truck
  FOOD_KITS_PER_TRUCK: 500,

  // Water units conveyed per water tanker truck
  WATER_UNITS_PER_TRUCK: 375,
};

export const PRESET_SCENARIOS = {
  BASELINE: {
    id: 'BASELINE',
    name: 'Current Baseline',
    description: 'Current active disaster allocation without hypothetical constraints.',
    trucksRemoved: 0,
    inventoryDeltas: { food: 0, water: 0, rescueBoats: 0, medicalTeams: 0 }
  },
  REMOVE_2_TRUCKS: {
    id: 'REMOVE_2_TRUCKS',
    name: 'Simulate Removal of 2 Trucks (PRD Demo)',
    description: 'Simulates mechanical breakdown or flood blockage of 2 relief convoy trucks, reducing deliverable food supply by 1,000 kits.',
    trucksRemoved: 2,
    inventoryDeltas: { food: -1000, water: 0, rescueBoats: 0, medicalTeams: 0 }
  },
  WATER_CONTAMINATION: {
    id: 'WATER_CONTAMINATION',
    name: 'Purification Plant Deficit (-500 Water)',
    description: 'Simulates municipal water plant shutdown, reducing potable water inventory by 500 units.',
    trucksRemoved: 0,
    inventoryDeltas: { food: 0, water: -500, rescueBoats: 0, medicalTeams: 0 }
  },
  BOAT_REALLOCATION: {
    id: 'BOAT_REALLOCATION',
    name: 'Rescue Boat Diversion (-2 Boats)',
    description: 'Simulates diversion of 2 motorized rescue craft to an unexpected flash-flood surge sector.',
    trucksRemoved: 0,
    inventoryDeltas: { food: 0, water: 0, rescueBoats: -2, medicalTeams: 0 }
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Parameter Simulation',
    description: 'User-defined resource and vehicle availability adjustments.',
    trucksRemoved: 0,
    inventoryDeltas: { food: 0, water: 0, rescueBoats: 0, medicalTeams: 0 }
  }
};
