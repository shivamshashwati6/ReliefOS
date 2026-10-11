/**
 * RELIEF-OS Incident Trends Page (/incident-trends)
 * 
 * Command Center Decision Support Dashboard providing historical trajectory
 * and trend analysis across simulated point-in-time snapshots.
 * 
 * STRICT COMPLIANCE:
 * - Purely consumes deterministic analytical snapshots from IncidentTrendContext.
 * - Zero mutation of inventory, allocations, response plans, monitoring, or safety updates.
 * - Zero AI calls — 100% deterministic, explainable calculations.
 * - Access restricted strictly to COMMAND_CENTER.
 * - Clear "Simulation Mode" badges and labels throughout.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  BarChart3,
  MapPin
} from 'lucide-react';
import { useDisaster } from '../context/DisasterContext';
import { useIncidentTrend } from '../context/IncidentTrendContext';
import { TREND_DIRECTIONS, sortSnapshots } from '../engines/trendEngine';
import { TREND_STABLE_THRESHOLD } from '../config/trendParameters';

export default function IncidentTrendsPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { snapshots, trendSeries } = useIncidentTrend();

  const [showExplainability, setShowExplainability] = useState(false);

  const snapshotCount = snapshots.length;
  const { latest, previous, trend, chartData, statements } = trendSeries;

  // Newest first for table display
  const tableSnapshots = useMemo(() => {
    return sortSnapshots(snapshots, 'desc');
  }, [snapshots]);

  // Helper to format trend direction pill with correct semantic color & arrow
  const renderTrendBadge = (metric) => {
    if (!trend?.hasComparison || !metric || metric.previous === null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Minus className="w-3 h-3 text-slate-400" />
          <span>Baseline</span>
        </span>
      );
    }

    const { direction, isHigherBetter } = metric;

    if (direction === TREND_DIRECTIONS.STABLE) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span>→</span>
          <span>Stable</span>
        </span>
      );
    }

    if (direction === TREND_DIRECTIONS.IMPROVING) {
      const ArrowIcon = isHigherBetter ? ArrowUp : ArrowDown;
      const arrowSymbol = isHigherBetter ? '↑' : '↓';
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ArrowIcon className="w-3 h-3 text-emerald-600" />
          <span>{arrowSymbol} Improving</span>
        </span>
      );
    }

    // WORSENING
    const ArrowIcon = isHigherBetter ? ArrowDown : ArrowUp;
    const arrowSymbol = isHigherBetter ? '↓' : '↑';
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <ArrowIcon className="w-3 h-3 text-rose-600" />
        <span>{arrowSymbol} Worsening</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incident Trends</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Simulation Mode
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Track how the disaster situation changes over time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Disaster:</strong> {currentDisaster?.name || 'Active Incident'}</span>
            </div>

            <button
              onClick={() => navigate('/incident-analytics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 border border-blue-200 transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Incident Analytics</span>
            </button>
          </div>
        </div>

        {/* Small label for simulation compliance */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>Historical snapshots are simulation data.</span>
        </div>
      </div>

      {/* 2. ZERO SNAPSHOTS EMPTY STATE (Section 15) */}
      {snapshotCount === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">No historical snapshots yet.</h3>
            <p className="text-sm text-slate-500">
              Record a snapshot from Incident Analytics to begin tracking change over time.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate('/incident-analytics')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
            >
              <span>Go to Incident Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. EXACTLY ONE SNAPSHOT INFORMATIONAL STATE (Section 15) */}
      {snapshotCount === 1 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">One snapshot recorded. </span>
              <span>Record another snapshot to compare changes.</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/incident-analytics')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shrink-0"
          >
            <span>Record Another Snapshot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content rendered when at least 1 snapshot exists */}
      {snapshotCount > 0 && (
        <>
          {/* 4. CURRENT SITUATION & TREND SUMMARY (Section 9) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Current Situation</h2>
                <p className="text-xs text-slate-500">Point-in-time metrics with previous snapshot comparison</p>
              </div>
              {latest && (
                <span className="text-xs text-slate-500 font-mono">
                  Recorded: {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Metric 1: Emergency Reports */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Emergency Reports</span>
                  {renderTrendBadge(trend?.metrics?.reports)}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {latest?.reports?.total?.toLocaleString() ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Previous:</span>
                  <span className="font-medium text-slate-700">
                    {previous ? previous.reports?.total?.toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Priority Risk */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Critical Zones</span>
                  {renderTrendBadge(trend?.metrics?.criticalZones)}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {latest?.priority?.criticalZones ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Previous:</span>
                  <span className="font-medium text-slate-700">
                    {previous ? previous.priority?.criticalZones : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Metric 3: Resource Coverage */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Resource Coverage</span>
                  {renderTrendBadge(trend?.metrics?.resourceCoverage)}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {latest?.resources?.overallCoverage ?? 0}%
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Previous:</span>
                  <span className="font-medium text-slate-700">
                    {previous ? `${previous.resources?.overallCoverage}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Metric 4: Response Progress */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Response Progress</span>
                  {renderTrendBadge(trend?.metrics?.responseProgress)}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {latest?.response?.overallProgress ?? 0}%
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Previous:</span>
                  <span className="font-medium text-slate-700">
                    {previous ? `${previous.response?.overallProgress}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Metric 5: Public Safety Alerts */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Urgent Alerts</span>
                  {renderTrendBadge(trend?.metrics?.urgentUpdates)}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {latest?.safety?.urgentUpdates ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Previous:</span>
                  <span className="font-medium text-slate-700">
                    {previous ? previous.safety?.urgentUpdates : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. TREND INTERPRETATION: WHAT'S CHANGING? (Section 12) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">What's changing?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {statements.map((statement, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{statement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. TREND CHARTS (Section 10) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Trend Trajectories</h2>
              <p className="text-xs text-slate-500">Visual progression across simulation timestamps</p>
            </div>

            {snapshotCount < 2 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Record another snapshot to see a trend.</p>
                <p className="text-xs text-slate-500">Charts require at least two chronological data points to plot trajectories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart 1: Emergency Reports Over Time */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Emergency Reports Over Time
                    </h3>
                    <span className="text-[11px] text-slate-500">Total reports</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalReports"
                          name="Total Reports"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#2563eb' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Resource Coverage */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Resource Coverage
                    </h3>
                    <span className="text-[11px] text-slate-500">Coverage %</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="overallCoverage"
                          name="Coverage %"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#10b981' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Response Progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Response Progress
                    </h3>
                    <span className="text-[11px] text-slate-500">Progress %</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="overallProgress"
                          name="Progress %"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#6366f1' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Priority Risk */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Priority Risk
                    </h3>
                    <span className="text-[11px] text-slate-500">Critical & High Priority Zones</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Line
                          type="monotone"
                          dataKey="criticalZones"
                          name="Critical Zones"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#ef4444' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="highPriorityZones"
                          name="High Priority Zones"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#f59e0b' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. SNAPSHOT HISTORY TABLE (Section 11) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Snapshot History</h3>
                <p className="text-xs text-slate-500">Simulation snapshots listed in reverse chronological order</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 self-start sm:self-center">
                {tableSnapshots.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Reports</th>
                    <th className="py-3 px-4 text-right">Critical Zones</th>
                    <th className="py-3 px-4 text-right">Resource Coverage</th>
                    <th className="py-3 px-4 text-right">Response Progress</th>
                    <th className="py-3 px-4 text-right">Urgent Updates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableSnapshots.map((item) => (
                    <tr key={item.snapshotId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Simulation Snapshot
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {item.reports?.total?.toLocaleString() ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${item.priority?.criticalZones > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {item.priority?.criticalZones ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {item.resources?.overallCoverage ?? 0}%
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {item.response?.overallProgress ?? 0}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${item.safety?.urgentUpdates > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {item.safety?.urgentUpdates ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 8. EXPLAINABILITY SECTION (Section 20) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => setShowExplainability((prev) => !prev)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">How trends are calculated</span>
          </div>
          {showExplainability ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showExplainability && (
          <div className="px-5 pb-5 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              • <strong>Point-in-Time Observations:</strong> A snapshot records the current analytical state across reports, priority, resources, response, and public safety.
            </p>
            <p>
              • <strong>Manual Triggering:</strong> Snapshots are manually created by Command Center personnel on the Incident Analytics dashboard. No automatic or timer-based snapshots are recorded.
            </p>
            <p>
              • <strong>Improvement Optimization:</strong>
              <br />
              - <em>Lower is better:</em> Critical emergency reports, critical zones, high-priority zones, unmet demand, and urgent public safety alerts. A decrease represents improvement.
              <br />
              - <em>Higher is better:</em> Resource allocation coverage and response plan progress. An increase represents improvement.
            </p>
            <p>
              • <strong>Stability Boundary:</strong> Absolute changes within the configured stability threshold (default {TREND_STABLE_THRESHOLD} points) are classified as Stable to prevent noisy fluctuations.
            </p>
            <p>
              • <strong>Deterministic Analysis:</strong> All trend trajectories, direction classifications, and factual interpretation statements are strictly deterministic. No external AI or Gemini models are called.
            </p>
            <p>
              • <strong>Simulation Notice:</strong> Historical snapshots are prototype simulation data designed for operational training and decision-support modeling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
