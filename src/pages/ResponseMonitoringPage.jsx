/**
 * RELIEF-OS Response Monitoring & Simulation Page (/response-monitoring)
 * 
 * Provides interactive progress tracking and simulation for APPROVED response plans.
 * 
 * STRICT COMPLIANCE:
 * - Pure simulation environment — no real resources tracked or dispatched.
 * - Human-directed progress additions only (no autonomous fake increments).
 * - Command Center has full controls (Start, Add Progress, Pause, Resume, Complete).
 * - Department users have role-scoped read-only views (Health, Supply, Rescue).
 * - Citizens are completely blocked.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Play, 
  Pause, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Boxes, 
  Package, 
  Droplet, 
  LifeBuoy, 
  HeartPulse, 
  Info, 
  History,
  Check
} from 'lucide-react';
import { useResponseMonitoring } from '../context/ResponseMonitoringContext';
import { useResponsePlan } from '../context/ResponsePlanContext';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { 
  MONITORING_STATUS, 
  ZONE_STATUS 
} from '../models/responseMonitoring';
import { PLAN_STATUS } from '../models/responsePlan';

export default function ResponseMonitoringPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { disasterPlans } = useResponsePlan();
  const { 
    disasterMonitoringRecords, 
    currentMonitoring, 
    initializeMonitoringForPlan,
    startSimulation, 
    addProgress, 
    pauseSimulation, 
    resumeSimulation, 
    completeSimulation,
    getDepartmentProgress
  } = useResponseMonitoring();
  const { role, currentUser } = useAuth();

  const isCommandCenter = role === ROLES.COMMAND_CENTER;
  const isDepartment = role === ROLES.DEPARTMENT;

  // Filter approved plans for plan selector
  const approvedPlans = useMemo(() => {
    return disasterPlans.filter(p => p.status === PLAN_STATUS.APPROVED);
  }, [disasterPlans]);

  // Modal states
  const [showStartModal, setShowStartModal] = useState(false);
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  // Add progress form state
  const [selectedZoneForProgress, setSelectedZoneForProgress] = useState('');
  const [selectedResourceForProgress, setSelectedResourceForProgress] = useState('');
  const [progressAmountToAdd, setProgressAmountToAdd] = useState('');
  const [progressFormError, setProgressFormError] = useState('');

  // Active plan resolution
  const activePlanId = currentMonitoring?.planId;

  // Resolve relevant zone progress based on user role
  const displayZoneProgress = useMemo(() => {
    if (!currentMonitoring) return [];
    if (isDepartment && currentUser?.department) {
      return getDepartmentProgress(currentUser.department, currentMonitoring);
    }
    return currentMonitoring.zoneProgress || [];
  }, [currentMonitoring, isDepartment, currentUser?.department, getDepartmentProgress]);

  // KPI Metrics calculation (Section 7: max 4 cards)
  const kpiMetrics = useMemo(() => {
    const activePlansCount = disasterMonitoringRecords.filter(m => m.status === MONITORING_STATUS.IN_PROGRESS).length;
    
    if (!currentMonitoring) {
      return {
        activePlansCount: 0,
        zonesInProgressCount: 0,
        overallProgress: 0,
        completedActionsRatio: '0 / 0',
      };
    }

    const zonesInProgressCount = currentMonitoring.zoneProgress.filter(z => z.status === ZONE_STATUS.IN_PROGRESS).length;
    const overallProgress = currentMonitoring.overallProgress || 0;

    let totalActions = 0;
    let completedActions = 0;

    currentMonitoring.zoneProgress.forEach(z => {
      (z.resources || []).forEach(r => {
        if (r.planned > 0) {
          totalActions += 1;
          if (r.completed >= r.planned) {
            completedActions += 1;
          }
        }
      });
    });

    return {
      activePlansCount: activePlansCount || (currentMonitoring.status === MONITORING_STATUS.IN_PROGRESS ? 1 : 0),
      zonesInProgressCount,
      overallProgress,
      completedActionsRatio: `${completedActions} / ${totalActions}`,
    };
  }, [disasterMonitoringRecords, currentMonitoring]);

  // Resource Icon helper
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

  // Status Badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case MONITORING_STATUS.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            COMPLETED
          </span>
        );
      case MONITORING_STATUS.PAUSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Pause className="w-3.5 h-3.5 text-slate-600" />
            PAUSED
          </span>
        );
      case MONITORING_STATUS.PARTIALLY_COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            PARTIALLY COMPLETED
          </span>
        );
      case MONITORING_STATUS.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            IN PROGRESS
          </span>
        );
      case MONITORING_STATUS.NOT_STARTED:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            NOT STARTED
          </span>
        );
    }
  };

  // Handlers
  const handleConfirmStart = () => {
    if (currentMonitoring) {
      startSimulation(currentMonitoring.monitoringId, {
        actor: currentUser?.name || 'Command Center Officer',
      });
      setShowStartModal(false);
    }
  };

  const handleOpenAddProgress = (zoneId = '', resourceKey = '') => {
    setSelectedZoneForProgress(zoneId || currentMonitoring?.zoneProgress[0]?.zoneId || '');
    setSelectedResourceForProgress(resourceKey || '');
    setProgressAmountToAdd('');
    setProgressFormError('');
    setCompletionError(null);
    setShowAddProgressModal(true);
  };

  const handleConfirmAddProgress = () => {
    if (!selectedZoneForProgress || !selectedResourceForProgress || !progressAmountToAdd) {
      setProgressFormError('Please select a zone, resource, and positive amount.');
      return;
    }

    try {
      addProgress(currentMonitoring.monitoringId, {
        zoneId: selectedZoneForProgress,
        resource: selectedResourceForProgress,
        amount: progressAmountToAdd,
        actor: currentUser?.name || 'Command Center',
      });
      setShowAddProgressModal(false);
      setProgressAmountToAdd('');
      setProgressFormError('');
    } catch (err) {
      setProgressFormError(err.message);
    }
  };

  const handlePause = () => {
    if (currentMonitoring) {
      pauseSimulation(currentMonitoring.monitoringId, {
        actor: currentUser?.name || 'Command Center',
      });
    }
  };

  const handleResume = () => {
    if (currentMonitoring) {
      resumeSimulation(currentMonitoring.monitoringId, {
        actor: currentUser?.name || 'Command Center',
      });
    }
  };

  const handleComplete = () => {
    if (currentMonitoring) {
      const result = completeSimulation(currentMonitoring.monitoringId, {
        actor: currentUser?.name || 'Command Center',
      });
      if (!result.success) {
        setCompletionError(result.error);
      } else {
        setCompletionError(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Mandatory Simulation Banner (Section 1 & 6) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Response Monitoring</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Track simulated progress of approved response plans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentMonitoring && getStatusBadge(currentMonitoring.status)}
            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <strong>Disaster:</strong> {currentDisaster?.name || 'Assam Flood Response'}
            </div>
          </div>
        </div>

        {/* Mandatory Simulation Notice Banner (Section 1 & 6) */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Simulation only — no real resources are being tracked or dispatched.</span>
            <p className="text-amber-800 text-[11px] mt-0.5">
              This environment simulates the operational progress of approved decision models. No physical vehicles, vessels, or relief supply trucks are in live motion.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Plan Selector or Empty State (Section 8) */}
      {approvedPlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">No approved response plan available</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Only approved response plans can be monitored. Please review and approve a plan in the Response Plans module to launch simulation monitoring.
          </p>
          <button
            type="button"
            onClick={() => navigate('/response-plans')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
          >
            <span>View Response Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Select Response Plan:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {approvedPlans.map(plan => {
                const isSelected = activePlanId === plan.planId;
                return (
                  <button
                    key={plan.planId}
                    type="button"
                    onClick={() => initializeMonitoringForPlan(plan.planId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {plan.planId} ({plan.disasterName})
                  </button>
                );
              })}
            </div>
          </div>

          {currentMonitoring && (
            <span className="text-xs font-mono text-slate-500">
              Monitoring ID: <strong className="text-slate-800">{currentMonitoring.monitoringId}</strong>
            </span>
          )}
        </div>
      )}

      {currentMonitoring && (
        <>
          {/* 3. Four KPI Summary Cards (Section 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Plans */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Active Plans
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {kpiMetrics.activePlansCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Simulated response operations
              </p>
            </div>

            {/* Card 2: Zones in Progress */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
                Zones in Progress
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {kpiMetrics.zonesInProgressCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active operational sectors
              </p>
            </div>

            {/* Card 3: Overall Progress */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                Overall Progress
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {kpiMetrics.overallProgress}%
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${kpiMetrics.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Card 4: Completed Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Completed Actions
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {kpiMetrics.completedActionsRatio}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Planned resource batches finished
              </p>
            </div>
          </div>

          {/* 4. Simulation Controls (Command Center only - Section 12) */}
          {isCommandCenter && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Simulation Controls</h3>
                  <p className="text-xs text-slate-500">
                    Human commander controls for advancing the simulated response lifecycle.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentMonitoring.status === MONITORING_STATUS.NOT_STARTED && (
                    <button
                      type="button"
                      onClick={() => setShowStartModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Simulation</span>
                    </button>
                  )}

                  {currentMonitoring.status === MONITORING_STATUS.IN_PROGRESS && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenAddProgress()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Progress</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePause}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleComplete}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Simulation</span>
                      </button>
                    </>
                  )}

                  {currentMonitoring.status === MONITORING_STATUS.PAUSED && (
                    <>
                      <button
                        type="button"
                        onClick={handleResume}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Simulation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAddProgress()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Progress</span>
                      </button>
                    </>
                  )}

                  {currentMonitoring.status === MONITORING_STATUS.COMPLETED && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Response simulation completed
                    </span>
                  )}
                </div>
              </div>

              {completionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center justify-between">
                  <span>{completionError}</span>
                  <button 
                    onClick={() => setCompletionError(null)} 
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Department Read-Only Indicator (Section 21) */}
          {isDepartment && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Department View ({currentUser?.department || 'Department'}):</strong> Displaying simulated progress relevant to your operational jurisdiction. Controls are managed centrally by the Command Center.
              </span>
            </div>
          )}

          {/* 5. Zone Progress Cards (Section 10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Zone Progress</h2>
                <p className="text-xs text-slate-500">
                  Simulated resource completion across active sectors.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {displayZoneProgress.length} zones monitored
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayZoneProgress.map(zone => (
                <div 
                  key={zone.zoneId}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{zone.zoneName}</h3>
                        <span className="text-[11px] font-mono text-slate-500 uppercase">{zone.zoneId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{zone.overallProgress}%</span>
                        <span className="text-[11px] text-slate-500 block">Overall</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          zone.overallProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${zone.overallProgress}%` }}
                      />
                    </div>

                    {/* Zone Status Notice */}
                    {zone.status === ZONE_STATUS.COMPLETED && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zone response completed</span>
                      </div>
                    )}

                    {/* Resources List (Section 10 & 11) */}
                    <div className="space-y-2 pt-1">
                      {zone.resources.map(res => (
                        <div key={res.resource} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              {getResourceIcon(res.resource)}
                              <span>{res.resourceName}</span>
                            </div>
                            <span className="font-mono text-slate-700">
                              {res.completed.toLocaleString()} / {res.planned.toLocaleString()} completed ({res.progress}%)
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                res.completed >= res.planned ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${res.progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>Remaining: <strong className="text-slate-800">{res.remaining.toLocaleString()} {res.unit}</strong></span>
                            {isCommandCenter && currentMonitoring.status === MONITORING_STATUS.IN_PROGRESS && res.remaining > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddProgress(zone.zoneId, res.resource)}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer text-[11px]"
                              >
                                + Add Progress
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Priority Score: {zone.priorityScore}</span>
                    <span>Status: {zone.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Monitoring History / Timeline (Section 18) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Monitoring History</h3>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {currentMonitoring.history.map((step, idx) => (
                <div key={step.id || idx} className="relative space-y-1">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-200"></span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{step.action}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {step.note && <p className="text-xs text-slate-600">{step.note}</p>}
                  <span className="text-[11px] text-slate-400 block">Actor: {step.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal: Confirm Start Simulation (Section 9) */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Start response simulation?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will simulate response progress for the approved plan. No physical resources will be dispatched.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
              Plan ID: {currentMonitoring?.planId} • Disaster: {currentMonitoring?.disasterName}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Simulation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Progress (Section 12) */}
      {showAddProgressModal && currentMonitoring && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Add Simulated Progress</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProgressModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Zone Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Zone:</label>
                <select
                  value={selectedZoneForProgress}
                  onChange={(e) => setSelectedZoneForProgress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {currentMonitoring.zoneProgress.map(z => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.zoneName} ({z.zoneId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Resource:</label>
                <select
                  value={selectedResourceForProgress}
                  onChange={(e) => setSelectedResourceForProgress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose resource --</option>
                  {(currentMonitoring.zoneProgress.find(z => z.zoneId === selectedZoneForProgress)?.resources || []).map(r => (
                    <option key={r.resource} value={r.resource}>
                      {r.resourceName} ({r.completed}/{r.planned} completed, {r.remaining} remaining)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount to add */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Completed amount to add:</label>
                <input
                  type="number"
                  min="1"
                  value={progressAmountToAdd}
                  onChange={(e) => setProgressAmountToAdd(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {progressFormError && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  {progressFormError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProgressModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddProgress}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Progress</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
