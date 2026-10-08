/**
 * RELIEF-OS Response Monitoring Summary Card
 * 
 * Compact card for the Command Center dashboard (Section 19).
 * Displays active response simulation progress and direct link to monitoring.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Play, CheckCircle2, Clock, Pause } from 'lucide-react';
import { useResponseMonitoring } from '../../context/ResponseMonitoringContext';
import { MONITORING_STATUS } from '../../models/responseMonitoring';

export default function ResponseMonitoringSummaryCard() {
  const navigate = useNavigate();
  const { currentMonitoring } = useResponseMonitoring();

  const getStatusBadge = (status) => {
    switch (status) {
      case MONITORING_STATUS.COMPLETED:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Completed</span>;
      case MONITORING_STATUS.PAUSED:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">Paused</span>;
      case MONITORING_STATUS.IN_PROGRESS:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Not Started</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Response Monitoring</h3>
            <p className="text-xs text-slate-500">
              Simulated response progress tracking (Prototype simulation only)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/response-monitoring')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>View Monitoring</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        {!currentMonitoring ? (
          <p className="text-xs text-slate-500 italic">
            No active response simulation.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentMonitoring.planId}
                </span>
                <span className="text-slate-500">
                  • {currentMonitoring.zoneProgress.length} zones
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(currentMonitoring.status)}
                <span className="font-bold text-slate-900 font-mono">
                  {currentMonitoring.overallProgress}% Overall
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  currentMonitoring.overallProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${currentMonitoring.overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
