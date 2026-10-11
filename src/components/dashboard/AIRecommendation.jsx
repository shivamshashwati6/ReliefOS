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
import { useRouteEngine } from '../../context/RouteContext';
import { ROAD_SEGMENT_STATUS } from '../../config/routeParameters';

export function AIRecommendation({ recommendation = AI_RECOMMENDATION }) {
  const navigate = useNavigate();
  const routeEngine = useRouteEngine();
  const [feedbackState, setFeedbackState] = useState(null); // 'approved' | 'modified' | 'rejected'
  const [showDetails, setShowDetails] = useState(false);

  const optimalRoute = routeEngine?.optimalHeroRoute;
  const segments = routeEngine?.segments || [];
  const segA = segments.find(s => s.id === 'seg-route-a-1');
  const isRouteABlocked = segA ? segA.status === ROAD_SEGMENT_STATUS.BLOCKED : true;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Summary & Suggestions */}
        <div className="space-y-3 flex-1">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Recommended Next Step
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              Zone A needs immediate attention.
            </h3>
            <p className="text-sm text-slate-700 mt-1">
              Suggested support: rescue boats, food, water and medical support.
            </p>
          </div>

          {/* Human review note */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>AI-generated suggestion. Final decisions should be reviewed by a human.</span>
          </div>

          {/* Collapsible Details Action */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              {showDetails ? 'Hide details' : 'View details'}
            </button>
          </div>
        </div>

        {/* Right: Primary View Zone Button and quick review actions */}
        <div className="flex flex-col justify-center gap-3 lg:w-64 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0">
          <Button
            variant="default"
            size="md"
            className="w-full justify-center"
            onClick={() => navigate('/zones/zone-a')}
          >
            <span>View Zone</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          {/* Quick Review Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActionClick('approved')}
              className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-center cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => handleActionClick('modified')}
              className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-center cursor-pointer"
            >
              Modify
            </button>
            <button
              onClick={() => handleActionClick('rejected')}
              className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-center cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Technical Details */}
      {showDetails && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
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

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Route Intelligence (A*)</span>
              <span className="text-[11px] font-mono text-slate-500 font-normal">Deterministic</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={cn(
                "p-2.5 rounded-lg border",
                isRouteABlocked 
                  ? "text-red-700 bg-red-50 border-red-200" 
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              )}>
                {isRouteABlocked 
                  ? "Route A is flooded (culvert KM 42)." 
                  : "Route A is clear (18.5 km direct)."}
              </div>
              <div className={cn(
                "p-2.5 rounded-lg border",
                !optimalRoute?.success
                  ? "text-red-700 bg-red-50 border-red-200"
                  : optimalRoute.primaryCorridor === 'ROUTE_C'
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-blue-700 bg-blue-50 border-blue-200"
              )}>
                {!optimalRoute?.success 
                  ? "All routes blocked."
                  : optimalRoute.primaryCorridor === 'ROUTE_C'
                  ? `Route C is selected (+10.7 km / +22m detour).`
                  : "Route A is currently selected (Direct)."}
              </div>
            </div>
          </div>
        </div>
      )}

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
