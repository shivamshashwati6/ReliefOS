/**
 * RELIEF-OS What-If Simulation Lab Page (/simulation)
 * 
 * Provides an interactive decision-support sandbox for Command Center operators
 * to test hypothetical resource constraints and delivery fleet reductions.
 * 
 * PRD DEMO SCENARIO:
 * 1. Starts with current allocation baseline for active disaster.
 * 2. Simulates removal of 2 trucks from available logistics fleet.
 * 3. Recomputes allocation deterministically using existing Allocation Engine.
 * 4. Compares baseline and simulated outcomes side-by-side.
 * 5. Clearly flags resulting shortages (+1,000 kits unmet) across affected sectors.
 * 6. Explains mathematical reason (Pass 1 minimum coverage vs Pass 2 priority distribution).
 * 
 * STRICT HUMAN-IN-THE-LOOP & SAFETY PRINCIPLES:
 * - What-If changes are temporary hypothetical inputs.
 * - ZERO mutation of real inventory baselines, response plans, or priority scores.
 * - ZERO AI-generated numbers for deterministic math.
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Layers, 
  TrendingDown, 
  ShieldAlert, 
  Package, 
  Droplet, 
  LifeBuoy, 
  Boxes
} from 'lucide-react';

import { useSimulation } from '../context/SimulationContext';
import { useDisaster } from '../context/DisasterContext';
import { SIMULATION_SAFETY_DISCLAIMER, LOGISTICS_INTEGRATION_NOTE } from '../config/simulationParameters';
import StatusBadge from '../components/ui/StatusBadge';

export default function SimulationLabPage() {
  const { currentDisaster } = useDisaster();
  const { 
    activeScenario, 
    simulationResult, 
    canRunSimulation, 
    applyScenario, 
    resetSimulation 
  } = useSimulation();

  const [activeTab, setActiveTab] = useState('food'); // 'all' | 'food' | 'water' | 'rescueBoats' | 'medicalTeams'

  const comparison = simulationResult?.comparison || {};
  const allZoneAllocations = comparison.allZoneAllocations || [];
  const affectedZones = comparison.affectedZones || [];

  // Filtered rows for the comparison table
  const filteredRows = activeTab === 'all'
    ? allZoneAllocations
    : allZoneAllocations.filter(r => r.resource === activeTab);

  const handleSelectScenario = (key) => {
    try {
      applyScenario(key);
    } catch (err) {
      console.warn('Simulation selection error:', err.message);
    }
  };

  const handleReset = () => {
    try {
      resetSimulation();
    } catch (err) {
      console.warn('Simulation reset error:', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Context */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">What-If Simulation Lab</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                Simulation Only
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Hypothetical resource-constraint modeling for <strong>{currentDisaster?.name || 'Assam Flood Response'}</strong> ({currentDisaster?.region || 'Morigaon, Assam'}).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canRunSimulation ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Reset simulation to current baseline allocation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to Baseline</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Read-only simulation viewer
              </span>
            )}
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Decision-Support Safeguard:</strong> {SIMULATION_SAFETY_DISCLAIMER} Real warehouse stockpiles and approved response plans remain 100% unaltered.
          </p>
        </div>
      </div>

      {/* 2. Preset Scenarios Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Simulation Scenarios</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: {activeScenario.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Preset 1: PRD Hero Demo (-2 Trucks) */}
          <button
            type="button"
            disabled={!canRunSimulation}
            onClick={() => handleSelectScenario('REMOVE_2_TRUCKS')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeScenario.id === 'REMOVE_2_TRUCKS'
                ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs ring-1 ring-indigo-400'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                <Truck className="w-4 h-4" />
              </span>
              {activeScenario.id === 'REMOVE_2_TRUCKS' && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 mb-0.5">
              Remove 2 Delivery Trucks
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              PRD Demo: Simulates 2 breakdown trucks on Route C, cutting deliverable food by 1,000 kits.
            </p>
          </button>

          {/* Preset 2: Baseline */}
          <button
            type="button"
            disabled={!canRunSimulation}
            onClick={() => handleSelectScenario('BASELINE')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeScenario.id === 'BASELINE'
                ? 'bg-blue-50/70 border-blue-400 shadow-2xs ring-1 ring-blue-400'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1 rounded bg-blue-100 text-blue-700">
                <Boxes className="w-4 h-4" />
              </span>
              {activeScenario.id === 'BASELINE' && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 mb-0.5">
              Current Baseline (Nominal)
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Full nominal fleet (6 trucks) and full warehouse inventory without constraints.
            </p>
          </button>

          {/* Preset 3: Water Shortage */}
          <button
            type="button"
            disabled={!canRunSimulation}
            onClick={() => handleSelectScenario('WATER_CONTAMINATION')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeScenario.id === 'WATER_CONTAMINATION'
                ? 'bg-amber-50/70 border-amber-400 shadow-2xs ring-1 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1 rounded bg-amber-100 text-amber-700">
                <Droplet className="w-4 h-4" />
              </span>
              {activeScenario.id === 'WATER_CONTAMINATION' && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 mb-0.5">
              Water Plant Deficit (-500)
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Simulates municipal purification shutdown, cutting water inventory to 1,000 units.
            </p>
          </button>

          {/* Preset 4: Boat Diversion */}
          <button
            type="button"
            disabled={!canRunSimulation}
            onClick={() => handleSelectScenario('BOAT_REALLOCATION')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeScenario.id === 'BOAT_REALLOCATION'
                ? 'bg-rose-50/70 border-rose-400 shadow-2xs ring-1 ring-rose-400'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1 rounded bg-rose-100 text-rose-700">
                <LifeBuoy className="w-4 h-4" />
              </span>
              {activeScenario.id === 'BOAT_REALLOCATION' && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 mb-0.5">
              Boat Diversion (-2 Boats)
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Simulates emergency re-tasking of 2 motorcraft to high-priority flash flood sector.
            </p>
          </button>
        </div>

        {/* Data Model Note Disclosure */}
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{LOGISTICS_INTEGRATION_NOTE}</span>
        </div>
      </div>

      {/* 3. Four Comparative KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Operational Delivery Fleet */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Active Fleet</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {simulationResult.simulatedFleet?.trucks} Trucks
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Baseline: {simulationResult.baselineFleet?.trucks} trucks</span>
            {simulationResult.simulatedFleet?.trucksRemoved > 0 ? (
              <span className="text-rose-600 font-bold">
                -{simulationResult.simulatedFleet?.trucksRemoved} trucks
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">Nominal</span>
            )}
          </div>
        </div>

        {/* Card 2: Deliverable Food Supply */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Deliverable Food</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {simulationResult.simulatedInventory?.food?.toLocaleString()} kits
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Baseline: {simulationResult.baselineInventory?.food?.toLocaleString()}</span>
            {comparison.inventoryDeltas?.food !== 0 ? (
              <span className="text-rose-600 font-bold">
                {comparison.inventoryDeltas?.food?.toLocaleString()} kits
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">Unchanged</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Food Allocated */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Food Allocated</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {simulationResult.simulatedResult?.totalAllocated?.food?.toLocaleString()} kits
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Baseline: {simulationResult.baselineResult?.totalAllocated?.food?.toLocaleString()}</span>
            {comparison.totalAllocatedDelta?.food < 0 ? (
              <span className="text-rose-600 font-bold">
                {comparison.totalAllocatedDelta?.food?.toLocaleString()} kits
              </span>
            ) : (
              <span className="text-slate-600 font-semibold">0 delta</span>
            )}
          </div>
        </div>

        {/* Card 4: Total Unmet Shortage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 uppercase tracking-wider">
            <span>Unmet Shortage</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {simulationResult.simulatedResult?.unmetDemand?.food?.toLocaleString()} kits
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Baseline: {simulationResult.baselineResult?.unmetDemand?.food?.toLocaleString()}</span>
            {comparison.unmetDemandDelta?.food > 0 ? (
              <span className="text-rose-700 font-bold">
                +{comparison.unmetDemandDelta?.food?.toLocaleString()} shortage
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">No increase</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Explainable Simulation Rationale */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Mathematical Explanation & Sector Impact</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          {comparison.explanation || 'Scenario calculation complete.'}
        </p>
      </div>

      {/* 5. Affected Zones Callout Card */}
      {affectedZones.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-rose-900">
                Sectors Experiencing Increased Shortage ({affectedZones.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-rose-700">
              Immediate Command Visibility
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {affectedZones.map(zone => (
              <div 
                key={`${zone.zoneId}-${zone.resource}`}
                className="bg-white p-3.5 rounded-lg border border-rose-200 text-xs space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{zone.zoneName}</span>
                  <StatusBadge status={zone.priorityBand} size="xs" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Baseline Alloc</span>
                    <span className="font-bold text-slate-800">{zone.baselineAllocated}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Simulated Alloc</span>
                    <span className="font-bold text-rose-700">{zone.simulatedAllocated}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Shortage Delta</span>
                    <span className="font-bold text-rose-600">+{zone.unmetDiff} kits</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  Demand: {zone.requested} • Shortage surged from {zone.baselineRemainingNeed} to {zone.simulatedRemainingNeed} kits.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Zone-by-Zone Allocation Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detailed Allocation Comparison</h2>
            <p className="text-xs text-slate-500">
              Side-by-side verification of baseline versus simulated resource distribution.
            </p>
          </div>

          {/* Resource Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('food')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'food' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Food Kits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('water')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'water' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Water
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rescueBoats')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'rescueBoats' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Boats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('medicalTeams')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'medicalTeams' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medical
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Priority Score</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3 text-right">Requested Demand</th>
                <th className="px-5 py-3 text-right">Baseline Allocation</th>
                <th className="px-5 py-3 text-right">Simulated Allocation</th>
                <th className="px-5 py-3 text-right">Allocation Delta</th>
                <th className="px-5 py-3 text-right">Simulated Shortage</th>
                <th className="px-5 py-3 text-center">Outcome Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRows.map((row) => {
                const isShortage = row.unmetDiff > 0 || row.allocatedDiff < 0;
                return (
                  <tr 
                    key={`${row.zoneId}-${row.resource}`}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isShortage ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-sans font-bold text-slate-900">
                      {row.zoneName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {row.priorityScore} ({row.priorityBand})
                    </td>
                    <td className="px-5 py-3 capitalize font-sans text-slate-700 font-medium">
                      {row.resource}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900">
                      {row.requested?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {row.baselineAllocated?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      {row.simulatedAllocated?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-bold">
                      {row.allocatedDiff < 0 ? (
                        <span className="text-rose-600">{row.allocatedDiff}</span>
                      ) : row.allocatedDiff > 0 ? (
                        <span className="text-emerald-600">+{row.allocatedDiff}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.simulatedRemainingNeed > 0 ? (
                        <span className="text-rose-700 font-bold">
                          {row.simulatedRemainingNeed?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0 (Met)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-sans">
                      {row.allocatedDiff < 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Shortage Increased
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Maintained
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
