import React from 'react';
import { CRITICAL_ALERTS } from '../../data/demoData';
import StatusBadge from '../ui/StatusBadge';
import { Clock } from 'lucide-react';

export function CriticalAlerts({ alerts = CRITICAL_ALERTS, onSelectAlert }) {
  // Human-friendly title mappings
  const friendlyTitles = {
    'alt-01': 'Road blocked',
    'alt-02': 'Medical help needed',
    'alt-03': 'Water shortage',
    'alt-04': 'Shelter nearly full'
  };

  const friendlyZones = {
    'alt-01': 'Route A',
    'alt-02': 'Zone A',
    'alt-03': 'Zone A',
    'alt-04': 'Sector B'
  };

  // Desired order matching Section 5E: Water shortage, Medical help needed, Road blocked, Shelter nearly full
  const alertOrder = ['alt-03', 'alt-02', 'alt-01', 'alt-04'];
  const displayAlerts = [...alerts].sort((a, b) => {
    const idxA = alertOrder.indexOf(a.id);
    const idxB = alertOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return 0;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            What Needs Attention?
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key bottlenecks and urgent issues
          </p>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-2.5 overflow-y-auto">
        {displayAlerts.map((alert) => {
          const title = friendlyTitles[alert.id] || alert.title;
          const zone = friendlyZones[alert.id] || alert.zone;

          return (
            <div
              key={alert.id}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-900">
                  {title}
                </span>
                <StatusBadge status={alert.severity} size="xs" />
              </div>

              <div className="text-xs text-slate-500 mb-1.5 line-clamp-2">
                {alert.detail}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-100">
                <span className="font-medium text-slate-600">{zone}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {alert.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CriticalAlerts;
