/**
 * RELIEF-OS Department Allocation Card
 * 
 * Displays role-filtered, read-only allocation recommendations for
 * Health, Food & Supply, and Rescue department dashboards (Section 23).
 * 
 * STRICT COMPLIANCE:
 * - Read-only information only (no dispatch workflows).
 * - Labeled "Recommended" (NEVER "Assigned" or "Dispatched").
 */

import React from 'react';
import { Boxes, Info, HeartPulse, Package, Droplet, LifeBuoy, ClipboardList, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAllocation } from '../../context/AllocationContext';
import { useResponsePlan } from '../../context/ResponsePlanContext';
import { DEPARTMENTS } from '../../config/roles';
import { PLAN_STATUS } from '../../models/responsePlan';

export default function DepartmentAllocationCard({ department }) {
  const { getDepartmentAllocations } = useAllocation();
  const { currentPlan } = useResponsePlan();
  const departmentAllocations = getDepartmentAllocations(department) || [];

  // Group allocations by zone
  const zoneGroups = {};
  departmentAllocations.forEach(item => {
    if (!zoneGroups[item.zoneId]) {
      zoneGroups[item.zoneId] = {
        zoneId: item.zoneId,
        zoneName: item.zoneName || item.zoneId,
        priorityScore: item.priorityScore,
        priorityBand: item.priorityBand,
        items: [],
      };
    }
    zoneGroups[item.zoneId].items.push(item);
  });

  const zonesList = Object.values(zoneGroups).sort((a, b) => b.priorityScore - a.priorityScore);

  const getPriorityBadge = (score, band) => {
    if (score >= 85 || band === 'CRITICAL' || band === 'Critical') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">Critical ({score})</span>;
    }
    if (score >= 70 || band === 'HIGH' || band === 'High') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">High ({score})</span>;
    }
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Medium ({score})</span>;
  };

  const getResourceIcon = (res) => {
    switch (res) {
      case 'food':
        return <Package className="w-3.5 h-3.5 text-amber-600" />;
      case 'water':
        return <Droplet className="w-3.5 h-3.5 text-blue-600" />;
      case 'rescueBoats':
        return <LifeBuoy className="w-3.5 h-3.5 text-emerald-600" />;
      case 'medicalTeams':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Boxes className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <ClipboardList className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Response Plan — {department === DEPARTMENTS.HEALTH && 'Medical Team Recommendations'}
              {department === DEPARTMENTS.FOOD_SUPPLY && 'Food & Water Recommendations'}
              {department === DEPARTMENTS.RESCUE && 'Rescue Boat Recommendations'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentPlan ? `Plan ID: ${currentPlan.planId} • Read-only department planning overview.` : 'Read-only department planning overview.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {currentPlan && (
            <div className="text-xs">
              {currentPlan.status === PLAN_STATUS.APPROVED && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status: Approved
                </span>
              )}
              {currentPlan.status === PLAN_STATUS.UNDER_REVIEW && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Status: Under Review
                </span>
              )}
              {currentPlan.status === PLAN_STATUS.REJECTED && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-rose-100 text-rose-800 text-[11px]">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Status: Rejected
                </span>
              )}
              {currentPlan.status === PLAN_STATUS.DRAFT && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 text-[11px]">
                  Status: Draft
                </span>
              )}
            </div>
          )}

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Recommended
          </div>
        </div>
      </div>

      {zonesList.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
          No allocation recommendations available for this department.
        </div>
      ) : (
        <div className="space-y-3">
          {zonesList.map(zone => (
            <div key={zone.zoneId} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{zone.zoneName}</span>
                  <span className="text-[11px] text-slate-500 font-mono ml-2 uppercase">({zone.zoneId})</span>
                </div>
                {getPriorityBadge(zone.priorityScore, zone.priorityBand)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {zone.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-white border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {getResourceIcon(item.resource)}
                        <span>{item.resourceName}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Requested</span>
                        <span className="font-medium text-slate-700">
                          {item.requested !== null ? `${item.requested.toLocaleString()} ${item.unit}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Recommended</span>
                        <span className="font-bold text-emerald-700">
                          {item.allocated > 0 ? `${item.allocated.toLocaleString()} ${item.unit}` : '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Still Needed</span>
                        <span className={`font-semibold ${item.remainingNeed > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                          {item.remainingNeed !== null ? `${item.remainingNeed.toLocaleString()} ${item.unit}` : 'Assessment Req.'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-2.5 rounded bg-slate-50 text-[11px] text-slate-500 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Department staff view allocations as recommendations only. Authorization and dispatch remain managed via central Command protocols.
        </span>
      </div>
    </div>
  );
}
