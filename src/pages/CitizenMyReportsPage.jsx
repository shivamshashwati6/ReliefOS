import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, MapPin, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useReports } from '../context/ReportContext';

export function CitizenMyReportsPage() {
  const navigate = useNavigate();
  const { reports } = useReports();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => navigate('/citizen/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Submitted Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track emergency requests, volunteer assistance notes, and response status.
          </p>
        </div>

        <button
          onClick={() => navigate('/report-emergency')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Emergency Report</span>
        </button>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No incident reports submitted yet.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{report.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {report.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {report.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{report.location || 'Assam Flood Impact Zone'}</span>
                </div>
                {report.contact && (
                  <span className="text-slate-400 font-mono">
                    Contact: {report.contact}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CitizenMyReportsPage;
