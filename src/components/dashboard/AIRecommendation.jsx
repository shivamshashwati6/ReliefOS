import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Sliders, 
  XCircle, 
  ArrowRight,
  Info,
  Ship,
  Package,
  Droplets,
  Stethoscope
} from 'lucide-react';
import { AI_RECOMMENDATION } from '../../data/demoData';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

export function AIRecommendation({ recommendation = AI_RECOMMENDATION }) {
  const navigate = useNavigate();
  const [feedbackState, setFeedbackState] = useState(null); // 'approved' | 'modified' | 'rejected'

  const handleActionClick = (actionType) => {
    setFeedbackState(actionType);
  };

  const getActionIcon = (text) => {
    const t = text.toLowerCase();
    if (t.includes('boat')) return <Ship className="w-4 h-4 text-blue-600" />;
    if (t.includes('food')) return <Package className="w-4 h-4 text-amber-600" />;
    if (t.includes('water')) return <Droplets className="w-4 h-4 text-cyan-600" />;
    if (t.includes('medical')) return <Stethoscope className="w-4 h-4 text-rose-600" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
  };

  return (
    <section 
      aria-label="Recommended Next Step"
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left: Summary & Suggestions */}
        <div className="space-y-4 flex-1">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recommended Next Step
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              Zone A needs immediate attention.
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              <strong>3,842 people affected</strong> in Sector 4 following water level rise.
            </p>
          </div>

          {/* Suggested Resources Needed */}
          <div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Suggested Resources:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {recommendation.recommendedActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center gap-3"
                >
                  <div className="p-2 rounded-md bg-white border border-slate-200 shadow-2xs shrink-0">
                    {getActionIcon(action.text)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {action.text}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {action.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human review note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>AI-suggested based on incoming reports. Final decisions should be reviewed by a human.</span>
          </div>
        </div>

        {/* Right: Actions and View Zone link */}
        <div className="flex flex-col justify-between gap-4 lg:w-72 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0">
          <div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Route Status
            </div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="text-red-700 bg-red-50 p-2 rounded border border-red-200">
                Route A is flooded.
              </div>
              <div className="text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                Route C is clear (+22m detour).
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              variant="default"
              size="md"
              className="w-full justify-center"
              onClick={() => navigate('/zones/zone-a')}
            >
              <span>View Zone A</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            {/* Quick Review Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleActionClick('approved')}
                className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-center"
              >
                Approve
              </button>
              <button
                onClick={() => handleActionClick('modified')}
                className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-center"
              >
                Modify
              </button>
              <button
                onClick={() => handleActionClick('rejected')}
                className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-center"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action feedback message */}
      {feedbackState && (
        <div 
          role="status"
          className={cn(
            "mt-4 p-3 rounded-lg border text-xs flex items-center justify-between",
            feedbackState === 'approved' 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : feedbackState === 'modified'
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Response plan has been <strong>{feedbackState}</strong>.</span>
          </div>
          <button
            onClick={() => setFeedbackState(null)}
            className="text-slate-500 hover:text-slate-800 ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}

export default AIRecommendation;
