import React from 'react';
import { cn } from '../../lib/utils';
import { Database } from 'lucide-react';

export function SimulatedBadge({ label = "Simulated Mode", variant = "default", className = "" }) {
  // Normalize label to human friendly
  const cleanLabel = label
    .replace('SIMULATED REPORTING ENVIRONMENT', 'Simulation Mode')
    .replace('SIMULATED ENVIRONMENT', 'Simulation Mode')
    .replace('SIMULATED DATA', 'Simulated Data')
    .replace('SIMULATED FEED', 'Simulated Feed')
    .replace('SIMULATED ZONE ANALYSIS', 'Simulation Mode')
    .replace('SIMULATED', 'Simulated');

  if (variant === "compact") {
    return (
      <span
        title="Demonstration environment with simulated data."
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {cleanLabel}
      </span>
    );
  }

  return (
    <div
      title="Demonstration environment with simulated data."
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200",
        className
      )}
    >
      <Database className="w-3 h-3 text-slate-500 shrink-0" />
      <span>{cleanLabel}</span>
    </div>
  );
}

export default SimulatedBadge;
