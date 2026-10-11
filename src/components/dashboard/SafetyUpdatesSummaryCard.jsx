/**
 * RELIEF-OS Safety Updates Summary Card
 * 
 * Compact operational card displayed on Command Center Dashboard (/command-center).
 * 
 * Shows:
 * - Published count
 * - Drafts count
 * - Latest update title
 * - "Manage Safety Updates" button linking to /safety-updates
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight, CheckCircle2, Edit3 } from 'lucide-react';
import { useSafetyUpdate } from '../../context/SafetyUpdateContext';
import { UPDATE_STATUS } from '../../models/safetyUpdate';

export default function SafetyUpdatesSummaryCard() {
  const navigate = useNavigate();
  const { disasterUpdates } = useSafetyUpdate();

  const publishedCount = disasterUpdates.filter(u => u.status === UPDATE_STATUS.PUBLISHED).length;
  const draftsCount = disasterUpdates.filter(u => u.status === UPDATE_STATUS.DRAFT).length;
  const latestUpdate = disasterUpdates[0] || null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Bell className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Safety Updates</h2>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          Public Notices
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Published</span>
          </div>
          <div className="text-xl font-bold text-emerald-900">
            {publishedCount}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Drafts</span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {draftsCount}
          </div>
        </div>
      </div>

      <div className="text-xs space-y-1 pt-1">
        <span className="text-[11px] text-slate-400 font-medium block">Latest Update:</span>
        <div className="font-semibold text-slate-800 truncate" title={latestUpdate?.title || 'No updates created'}>
          {latestUpdate?.title || 'No updates created'}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/safety-updates')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <span>Manage Safety Updates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
