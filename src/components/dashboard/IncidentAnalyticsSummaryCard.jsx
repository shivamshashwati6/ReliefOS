/**
 * RELIEF-OS Incident Analytics Summary Card
 * 
 * Compact overview card displayed on the Command Center Dashboard (/command-center).
 * 
 * Shows:
 * - Current situation indicator (Critical / High Attention / Stable)
 * - Overall resource coverage (%)
 * - Top priority zone
 * - Response progress (%)
 * - "View Analytics" button navigating to /incident-analytics
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { useReports } from '../../context/ReportContext';
import { useZones } from '../../context/ZoneContext';
import { useAllocation } from '../../context/AllocationContext';
import { useResponseMonitoring } from '../../context/ResponseMonitoringContext';
import { useSafetyUpdate } from '../../context/SafetyUpdateContext';
import { calculateOverallIncidentAnalytics } from '../../engines/analyticsEngine';

export default function IncidentAnalyticsSummaryCard() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { getReportsByDisaster } = useReports();
  const { zones } = useZones();
  const { allocations, totalRequested, totalAllocated, unmetDemand } = useAllocation();
  const { currentMonitoring } = useResponseMonitoring();
  const { disasterUpdates } = useSafetyUpdate();

  const disasterReports = useMemo(() => {
    return getReportsByDisaster(currentDisaster?.id);
  }, [getReportsByDisaster, currentDisaster?.id]);

  const analytics = useMemo(() => {
    return calculateOverallIncidentAnalytics({
      reports: disasterReports,
      zones,
      allocations,
      aggregateTotals: { totalRequested, totalAllocated, unmetDemand },
      monitoringRecord: currentMonitoring,
      updates: disasterUpdates,
    });
  }, [disasterReports, zones, allocations, totalRequested, totalAllocated, unmetDemand, currentMonitoring, disasterUpdates]);

  const { situation, priority, resources, response } = analytics;

  const getSituationBadge = (level) => {
    if (level === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Critical
        </span>
      );
    }
    if (level === 'HIGH_ATTENTION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          High Attention
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Stable
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <BarChart3 className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Incident Analytics</h2>
        </div>
        {getSituationBadge(situation.level)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Coverage */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Resource Coverage</span>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {resources.overallCoverage}%
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${resources.overallCoverage}%` }}
            />
          </div>
        </div>

        {/* Top Priority Zone */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Top Priority Area</span>
          <div className="text-sm font-bold text-slate-900 truncate" title={priority.highestPriorityZone?.name}>
            {priority.highestPriorityZone?.name || 'None'}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">
            {priority.highestPriorityZone ? `Score: ${priority.highestPriorityScore} (${priority.highestPriorityZone.priorityBand})` : 'Pending'}
          </div>
        </div>

        {/* Response Progress */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Response Progress</span>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {response.hasMonitoring ? `${response.overallProgress}%` : 'Not Active'}
          </div>
          <div className="text-[11px] text-slate-500">
            {response.hasMonitoring ? `${response.completedZones} zone(s) done` : 'No active simulation'}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/incident-analytics')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <span>View Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
