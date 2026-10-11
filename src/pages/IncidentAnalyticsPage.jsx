/**
 * RELIEF-OS Incident Analytics Page (/incident-analytics)
 * 
 * Command Center Decision Support Dashboard providing judge-friendly, transparent analytics.
 * 
 * STRICT COMPLIANCE:
 * - Purely consumes existing deterministic models and contexts.
 * - ZERO mutation of inventory, allocations, response plans, or monitoring.
 * - ZERO AI calls for analytics — 100% explainable and deterministic.
 * - Access restricted to COMMAND_CENTER only.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Activity, 
  Bell, 
  ArrowRight, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TrendingUp,
  Camera,
  Clock
} from 'lucide-react';
import { useDisaster } from '../context/DisasterContext';
import { useReports } from '../context/ReportContext';
import { useZones } from '../context/ZoneContext';
import { useAllocation } from '../context/AllocationContext';
import { useResponseMonitoring } from '../context/ResponseMonitoringContext';
import { useSafetyUpdate } from '../context/SafetyUpdateContext';
import { useIncidentTrend } from '../context/IncidentTrendContext';
import { calculateOverallIncidentAnalytics } from '../engines/analyticsEngine';

export default function IncidentAnalyticsPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { getReportsByDisaster } = useReports();
  const { zones } = useZones();
  const { allocations, totalRequested, totalAllocated, unmetDemand } = useAllocation();
  const { currentMonitoring } = useResponseMonitoring();
  const { disasterUpdates } = useSafetyUpdate();
  const { trendSeries, recordSnapshot } = useIncidentTrend();

  // Confirmation feedback for snapshot recording
  const [snapshotMessage, setSnapshotMessage] = useState('');

  // Collapsible explainability section
  const [showExplainability, setShowExplainability] = useState(false);

  // Active disaster reports
  const disasterReports = useMemo(() => {
    return getReportsByDisaster(currentDisaster?.id);
  }, [getReportsByDisaster, currentDisaster?.id]);

  // Compute deterministic analytics
  const analytics = useMemo(() => {
    return calculateOverallIncidentAnalytics({
      reports: disasterReports,
      zones,
      allocations,
      aggregateTotals: {
        totalRequested,
        totalAllocated,
        unmetDemand,
      },
      monitoringRecord: currentMonitoring,
      updates: disasterUpdates,
    });
  }, [disasterReports, zones, allocations, totalRequested, totalAllocated, unmetDemand, currentMonitoring, disasterUpdates]);

  const { reports, priority, resources, response, safety, situation, keyTakeaways } = analytics;

  // Situation indicator styles
  const getSituationBadge = (level) => {
    if (level === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          Critical
        </span>
      );
    }
    if (level === 'HIGH_ATTENTION') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          High Attention
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        Stable / Managed
      </span>
    );
  };

  const getPriorityBadge = (score, band) => {
    if (score >= 85 || band === 'Critical') {
      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Critical ({score})</span>;
    }
    if (score >= 70 || band === 'High') {
      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">High ({score})</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Medium ({score})</span>;
  };

  const handleRecordSnapshot = () => {
    const res = recordSnapshot({
      disasterId: currentDisaster?.id,
      reports: analytics.reports,
      priority: analytics.priority,
      resources: analytics.resources,
      response: analytics.response,
      safety: analytics.safety,
    });

    if (res.success) {
      setSnapshotMessage('Snapshot recorded');
      setTimeout(() => {
        setSnapshotMessage('');
      }, 4000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incident Analytics</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Simulation Mode
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Decision support overview for {currentDisaster?.name || 'Active Disaster'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Region:</strong> {currentDisaster?.region || 'Morigaon, Assam'}</span>
            </div>

            {/* Record Snapshot Button (Section 6) */}
            <div className="flex flex-col items-start sm:items-end">
              <button
                type="button"
                id="record-snapshot-btn"
                onClick={handleRecordSnapshot}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Record Snapshot</span>
              </button>
              <span className="text-[11px] text-slate-500 mt-1">
                Save the current situation for trend comparison.
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation banner if snapshot was recorded */}
        {snapshotMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{snapshotMessage}</span>
          </div>
        )}

        {/* Prototype Guidance Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">Operational Decision Support: </span>
            <span>
              All metrics are computed deterministically from verified emergency reports, priority models, and response plans. No automated actions or live dispatches occur without human authorization.
            </span>
          </div>
        </div>
      </div>

      {/* Compact Card: Incident Trends (Section 13) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Incident Trends</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {trendSeries.count} {trendSeries.count === 1 ? 'Snapshot' : 'Snapshots'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Latest snapshot time: {trendSeries.latest ? new Date(trendSeries.latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'None'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Indicator:</span>
                <span className="font-medium text-slate-800">
                  {trendSeries.count >= 2 
                    ? (trendSeries.trend?.metrics?.resourceCoverage?.direction === 'IMPROVING' 
                        ? 'Resource Coverage Improving' 
                        : trendSeries.trend?.metrics?.criticalZones?.direction === 'IMPROVING'
                        ? 'Critical Zones Decreasing'
                        : trendSeries.statements[0] || 'Broadly Stable')
                    : trendSeries.count === 1 
                    ? '1 snapshot recorded'
                    : 'No snapshots recorded yet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="view-trends-btn"
          onClick={() => navigate('/incident-trends')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shrink-0 cursor-pointer"
        >
          <span>View Trends</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. OVERALL INCIDENT SITUATION (Section 7) */}
      <div className={`rounded-xl border p-6 shadow-xs space-y-3 ${
        situation.level === 'CRITICAL' 
          ? 'bg-rose-50/70 border-rose-200' 
          : situation.level === 'HIGH_ATTENTION'
          ? 'bg-amber-50/70 border-amber-200'
          : 'bg-emerald-50/70 border-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 block mb-1">
              {situation.systemGeneratedLabel}
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Overall Incident Situation</h2>
              {getSituationBadge(situation.level)}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono self-start sm:self-center">
            Updated: {new Date(analytics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-800 leading-relaxed pt-1">
          {situation.explanation}
        </p>
      </div>

      {/* 3. KEY TAKEAWAYS (Section 9) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Key Takeaways</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {keyTakeaways.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EMERGENCY REPORTS (Section 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Emergency Reports</h2>
            <p className="text-xs text-slate-500">
              Citizen emergency transmissions received for this incident.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Reports */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Total Reports
            </span>
            <div className="text-2xl font-bold text-slate-900">
              {reports.totalReports}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {reports.processedReports} processed • {reports.pendingReports} pending
            </p>
          </div>

          {/* Critical */}
          <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs bg-rose-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block mb-1">
              Critical
            </span>
            <div className="text-2xl font-bold text-rose-700">
              {reports.criticalReports}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Immediate life risk</p>
          </div>

          {/* High */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block mb-1">
              High
            </span>
            <div className="text-2xl font-bold text-amber-700">
              {reports.highReports}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Significant distress</p>
          </div>

          {/* Medium */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs bg-blue-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 block mb-1">
              Medium
            </span>
            <div className="text-2xl font-bold text-blue-700">
              {reports.mediumReports}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Resource shortages</p>
          </div>

          {/* Low */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Low
            </span>
            <div className="text-2xl font-bold text-slate-800">
              {reports.lowReports}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">General inquiries</p>
          </div>
        </div>
      </div>

      {/* 5. PRIORITY AREAS (Section 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Areas</h2>
            <p className="text-xs text-slate-500">
              Top operational sectors ranked deterministically by Priority Engine scores.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/zones')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Zones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {priority.sortedZones.slice(0, 3).map(zone => (
            <div 
              key={zone.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{zone.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">{zone.id}</span>
                  </div>
                  {getPriorityBadge(zone.priorityScore, zone.priorityBand)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Affected Population</span>
                    <span className="font-bold text-slate-800">{zone.affectedPopulation.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Access Status</span>
                    <span className="font-medium text-slate-700">{zone.accessStatus}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-0.5">
                  "{zone.keyIssue}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(`/zones/${zone.id}`)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>View Zone</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. RESOURCE SITUATION (Section 4) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Resource Situation</h2>
            <p className="text-xs text-slate-500">
              Demand versus recommended allocation coverage across active sectors.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Overall Coverage:</span>
            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
              {resources.overallCoverage}%
            </span>
          </div>
        </div>

        {/* Resources Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Resource</th>
                <th scope="col" className="px-4 py-3 text-right">Requested</th>
                <th scope="col" className="px-4 py-3 text-right">Allocated</th>
                <th scope="col" className="px-4 py-3 text-right">Unmet Need</th>
                <th scope="col" className="px-4 py-3 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.resources.map(res => (
                <tr key={res.key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {res.name}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium">
                    {res.requested.toLocaleString()} {res.unit}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                    {res.allocated.toLocaleString()} {res.unit}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-amber-700">
                    {res.unmet > 0 ? `${res.unmet.toLocaleString()} ${res.unit}` : '0'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${res.coverage}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800">{res.coverage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/allocation')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Allocation Engine Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7. Grid: RESPONSE PROGRESS & PUBLIC SAFETY INFORMATION (Sections 5 & 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Response Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Response Progress</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Simulated Progress
              </span>
            </div>

            {!response.hasMonitoring ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">No approved response plan is currently being monitored.</p>
                <p className="text-[11px] text-slate-400">Response simulation begins when a response plan is formally approved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Overall Simulated Completion:</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">{response.overallProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${response.overallProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Zones Active</span>
                    <span className="font-bold text-blue-700">{response.zonesInProgress}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Zones Done</span>
                    <span className="font-bold text-emerald-700">{response.completedZones}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Remaining Work</span>
                    <span className="font-bold text-amber-700">{response.remainingWork}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/response-monitoring')}
              className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <span>View Response Monitoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Public Safety Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Public Safety Information</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Citizen Advisories
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block">Published</span>
                <span className="text-lg font-bold text-emerald-900">{safety.publishedUpdates}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
                <span className="text-[11px] text-rose-700 font-semibold block">Urgent</span>
                <span className="text-lg font-bold text-rose-900">{safety.urgentUpdates}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                <span className="text-[11px] text-amber-700 font-semibold block">Caution</span>
                <span className="text-lg font-bold text-amber-900">{safety.cautionUpdates}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                <span className="text-[11px] text-blue-700 font-semibold block">Info</span>
                <span className="text-lg font-bold text-blue-900">{safety.infoUpdates}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 pt-1 leading-relaxed">
              {safety.publishedUpdates > 0 
                ? `${safety.publishedUpdates} verified public advisory notices are currently active on the Citizen Dashboard.`
                : 'No active public safety notices are currently visible to citizens.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/safety-updates')}
              className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <span>View Safety Updates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 8. EXPLAINABILITY SECTION (Section 14) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setShowExplainability(prev => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">How this is calculated</h3>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            {showExplainability ? 'Collapse' : 'Expand'}
            {showExplainability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showExplainability && (
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-2.5 leading-relaxed">
            <p>
              The Incident Analytics engine aggregates verified data deterministically across RELIEF-OS operational subsystems:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-[11px]">
              <li><strong>Emergency Reports:</strong> Counted and categorized from verified reports tied strictly to the active disaster.</li>
              <li><strong>Priority Information:</strong> Derived from the deterministic Priority Engine without modifying existing scores.</li>
              <li><strong>Resource Numbers:</strong> Computed from the Demand Engine and recommended distributions produced by the Allocation Engine.</li>
              <li><strong>Response Progress:</strong> Sourced directly from approved Response Monitoring records.</li>
              <li><strong>Safety Updates:</strong> Reflected from published, active public advisories managed in SafetyUpdateContext.</li>
              <li><strong>Situation Indicator:</strong> Uses transparent, deterministic rules based on critical zones, overall coverage, and safety alerts.</li>
              <li><strong>Zero Autonomous AI Actions:</strong> No Gemini calls are executed for analytics; calculations are 100% explainable and repeatable.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
