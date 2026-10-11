/**
 * RELIEF-OS Relief Shelter Context
 * 
 * Manages simulated relief shelter points for disaster visualization.
 * 
 * STRICT COMPLIANCE:
 * - Pure simulation / prototype shelter records.
 * - ZERO modification to live inventory, allocations, plans, monitoring, or safety updates.
 * - Strict disaster isolation by disasterId.
 * - Strict validation: capacity >= 0, occupancy >= 0, occupancy <= capacity.
 * - Schematic locations strictly keep latitude/longitude null.
 * - Role security: Only COMMAND_CENTER can mutate shelter records.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDisaster } from './DisasterContext';
import { ROLES } from '../config/roles';
import {
  createShelter,
  calculateRemainingCapacity,
  SHELTER_SAFETY_DISCLAIMER,
  SHELTER_STATUS,
  SHELTER_LOCATION_TYPE,
  formatShelterId
} from '../models/reliefShelter';

const ReliefShelterContext = createContext(null);

// Initial canonical simulated demo shelters for DISASTER-001
const INITIAL_DEMO_SHELTERS = [
  createShelter({
    shelterId: 'SH-0001',
    disasterId: 'DISASTER-001',
    name: 'Sector 4 Community Point (Simulated)',
    area: 'Morigaon Sector 4',
    status: SHELTER_STATUS.SIMULATED,
    capacity: 250,
    occupancy: 180,
    services: ['First Aid', 'Drinking Water', 'Dry Rations'],
    locationType: SHELTER_LOCATION_TYPE.SCHEMATIC,
    latitude: null,
    longitude: null,
  }),
  createShelter({
    shelterId: 'SH-0002',
    disasterId: 'DISASTER-001',
    name: 'Nagaon Lowland Staging Point (Simulated)',
    area: 'Nagaon Lowland Reach',
    status: SHELTER_STATUS.SIMULATED,
    capacity: 300,
    occupancy: 195,
    services: ['First Aid', 'Drinking Water', 'Temporary Bedding'],
    locationType: SHELTER_LOCATION_TYPE.SCHEMATIC,
    latitude: null,
    longitude: null,
  }),
  createShelter({
    shelterId: 'SH-0003',
    disasterId: 'DISASTER-001',
    name: 'Highlands Edge Community Point (Simulated)',
    area: 'Kaliabor Highlands',
    status: SHELTER_STATUS.SIMULATED,
    capacity: 200,
    occupancy: 60,
    services: ['Medical Checkup', 'Drinking Water'],
    locationType: SHELTER_LOCATION_TYPE.SCHEMATIC,
    latitude: null,
    longitude: null,
  }),
  createShelter({
    shelterId: 'SH-0004',
    disasterId: 'DISASTER-001',
    name: 'Rural Ward Shelter Point (Simulated)',
    area: 'Dhing Rural Ward',
    status: SHELTER_STATUS.SIMULATED,
    capacity: 150,
    occupancy: 40,
    services: ['First Aid', 'Ration Pack Distribution'],
    locationType: SHELTER_LOCATION_TYPE.SCHEMATIC,
    latitude: null,
    longitude: null,
  }),
];

export function ReliefShelterProvider({ children }) {
  const { currentUser, role } = useAuth();
  const { currentDisaster } = useDisaster();

  // Master list of all simulated shelters
  const [sheltersList, setSheltersList] = useState(INITIAL_DEMO_SHELTERS);

  // Active disaster ID
  const activeDisasterId = currentDisaster?.id || null;

  // Filter shelters strictly for the active disaster
  const activeShelters = useMemo(() => {
    if (!activeDisasterId) return [];
    return sheltersList.filter((s) => s.disasterId === activeDisasterId);
  }, [sheltersList, activeDisasterId]);

  /**
   * Helper to retrieve shelters for a specific disaster ID.
   */
  const getSheltersByDisaster = useCallback((disasterId) => {
    if (!disasterId) return [];
    return sheltersList.filter((s) => s.disasterId === disasterId);
  }, [sheltersList]);

  /**
   * Role Security Check
   */
  const verifyCommandCenterAuth = useCallback(() => {
    const effectiveRole = currentUser?.role || role;
    if (effectiveRole !== ROLES.COMMAND_CENTER) {
      throw new Error('Unauthorized: Only Command Center personnel can mutate shelter records.');
    }
  }, [currentUser?.role, role]);

  /**
   * Adds a new simulated shelter record for the active disaster.
   * Only COMMAND_CENTER is authorized.
   */
  const addShelter = useCallback((input) => {
    verifyCommandCenterAuth();

    const targetDisasterId = input?.disasterId || activeDisasterId;
    if (!targetDisasterId) {
      throw new Error('Active disaster required to create shelter.');
    }

    const sequence = sheltersList.length + 1;
    const newShelter = createShelter(
      { ...input, disasterId: targetDisasterId },
      { sequence, shelterId: input?.shelterId || formatShelterId(sequence) }
    );

    setSheltersList((prev) => [...prev, newShelter]);
    return newShelter;
  }, [verifyCommandCenterAuth, activeDisasterId, sheltersList.length]);

  /**
   * Updates occupancy of a simulated shelter.
   * Only COMMAND_CENTER is authorized.
   */
  const updateOccupancy = useCallback((shelterId, newOccupancy) => {
    verifyCommandCenterAuth();

    const occ = Number(newOccupancy);
    if (Number.isNaN(occ) || occ < 0) {
      throw new Error('Occupancy must be a non-negative number.');
    }

    setSheltersList((prev) =>
      prev.map((s) => {
        if (s.shelterId !== shelterId) return s;
        if (occ > s.capacity) {
          throw new Error(`Occupancy (${occ}) cannot exceed capacity (${s.capacity}).`);
        }
        return createShelter({ ...s, occupancy: occ }, { shelterId: s.shelterId });
      })
    );
  }, [verifyCommandCenterAuth]);

  const value = useMemo(() => ({
    shelters: activeShelters,
    allShelters: sheltersList,
    disclaimer: SHELTER_SAFETY_DISCLAIMER,
    getSheltersByDisaster,
    addShelter,
    updateOccupancy,
    calculateRemainingCapacity,
  }), [
    activeShelters,
    sheltersList,
    getSheltersByDisaster,
    addShelter,
    updateOccupancy,
  ]);

  return (
    <ReliefShelterContext.Provider value={value}>
      {children}
    </ReliefShelterContext.Provider>
  );
}

export function useReliefShelter() {
  const context = useContext(ReliefShelterContext);
  if (!context) {
    throw new Error('useReliefShelter must be used within a ReliefShelterProvider');
  }
  return context;
}
