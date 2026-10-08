import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Users, 
  HeartPulse, 
  CheckCircle2, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function AiAnalysisPanel({ analysis }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!analysis) return null;

  const formatItem = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isMedicalNeed = analysis.medical_need === true;
  const severity = formatItem(analysis.severity || 'Medium');
  const urgency = formatItem(analysis.urgency || 'Urgent');
  const disasterType = formatItem(analysis.disaster_type || 'Flood');

  return (
    <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-slate-900">
            AI Summary
          </h4>
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          AI-generated. Please verify before taking action.
        </span>
      </div>

      {/* Human-friendly badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Disaster Type */}
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {disasterType}
        </span>

        {/* Urgency */}
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          ⚠️ {urgency}
        </span>

        {/* Severity */}
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          {severity} severity
        </span>

        {/* People Affected */}
        {analysis.people_affected && (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {analysis.people_affected} people affected
          </span>
        )}

        {/* Medical Need */}
        {isMedicalNeed && (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Medical help needed
          </span>
        )}

        {/* Requirements */}
        {Array.isArray(analysis.requirements) && analysis.requirements.map((req, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
          >
            {formatItem(req)}
          </span>
        ))}
      </div>

      {/* Red Flags if any */}
      {Array.isArray(analysis.red_flags) && analysis.red_flags.length > 0 && (
        <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>Flagged:</strong> {analysis.red_flags.map(formatItem).join(', ')}
          </span>
        </div>
      )}

      {/* Expandable Technical Details Button */}
      {analysis.rationale && (
        <div className="pt-2 border-t border-slate-200/60">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 focus:outline-none"
          >
            <span>{showDetails ? 'Hide details' : 'View details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p>
                <strong>AI Reasoning:</strong> {analysis.rationale}
              </p>
              {analysis.confidence && (
                <p className="text-slate-400">
                  Confidence score: {Math.round(analysis.confidence * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AiAnalysisPanel;
