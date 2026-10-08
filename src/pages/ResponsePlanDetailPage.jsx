/**
 * RELIEF-OS Response Plan Detail Page (/response-plans/:planId)
 * 
 * Detailed review and human decision-making interface for a specific response plan.
 * 
 * STRICT COMPLIANCE:
 * - Deterministic, explainable review without automated dispatching.
 * - Command Center can Start Review, Approve, or Reject with audit log.
 * - Department users have read-only access (no approval actions).
 * - Clearly demarcates: RECOMMENDED vs APPROVED vs DISPATCHED (Not implemented).
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Boxes, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Droplet, 
  LifeBuoy, 
  HeartPulse, 
  Info, 
  Calendar, 
  User, 
  History, 
  FileCheck, 
  Activity 
} from 'lucide-react';
import { useResponsePlan } from '../context/ResponsePlanContext';
import { useResponseMonitoring } from '../context/ResponseMonitoringContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { PLAN_STATUS } from '../models/responsePlan';

export default function ResponsePlanDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { getPlanById, startReview, approvePlan, rejectPlan } = useResponsePlan();
  const { initializeMonitoringForPlan } = useResponseMonitoring();
  const { role, currentUser } = useAuth();

  const isCommandCenter = role === ROLES.COMMAND_CENTER;

  const handleMonitorResponse = () => {
    try {
      initializeMonitoringForPlan(planId);
    } catch (err) {
      // If already initialized, proceed to navigation
    }
    navigate('/response-monitoring');
  };

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  // Collapsible sections state
  const [showWhyPlan, setShowWhyPlan] = useState(true);

  // Retrieve plan record
  const plan = getPlanById(planId);

  // Fallback if plan is not found
  if (!plan) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Response Plan Not Found</h2>
        <p className="text-xs text-slate-500">
          Plan ID <span className="font-mono font-semibold">{planId}</span> could not be located for this disaster event.
        </p>
        <button
          type="button"
          onClick={() => navigate('/response-plans')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Response Plans</span>
        </button>
      </div>
    );
  }

  // Aggregate metrics for summary cards (Section 8: max 4 cards)
  const totalAllocatedCount = Object.values(plan.totalAllocated || {}).reduce((acc, v) => acc + (v || 0), 0);
  const totalUnmetCount = Object.values(plan.unmetDemand || {}).reduce((acc, v) => acc + (v || 0), 0);

  // Priority zones covered in this plan
  const priorityZoneNames = Array.from(new Set(plan.allocations.map(a => a.zoneName || a.zoneId))).slice(0, 3).join(', ');

  // Filter unmet needs list
  const unmetAllocations = plan.allocations.filter(a => a.remainingNeed !== null && a.remainingNeed > 0);

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case PLAN_STATUS.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            APPROVED (SIMULATION)
          </span>
        );
      case PLAN_STATUS.UNDER_REVIEW:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-4 h-4 text-amber-700" />
            UNDER REVIEW
          </span>
        );
      case PLAN_STATUS.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-4 h-4 text-rose-700" />
            REJECTED
          </span>
        );
      case PLAN_STATUS.DRAFT:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <ClipboardList className="w-4 h-4 text-slate-600" />
            DRAFT PLAN
          </span>
        );
    }
  };

  const getPriorityBadge = (score, band) => {
    if (score >= 85 || band === 'CRITICAL' || band === 'Critical') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Critical ({score})</span>;
    }
    if (score >= 70 || band === 'HIGH' || band === 'High') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">High ({score})</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Medium ({score})</span>;
  };

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

  // Actions
  const handleStartReview = () => {
    startReview(plan.planId, {
      user: currentUser?.name || 'Command Center Officer',
      note: 'Response plan submitted for operational review.',
    });
  };

  const handleConfirmApprove = () => {
    approvePlan(plan.planId, {
      approvedBy: currentUser?.name || 'Command Center',
      note: 'Response plan formally approved for prototype simulation.',
    });
    setShowApproveModal(false);
  };

  const handleConfirmReject = () => {
    rejectPlan(plan.planId, {
      rejectedBy: currentUser?.name || 'Command Center',
      note: rejectionNote.trim() || 'Plan rejected during operational commander review.',
    });
    setShowRejectModal(false);
    setRejectionNote('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/response-plans')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Response Plans</span>
        </button>
      </div>

      {/* 1. Plan Header (Section 7) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {plan.planId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Response Plan</h1>
              {getStatusBadge(plan.status)}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <strong>Disaster:</strong> {plan.disasterName} ({plan.region})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <strong>Created by:</strong> {plan.createdBy}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(plan.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </div>

          {/* Workflow Action & Monitoring Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {isCommandCenter && plan.status === PLAN_STATUS.DRAFT && (
              <button
                type="button"
                onClick={handleStartReview}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Start Review</span>
              </button>
            )}

            {isCommandCenter && plan.status === PLAN_STATUS.UNDER_REVIEW && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Plan</span>
                </button>
              </>
            )}

            {plan.status === PLAN_STATUS.APPROVED ? (
              <button
                type="button"
                onClick={handleMonitorResponse}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Monitor Response</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Monitoring becomes available after approval.
              </span>
            )}
          </div>
        </div>

        {/* Status Callout Banners */}
        {plan.status === PLAN_STATUS.APPROVED && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 flex-1 space-y-1">
              <div className="font-bold text-sm">Response plan approved for simulation.</div>
              <div className="text-emerald-800">
                <strong>Approved by:</strong> {plan.approval?.approvedBy || 'Command Center'} • <strong>Approved at:</strong> {plan.approval?.approvedAt ? new Date(plan.approval.approvedAt).toLocaleTimeString() : 'Current session'}
              </div>
              <div className="inline-block font-semibold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded text-[11px] mt-1">
                Simulation only — no physical resources have been dispatched.
              </div>
            </div>
          </div>
        )}

        {plan.status === PLAN_STATUS.REJECTED && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 flex-1 space-y-1">
              <div className="font-bold text-sm">Plan rejected</div>
              <div className="text-rose-800">
                <strong>Rejected by:</strong> {plan.approval?.approvedBy || 'Command Center'}
              </div>
              {plan.approval?.note && (
                <div className="p-2 rounded bg-white/80 border border-rose-200 text-[11px] text-rose-900 font-mono">
                  "{plan.approval.note}"
                </div>
              )}
              <div className="text-[11px] text-rose-700">
                No resource movement occurs. Operational staff may adjust parameters and submit an updated plan.
              </div>
            </div>
          </div>
        )}

        {/* Approval Boundary Governance Disclaimer (Section 22) */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">Operational Boundary: </span>
            <span className="text-emerald-800 font-medium">RECOMMENDED</span> (calculated by Allocation Engine) → <span className="text-blue-800 font-medium">APPROVED</span> (signed off by Command Center) → <span className="text-slate-400 font-medium italic">DISPATCHED (Not available in this version)</span>.
          </div>
        </div>
      </div>

      {/* 2. Maximum 4 Summary Cards (Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Zones Covered */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Zones covered
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {plan.zonesCount} zones
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Affected sectors in {plan.region}
          </p>
        </div>

        {/* Card 2: Resources Planned */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Resources planned
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {totalAllocatedCount.toLocaleString()} units
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {plan.resourcesCount} resource types
          </p>
        </div>

        {/* Card 3: Estimated Unmet Demand */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
            Estimated unmet demand
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {totalUnmetCount.toLocaleString()} units
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unmet need transparently identified
          </p>
        </div>

        {/* Card 4: Priority Zones */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Priority zones
          </div>
          <div className="text-base font-bold text-slate-900 truncate" title={priorityZoneNames}>
            {priorityZoneNames || 'Active sectors'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized by Priority Engine scores
          </p>
        </div>
      </div>

      {/* 3. Collapsible "Why was this plan created?" (Section 10) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setShowWhyPlan(prev => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <FileCheck className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Why was this plan created?</h2>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            {showWhyPlan ? 'Collapse' : 'Expand'}
            {showWhyPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showWhyPlan && (
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 space-y-3">
            <p className="leading-relaxed">
              Recommendations are based on zone priority, current resource demand and simulated inventory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Priority Order</span>
                <span className="font-semibold text-slate-800">
                  {Array.from(new Set(plan.allocations.map(a => `${a.zoneId} (${a.priorityScore})`))).join(' → ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Allocation Method</span>
                <span className="font-semibold text-slate-800">
                  Minimum coverage (20%) + priority-based greedy distribution
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Human Review</span>
                <span className="font-semibold text-amber-800">
                  Required before operational dispatch
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Planned Actions Table (Section 9) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Planned Actions</h2>
            <p className="text-xs text-slate-500">
              Recommended resource allocations approved for planning review.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            {plan.allocations.length} planned actions
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">Zone</th>
                <th scope="col" className="px-5 py-3.5">Priority</th>
                <th scope="col" className="px-5 py-3.5">Resource</th>
                <th scope="col" className="px-5 py-3.5 text-right">Requested</th>
                <th scope="col" className="px-5 py-3.5 text-right">Recommended</th>
                <th scope="col" className="px-5 py-3.5 text-right">Still Needed</th>
                <th scope="col" className="px-5 py-3.5">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plan.allocations.map((item, idx) => (
                <tr key={`${item.zoneId}-${item.resource}-${idx}`} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{item.zoneName || item.zoneId}</span>
                    <span className="text-xs text-slate-500 block uppercase font-mono">{item.zoneId}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getPriorityBadge(item.priorityScore, item.priorityBand)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      {getResourceIcon(item.resource)}
                      <span>{item.resourceName || item.resource}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-medium">
                    {item.requested !== null ? `${item.requested.toLocaleString()} ${item.unit || ''}` : '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-emerald-700">
                    {item.allocated > 0 ? `${item.allocated.toLocaleString()} ${item.unit || ''}` : '0'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    {item.remainingNeed !== null ? (
                      item.remainingNeed > 0 ? (
                        <span className="font-semibold text-amber-700">{item.remainingNeed.toLocaleString()} {item.unit || ''}</span>
                      ) : (
                        <span className="text-slate-500">0 remaining</span>
                      )
                    ) : (
                      <span className="text-slate-400 italic text-xs">Pending assessment</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                    {item.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="block md:hidden divide-y divide-slate-200">
          {plan.allocations.map((item, idx) => (
            <div key={`m-${item.zoneId}-${item.resource}-${idx}`} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{item.zoneName || item.zoneId}</span>
                  <span className="text-xs text-slate-500 block font-mono">{item.zoneId}</span>
                </div>
                {getPriorityBadge(item.priorityScore, item.priorityBand)}
              </div>

              <div className="flex items-center gap-1.5 font-medium text-xs text-slate-800">
                {getResourceIcon(item.resource)}
                <span>{item.resourceName || item.resource}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Recommended</span>
                  <span className="font-bold text-emerald-700">
                    {item.allocated > 0 ? `${item.allocated.toLocaleString()} ${item.unit || ''}` : '0'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Still Needed</span>
                  <span className={`font-semibold ${item.remainingNeed > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {item.remainingNeed !== null ? `${item.remainingNeed.toLocaleString()} ${item.unit || ''}` : 'Pending assessment'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Section: "Still Needed" (Section 11) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Still Needed</h2>
            <p className="text-xs text-slate-500">
              Identified demand shortages across affected sectors.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Available simulated resources were not enough to meet all current demand.
        </p>

        {unmetAllocations.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-500 italic">
            All requested resources were fully satisfied in this plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {unmetAllocations.map((item, idx) => (
              <div key={`unmet-${idx}`} className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.zoneName || item.zoneId}</span>
                  <span className="text-[11px] font-mono text-slate-500">Priority {item.priorityScore}</span>
                </div>
                <div className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                  {getResourceIcon(item.resource)}
                  <span>{item.resourceName || item.resource}: <strong>{item.remainingNeed.toLocaleString()} {item.unit || ''} still needed</strong></span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Requested {item.requested?.toLocaleString()} • Recommended {item.allocated?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Decision History / Audit Trail (Section 15) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <History className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">Decision History</h2>
        </div>

        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {plan.history.map((step, idx) => (
            <div key={step.id || idx} className="relative space-y-1">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-200"></span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{step.action}</span>
                <span className="text-[11px] font-mono text-slate-400">{step.timeFormatted || 'Recent'}</span>
              </div>
              <p className="text-xs text-slate-600">{step.note}</p>
              <span className="text-[11px] text-slate-400 block">By: {step.user}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Confirm Approval */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Approve this response plan?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Approval records the planning decision for this simulation. No physical resources will be dispatched.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <div>Plan: {plan.planId}</div>
              <div>Planned resources: {totalAllocatedCount.toLocaleString()} units</div>
              <div>Zones covered: {plan.zonesCount} zones</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Rejection */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Why are you rejecting this plan?</h3>
            </div>

            <p className="text-xs text-slate-600">
              Please provide feedback explaining the decision to reject this recommendation:
            </p>

            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Add a note (optional)... e.g., Higher medical allocation needed for Sector 4."
              className="w-full h-24 p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
