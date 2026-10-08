/**
 * RELIEF-OS Response Plan Summary Card
 * 
 * Compact widget for the Command Center dashboard (Section 20).
 * Displays active response plan status and quick navigation button.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, CheckCircle2, Clock, XCircle, Plus, ShieldCheck } from 'lucide-react';
import { useResponsePlan } from '../../context/ResponsePlanContext';
import { PLAN_STATUS } from '../../models/responsePlan';

export default function ResponsePlanSummaryCard() {
  const navigate = useNavigate();
  const { currentPlan, createPlanFromCurrentAllocation } = useResponsePlan();

  const handleCreate = () => {
    const plan = createPlanFromCurrentAllocation();
    navigate(`/response-plans/${plan.planId}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case PLAN_STATUS.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case PLAN_STATUS.UNDER_REVIEW:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case PLAN_STATUS.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case PLAN_STATUS.DRAFT:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Response Plan</h3>
            <p className="text-xs text-slate-500">
              Operational decision for active disaster event
            </p>
          </div>
        </div>

        <div>
          {!currentPlan ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Response Plan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/response-plans/${currentPlan.planId}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <span>{currentPlan.status === PLAN_STATUS.APPROVED ? 'View Plan' : 'Review Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        {!currentPlan ? (
          <p className="text-xs text-slate-500 italic">
            No response plan created yet.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {currentPlan.planId}
              </span>
              <span className="text-slate-600 font-medium">
                {currentPlan.disasterName}
              </span>
              <span className="text-slate-500">
                • {currentPlan.zonesCount} zones
              </span>
            </div>

            <div>
              {getStatusBadge(currentPlan.status)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
