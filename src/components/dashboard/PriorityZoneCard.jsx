import React from 'react';
import { cn } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { Users, ChevronRight } from 'lucide-react';

export function PriorityZoneCard({ zone, isSelected = false, onSelect }) {
  const populationText = typeof zone.affectedPopulation === 'number'
    ? zone.affectedPopulation.toLocaleString()
    : zone.affectedPopulation || '3,842';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(zone)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(zone);
        }
      }}
      className={cn(
        "p-3.5 rounded-lg border text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
        isSelected
          ? "bg-blue-50/50 border-blue-400 shadow-xs"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-semibold text-sm text-slate-900">{zone.name}</span>
        <StatusBadge
          status={zone.priorityBand}
          size="xs"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{populationText} people affected</span>
        </span>
        <span className="font-medium text-slate-700 text-xs">
          {zone.priorityScore} / 100
        </span>
      </div>
    </div>
  );
}

export default PriorityZoneCard;
