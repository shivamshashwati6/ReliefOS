/**
 * RELIEF-OS Recommended Resource Allocation Summary Card
 * 
 * Compact summary for the Command Center dashboard (Section 22).
 * Shows zone counts per resource and a single "Review Allocation" button.
 * Does NOT show a large table on the main dashboard.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, ArrowRight, Package, Droplet, LifeBuoy, HeartPulse, ShieldAlert } from 'lucide-react';
import { useAllocation } from '../../context/AllocationContext';

export default function RecommendedAllocationSummary() {
  const navigate = useNavigate();
  const { allocations, simulationApproval } = useAllocation();

  // Compute number of zones receiving recommended distribution per resource type
  const zoneCounts = useMemo(() => {
    const counts = {
      food: 0,
      water: 0,
      rescueBoats: 0,
      medicalTeams: 0,
    };

    allocations.forEach(item => {
      if (item.allocated > 0 && counts[item.resource] !== undefined) {
        counts[item.resource] += 1;
      }
    });

    return counts;
  }, [allocations]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Boxes className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recommended Resource Allocation</h3>
            <p className="text-xs text-slate-500">
              Deterministic recommendation based on priority scores and current needs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Human approval required
          </span>
          <button
            type="button"
            onClick={() => navigate('/allocation')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <span>Review Allocation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compact 4-resource zone summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* Food */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Food</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {zoneCounts.food} {zoneCounts.food === 1 ? 'zone' : 'zones'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Recommended</p>
        </div>

        {/* Water */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <Droplet className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Water</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {zoneCounts.water} {zoneCounts.water === 1 ? 'zone' : 'zones'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Recommended</p>
        </div>

        {/* Rescue Boats */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Rescue Boats</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {zoneCounts.rescueBoats} {zoneCounts.rescueBoats === 1 ? 'zone' : 'zones'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Recommended</p>
        </div>

        {/* Medical Teams */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span className="font-medium">Medical Teams</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {zoneCounts.medicalTeams} {zoneCounts.medicalTeams === 1 ? 'zone' : 'zones'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Recommended</p>
        </div>
      </div>
    </div>
  );
}
