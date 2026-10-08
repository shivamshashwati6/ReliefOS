import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Camera, 
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import AiAnalysisPanel from './AiAnalysisPanel';
import StatusBadge from '../ui/StatusBadge';
import { useReports } from '../../context/ReportContext';
import { useDisaster } from '../../context/DisasterContext';
import { analyzeReportWithAi } from '../../services/aiService';

export function ReportCard({ report, onToggleStatus }) {
  const { updateReportAiAnalysis, setReportAiLoading, setReportAiError } = useReports();
  const { currentDisaster } = useDisaster();
  const [localLoading, setLocalLoading] = useState(false);

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + 
        d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Just now';
    }
  };

  const isAnalyzing = localLoading || report.aiStatus === 'Analyzing...';

  const handleAnalyze = async () => {
    if (isAnalyzing) return;

    setLocalLoading(true);
    setReportAiLoading(report.id, true);

    try {
      const analysisResult = await analyzeReportWithAi({
        description: report.description,
        location: report.location,
        disasterType: currentDisaster?.name || 'Flood'
      });

      updateReportAiAnalysis(report.id, analysisResult);
    } catch (err) {
      console.error('Failed to analyze report:', err);
      setReportAiError(report.id, err.message || 'AI analysis is temporarily unavailable.');
    } finally {
      setLocalLoading(false);
      setReportAiLoading(report.id, false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
      {/* Top Header: Location, Time, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-900 text-sm">
            {report.id}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(report.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={report.status === 'New' ? 'Urgent' : 'Safe'}
            size="sm"
          />
        </div>
      </div>

      {/* Original Citizen Report */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Original Report
        </div>
        <p className="text-base text-slate-900 leading-relaxed font-normal bg-slate-50 p-4 rounded-lg border border-slate-100">
          "{report.description}"
        </p>
      </div>

      {/* Metadata Strip: Location, Contact, Photo */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {report.location ? <span className="font-medium text-slate-800">{report.location}</span> : <span className="italic text-slate-400">Location not specified</span>}
          </span>
        </div>

        {/* Contact */}
        {report.contact && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700">{report.contact}</span>
          </div>
        )}

        {/* Photo Attachment */}
        {report.photoName && (
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Photo attached</span>
          </div>
        )}
      </div>

      {/* AI Summary when processed */}
      {report.aiProcessed && report.aiAnalysis && (
        <AiAnalysisPanel analysis={report.aiAnalysis} />
      )}

      {/* Error state */}
      {report.aiStatus === 'Analysis Failed' && report.aiError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{report.aiError}</span>
        </div>
      )}

      {/* Actions Strip */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Generate Summary Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`text-xs font-medium px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isAnalyzing
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                : report.aiProcessed
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : report.aiProcessed ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-analyze</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Mark as Reviewed Toggle */}
        {onToggleStatus && (
          <button
            onClick={() => onToggleStatus(report.id, report.status === 'New' ? 'Reviewed' : 'New')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Mark as {report.status === 'New' ? 'Reviewed' : 'New'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReportCard;
