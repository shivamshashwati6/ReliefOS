/**
 * RELIEF-OS — Resource Allocation Page (/allocation)
 * 
 * Provides deterministic, explainable resource distribution recommendations
 * for Command Center decision support.
 * 
 * STRICT HUMAN-IN-THE-LOOP PRINCIPLES:
 * - Recommendations only — NO automatic dispatching.
 * - Zero inventory mutation.
 * - Transparent calculation steps and deterministic explanations.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ShieldAlert, 
  Package, 
  Droplet, 
  LifeBuoy, 
  HeartPulse, 
  ArrowRight, 
  RefreshCw,
  Layers,
  FileCheck2,
  Clock,
  ClipboardList,
  Plus
} from 'lucide-react';
import { useAllocation } from '../context/AllocationContext';
import { useResponsePlan } from '../context/ResponsePlanContext';
import { useDisaster } from '../context/DisasterContext';
import { RESOURCE_METADATA } from '../config/allocationParameters';

export default function AllocationPage() {
  const { currentDisaster } = useDisaster();
  const { 
    allocations, 
    remainingInventory, 
    unmetDemand, 
    totalRequested, 
    totalAllocated, 
    simulatedInventory,
    calculationSteps,
    simulationApproval,
    approveSimulation,
    resetSimulationApproval,
  } = useAllocation();
  const { createPlanFromCurrentAllocation } = useResponsePlan();
  const navigate = useNavigate();

  // Active filter tab: 'all' | 'food' | 'water' | 'rescueBoats' | 'medicalTeams'
  const [activeTab, setActiveTab] = useState('all');
  
  // Collapsed calculation state per resource key
  const [expandedCalculation, setExpandedCalculation] = useState({
    food: false,
    water: false,
    rescueBoats: false,
    medicalTeams: false,
  });

  // Modal for "Review Recommendation"
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const toggleCalculation = (resKey) => {
    setExpandedCalculation(prev => ({
      ...prev,
      [resKey]: !prev[resKey],
    }));
  };

  // Filtered allocations based on selected tab
  const filteredAllocations = useMemo(() => {
    if (activeTab === 'all') return allocations;
    return allocations.filter(a => a.resource === activeTab);
  }, [allocations, activeTab]);

  // Aggregate totals across all 4 supported resource types
  const aggregateMetrics = useMemo(() => {
    const keys = ['food', 'water', 'rescueBoats', 'medicalTeams'];
    let totalAvail = 0;
    let totalReq = 0;
    let totalRec = 0;
    let totalUnmet = 0;

    keys.forEach(k => {
      totalAvail += simulatedInventory[k] || 0;
      totalReq += totalRequested[k] || 0;
      totalRec += totalAllocated[k] || 0;
      totalUnmet += unmetDemand[k] || 0;
    });

    return { totalAvail, totalReq, totalRec, totalUnmet };
  }, [simulatedInventory, totalRequested, totalAllocated, unmetDemand]);

  // Priority band badge helper
  const getPriorityBadge = (score, band) => {
    if (score >= 85 || band === 'CRITICAL' || band === 'Critical') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Critical ({score})</span>;
    }
    if (score >= 70 || band === 'HIGH' || band === 'High') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">High ({score})</span>;
    }
    if (score >= 50 || band === 'MEDIUM' || band === 'Medium') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Medium ({score})</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Low ({score})</span>;
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fully Met':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Fully Met</span>;
      case 'Partially Met':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Partially Met</span>;
      case 'Assessment Required':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">Assessment Required</span>;
      case 'Zero Demand':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Zero Demand</span>;
      case 'Unmet':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">Unmet</span>;
    }
  };

  // Icon selector
  const getResourceIcon = (resourceKey) => {
    switch (resourceKey) {
      case 'food':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'water':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'rescueBoats':
        return <LifeBuoy className="w-4 h-4 text-emerald-600" />;
      case 'medicalTeams':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Mandatory Safety Label */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Boxes className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Allocation</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Recommended distribution based on current needs and zone priority.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Required Safety Label (Section 16 & 28) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Recommendation — Human approval required</span>
            </div>

            {/* Human Review / Demo Approval Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-slate-600" />
                <span>Review Recommendation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newPlan = createPlanFromCurrentAllocation({
                    notes: 'Draft response plan created from recommended resource allocation.',
                  });
                  navigate(`/response-plans/${newPlan.planId}`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Create Response Plan</span>
              </button>

              {simulationApproval.status === 'PENDING_REVIEW' ? (
                <button
                  type="button"
                  onClick={() => approveSimulation('Command Officer')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Allocation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetSimulationApproval}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  title="Reset demo approval state"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reset Demo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Simulation Approval State Indicator (Section 21) */}
        {simulationApproval.status === 'SIMULATION_APPROVED' && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 flex-1">
              <span className="font-bold">Allocation approved for simulation:</span> Human commander simulation sign-off recorded.
              <span className="ml-2 inline-block font-semibold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded text-[11px]">
                Simulation only
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Physical resources remain at depot until authorized field dispatch protocols are activated. No real-world inventory was deducted.
              </p>
            </div>
          </div>
        )}

        {/* Decision Support Disclaimer (Section 28) */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-medium text-slate-800">Operational Notice: </span>
            Recommendations are based on simulated inventory and current zone information. Final decisions should be reviewed by the responsible team.
          </p>
        </div>
      </div>

      {/* 2. Four Summary Cards Maximum (Section 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Resources Available */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources available</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {aggregateMetrics.totalAvail.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulated regional depot inventory
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Food: {simulatedInventory.food.toLocaleString()}</span>
            <span>Water: {simulatedInventory.water.toLocaleString()}</span>
            <span>Boats: {simulatedInventory.rescueBoats}</span>
            <span>Teams: {simulatedInventory.medicalTeams}</span>
          </div>
        </div>

        {/* Card 2: Resources Requested */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources requested</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {aggregateMetrics.totalReq.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Identified demand from {currentDisaster?.name || 'Assam Flood'} zones
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Food: {totalRequested.food.toLocaleString()}</span>
            <span>Water: {totalRequested.water.toLocaleString()}</span>
            <span>Boats: {totalRequested.rescueBoats}</span>
            <span>Teams: {totalRequested.medicalTeams}</span>
          </div>
        </div>

        {/* Card 3: Resources Recommended */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Resources recommended</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {aggregateMetrics.totalRec.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic distribution proposal
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Food: {totalAllocated.food.toLocaleString()}</span>
            <span>Water: {totalAllocated.water.toLocaleString()}</span>
            <span>Boats: {totalAllocated.rescueBoats}</span>
            <span>Teams: {totalAllocated.medicalTeams}</span>
          </div>
        </div>

        {/* Card 4: Unmet Demand */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Unmet demand</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {aggregateMetrics.totalUnmet.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Shortage across affected zones
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Food: {unmetDemand.food.toLocaleString()}</span>
            <span>Water: {unmetDemand.water.toLocaleString()}</span>
            <span>Boats: {unmetDemand.rescueBoats}</span>
            <span>Teams: {unmetDemand.medicalTeams}</span>
          </div>
        </div>
      </div>

      {/* 3. Resource Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Resources ({allocations.length})
        </button>

        {Object.keys(RESOURCE_METADATA).map(key => {
          const meta = RESOURCE_METADATA[key];
          const count = allocations.filter(a => a.resource === key).length;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {getResourceIcon(key)}
              <span>{meta.name}</span>
              <span className={`text-xs ml-0.5 px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Main Resource Allocation Table & Mobile Cards (Section 18) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recommended Allocation Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic priority distribution with 20% minimum coverage safeguard.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Disaster: <span className="font-semibold text-slate-700">{currentDisaster?.name || 'Assam Flood (DISASTER-001)'}</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Resource</th>
                <th scope="col" className="px-5 py-3.5">Zone</th>
                <th scope="col" className="px-5 py-3.5">Priority</th>
                <th scope="col" className="px-5 py-3.5 text-right">Requested</th>
                <th scope="col" className="px-5 py-3.5 text-right">Recommended</th>
                <th scope="col" className="px-5 py-3.5 text-right">Still Needed</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Why Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAllocations.map((item, idx) => (
                <tr key={`${item.resource}-${item.zoneId}-${idx}`} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(item.resource)}
                      <span>{item.resourceName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{item.zoneName || item.zoneId}</span>
                    <span className="text-xs text-slate-500 block uppercase font-mono">{item.zoneId}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getPriorityBadge(item.priorityScore, item.priorityBand)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-medium">
                    {item.requested !== null ? `${item.requested.toLocaleString()} ${item.unit}` : '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-emerald-700">
                    {item.allocated > 0 ? `${item.allocated.toLocaleString()} ${item.unit}` : '0'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    {item.remainingNeed !== null ? (
                      item.remainingNeed > 0 ? (
                        <span className="font-semibold text-amber-700">{item.remainingNeed.toLocaleString()} {item.unit}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )
                    ) : (
                      <span className="text-slate-500 italic text-xs">Pending assessment</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                    {item.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (Section 18) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredAllocations.map((item, idx) => (
            <div key={`m-${item.resource}-${item.zoneId}-${idx}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getResourceIcon(item.resource)}
                  <span className="font-bold text-slate-900 text-sm">{item.resourceName}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{item.zoneName || item.zoneId}</span>
                  <span className="text-slate-500 block text-[11px] font-mono">{item.zoneId}</span>
                </div>
                <div>{getPriorityBadge(item.priorityScore, item.priorityBand)}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Requested</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {item.requested !== null ? `${item.requested.toLocaleString()}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Recommended</div>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {item.allocated > 0 ? `${item.allocated.toLocaleString()}` : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Still Needed</div>
                  <div className={`font-semibold mt-0.5 ${item.remainingNeed > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {item.remainingNeed !== null ? `${item.remainingNeed.toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50/70 p-2 rounded border border-slate-100">
                <span className="font-semibold text-slate-700">Why recommended: </span>
                {item.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Collapsible "Show Calculation" Sections (Section 20) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Mathematical Calculation Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, explainable step-by-step audit for each resource calculation.
          </p>
        </div>

        <div className="space-y-3">
          {Object.keys(RESOURCE_METADATA).map(resKey => {
            const stepData = calculationSteps[resKey];
            if (!stepData) return null;
            const isExpanded = expandedCalculation[resKey];
            const meta = RESOURCE_METADATA[resKey];

            return (
              <div key={resKey} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCalculation(resKey)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {getResourceIcon(resKey)}
                    <span className="font-semibold text-sm text-slate-900">{meta.name} Calculation</span>
                    <span className="text-xs text-slate-500">
                      ({stepData.initialAvailable.toLocaleString()} {meta.unit} available • {stepData.totalAllocated.toLocaleString()} recommended)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <span>{isExpanded ? 'Hide calculation' : 'Show calculation'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-4 text-xs text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium">Total Available Stock:</span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {stepData.initialAvailable.toLocaleString()} {meta.unit}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Total Zone Demand:</span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {stepData.totalRequested.toLocaleString()} {meta.unit}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Fairness Minimum Coverage:</span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {(stepData.minimumCoverageRatio * 100).toFixed(0)}% safeguard
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Priority Order */}
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center">1</span>
                        Deterministic Priority Order & Tie-Breaking
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Zones sorted by computed Priority Score descending. Equal scores tie-break by zone ID ascending.
                      </p>
                      <div className="space-y-1">
                        {stepData.priorityOrder.map((z, idx) => (
                          <div key={z.zoneId} className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-600">#{idx + 1}</span>
                              <span className="font-semibold text-slate-800">{z.zoneName || z.zoneId}</span>
                              <span className="text-slate-500 font-mono">({z.zoneId})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">Priority: <strong className="text-slate-900">{z.priorityScore}</strong></span>
                              <span className="text-slate-600">Demand: <strong className="text-slate-900">{z.requested !== null ? `${z.requested.toLocaleString()} ${meta.unit}` : 'Assessment Required'}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Pass 1 Minimum Coverage */}
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center">2</span>
                        Pass 1: Minimum Coverage Safeguard (Up to 20%)
                      </h4>
                      <div className="space-y-1">
                        {stepData.pass1Steps.length > 0 ? (
                          stepData.pass1Steps.map(s => (
                            <div key={`p1-${s.zoneId}`} className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]">
                              <span><strong>{s.zoneId}</strong> (20% target: {s.targetMin.toLocaleString()})</span>
                              <span className="font-mono text-emerald-700 font-semibold">+{s.allocated.toLocaleString()} {meta.unit} allocated (Depot reserve: {s.stockRemaining.toLocaleString()})</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 rounded bg-slate-50 text-slate-500 italic text-[11px]">
                            No eligible zones for Pass 1 minimum coverage or inventory depleted.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Pass 2 Priority Greedy Distribution */}
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center">3</span>
                        Pass 2: Priority-Greedy Distribution of Remaining Stock
                      </h4>
                      <div className="space-y-1">
                        {stepData.pass2Steps.length > 0 ? (
                          stepData.pass2Steps.map(s => (
                            <div key={`p2-${s.zoneId}`} className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]">
                              <span><strong>{s.zoneId}</strong> (Remaining need: {s.remainingNeedBefore.toLocaleString()})</span>
                              <span className="font-mono text-emerald-700 font-semibold">+{s.allocated.toLocaleString()} {meta.unit} allocated (Depot reserve: {s.stockRemaining.toLocaleString()})</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 rounded bg-slate-50 text-slate-500 italic text-[11px]">
                            No inventory remaining after Pass 1 or all needs satisfied.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Final Step Summary */}
                    <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-950 font-medium">
                      <span>Total Recommended: <strong>{stepData.totalAllocated.toLocaleString()} {meta.unit}</strong></span>
                      <span>Depot Reserve: <strong>{stepData.remainingInventory.toLocaleString()} {meta.unit}</strong></span>
                      <span>Unmet Demand: <strong>{stepData.unmetDemand.toLocaleString()} {meta.unit}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Review Recommendation Modal Dialog */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Human Recommendation Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                You are reviewing the deterministic resource allocation plan for <strong>{currentDisaster?.name || 'Assam Flood (DISASTER-001)'}</strong>.
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div>• Food Kits: {totalAllocated.food.toLocaleString()} recommended / {totalRequested.food.toLocaleString()} requested ({unmetDemand.food.toLocaleString()} unmet)</div>
                <div>• Water Units: {totalAllocated.water.toLocaleString()} recommended / {totalRequested.water.toLocaleString()} requested ({unmetDemand.water.toLocaleString()} unmet)</div>
                <div>• Rescue Boats: {totalAllocated.rescueBoats} recommended ({unmetDemand.rescueBoats} unmet)</div>
                <div>• Medical Teams: {totalAllocated.medicalTeams} recommended ({unmetDemand.medicalTeams} unmet)</div>
              </div>

              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Protocol Reminder:</strong> Confirming this review does not trigger autonomous vehicle dispatch or live inventory decrement. Deployment remains under Command Center dispatch protocols.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  approveSimulation('Command Center Reviewer');
                  setReviewModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve for Simulation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
