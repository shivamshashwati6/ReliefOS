/**
 * RELIEF-OS Response Plans Page (/response-plans)
 * 
 * Lists response plans for the active disaster event.
 * Allows Command Center to create new plans from recommended allocations
 * and navigate to detailed plan review.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert,
  Layers,
  FileCheck2
} from 'lucide-react';
import { useResponsePlan } from '../context/ResponsePlanContext';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { PLAN_STATUS } from '../models/responsePlan';

export default function ResponsePlansPage() {
  const navigate = useNavigate();
  const { disasterPlans, createPlanFromCurrentAllocation } = useResponsePlan();
  const { currentDisaster } = useDisaster();
  const { role } = useAuth();

  const isCommandCenter = role === ROLES.COMMAND_CENTER;

  const handleCreatePlan = () => {
    const newPlan = createPlanFromCurrentAllocation({
      notes: 'Operational response plan generated from allocation recommendations.',
    });
    navigate(`/response-plans/${newPlan.planId}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case PLAN_STATUS.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case PLAN_STATUS.UNDER_REVIEW:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case PLAN_STATUS.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case PLAN_STATUS.DRAFT:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Create Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <ClipboardList className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Response Plans</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review and manage recommended actions for the current disaster.
              </p>
            </div>
          </div>

          {/* Disaster Context & Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div><strong>Disaster:</strong> {currentDisaster?.name || 'Assam Flood Response'}</div>
              <div className="text-slate-500"><strong>Region:</strong> {currentDisaster?.region || 'Morigaon, Assam'}</div>
            </div>

            {isCommandCenter && (
              <button
                type="button"
                onClick={handleCreatePlan}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Response Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Required Decision Support Reminder */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Human Decision Governance:</strong> Response plans translate allocation engine recommendations into actionable operational reviews. Approval authorizes planning for simulation exercises; physical resource deployment protocols remain distinct.
          </p>
        </div>
      </div>

      {/* 2. Response Plans List */}
      {disasterPlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No response plans created yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate a response plan from the current recommended resource allocation to begin the human review workflow.
          </p>
          {isCommandCenter && (
            <button
              type="button"
              onClick={handleCreatePlan}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Response Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {disasterPlans.map(plan => (
            <div 
              key={plan.planId}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {plan.planId}
                  </span>
                  {getStatusBadge(plan.status)}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{plan.disasterName}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plan.region}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Zones Covered</span>
                    <span className="font-bold text-slate-800">{plan.zonesCount} zones</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Resources Planned</span>
                    <span className="font-bold text-slate-800">{plan.resourcesCount} types</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {plan.notes || 'Recommended distribution plan derived from deterministic allocation engine.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Created by {plan.createdBy}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/response-plans/${plan.planId}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>View Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
