import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useDisaster } from './DisasterContext';
import { useReports } from './ReportContext';
import { INITIAL_ZONES_DATA, matchReportToZone } from '../data/canonicalZones';
import { calculateZonePriority } from '../engines/priorityEngine';
import { DEFAULT_PRIORITY_WEIGHTS } from '../config/priorityWeights';

const ZoneContext = createContext(null);

export function ZoneProvider({ children }) {
  const { currentDisaster, disasters } = useDisaster();
  const { reports, getReportsByDisaster } = useReports();

  const [selectedZoneId, setSelectedZoneId] = useState('zone-a');
  const [weights, setWeights] = useState(DEFAULT_PRIORITY_WEIGHTS);
  const [recomputeTick, setRecomputeTick] = useState(0);

  // Manual recomputation trigger
  const recomputeZones = useCallback(() => {
    setRecomputeTick(prev => prev + 1);
  }, []);

  /**
   * Computes zones deterministically for a given disaster event.
   */
  const computeDisasterZones = useCallback((targetDisasterId) => {
    const disasterId = targetDisasterId || currentDisaster?.id || 'DISASTER-001';
    
    // Retrieve base zones for this disaster
    let baseZones = INITIAL_ZONES_DATA.filter(z => z.disasterId === disasterId);
    if (baseZones.length === 0) {
      // If a newly created disaster has no seeded zones, generate standard geographic sectors
      const disasterName = currentDisaster?.name || 'Incident';
      baseZones = [
        {
          id: `${disasterId.toLowerCase()}-zone-a`,
          disasterId,
          name: 'Zone A',
          fullName: `Zone A — ${disasterName} Core`,
          location: { lat: 26.25, lng: 92.34 },
          affectedPopulation: 3500,
          baselineSeverity: 0.75,
          baselineMedicalRisk: 0.50,
          baselineShortage: 0.50,
          accessibilityDifficulty: 0.60,
          vulnerability: 0.80,
          keyIssue: 'Ground sector inundation',
          accessStatus: 'Restricted Access',
          keywords: ['zone a', 'core', 'sector a']
        },
        {
          id: `${disasterId.toLowerCase()}-zone-b`,
          disasterId,
          name: 'Zone B',
          fullName: `Zone B — ${disasterName} Periphery`,
          location: { lat: 26.35, lng: 92.68 },
          affectedPopulation: 2200,
          baselineSeverity: 0.50,
          baselineMedicalRisk: 0.20,
          baselineShortage: 0.30,
          accessibilityDifficulty: 0.40,
          vulnerability: 0.50,
          keyIssue: 'Secondary infrastructure strain',
          accessStatus: 'Open Route',
          keywords: ['zone b', 'periphery', 'sector b']
        }
      ];
    }

    // Get reports strictly isolated to this disaster
    const disasterReports = getReportsByDisaster(disasterId) || [];

    // Map reports to zones
    const zoneReportsMap = {};
    baseZones.forEach(z => {
      zoneReportsMap[z.id] = [];
    });

    disasterReports.forEach(rep => {
      const matchedZoneId = matchReportToZone(rep, baseZones);
      if (zoneReportsMap[matchedZoneId]) {
        zoneReportsMap[matchedZoneId].push(rep);
      } else if (baseZones[0]) {
        zoneReportsMap[baseZones[0].id].push(rep);
      }
    });

    // Find maximum population across this disaster's zones
    const maxPopulation = baseZones.reduce((max, z) => {
      const pop = typeof z.affectedPopulation === 'number'
        ? z.affectedPopulation
        : parseInt(String(z.affectedPopulation || '0').replace(/,/g, ''), 10) || 0;
      return Math.max(max, pop);
    }, 1);

    // Run deterministic calculation for each zone
    const calculatedZones = baseZones.map(zone => {
      const assigned = zoneReportsMap[zone.id] || [];
      return calculateZonePriority(zone, assigned, maxPopulation, weights);
    });

    // Sort zones by priorityScore descending (highest priority first)
    return calculatedZones.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [currentDisaster?.id, currentDisaster?.name, getReportsByDisaster, weights]);

  // Active zones for current disaster
  const currentZones = useMemo(() => {
    return computeDisasterZones(currentDisaster?.id);
  }, [computeDisasterZones, currentDisaster?.id, reports, recomputeTick]);

  // Selected zone
  const selectedZone = useMemo(() => {
    return currentZones.find(z => z.id === selectedZoneId) || currentZones[0] || null;
  }, [currentZones, selectedZoneId]);

  const selectZone = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
  }, []);

  const getZonesByDisaster = useCallback((disasterId) => {
    return computeDisasterZones(disasterId);
  }, [computeDisasterZones]);

  const getZoneById = useCallback((zoneId) => {
    return currentZones.find(z => z.id === zoneId) || null;
  }, [currentZones]);

  return (
    <ZoneContext.Provider
      value={{
        zones: currentZones,
        selectedZone,
        selectedZoneId,
        selectZone,
        getZonesByDisaster,
        getZoneById,
        recomputeZones,
        weights,
        setWeights
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
}

export function useZones() {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZones must be used within a ZoneProvider');
  }
  return context;
}

export default ZoneContext;
