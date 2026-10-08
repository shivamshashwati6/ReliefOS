import React from 'react';
import { X, Bell, Clock, MapPin } from 'lucide-react';
import { CRITICAL_ALERTS } from '../../data/demoData';
import StatusBadge from '../ui/StatusBadge';

export function AlertsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 id="alerts-modal-title" className="text-base font-semibold text-slate-900">
                Alerts
              </h3>
              <p className="text-xs text-slate-500">
                {CRITICAL_ALERTS.length} active notices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {CRITICAL_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  {alert.title}
                </span>
                <StatusBadge status={alert.severity} size="xs" />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {alert.detail}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {alert.zone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {alert.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertsModal;
