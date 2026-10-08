import React from 'react';
import { 
  UtensilsCrossed, 
  Droplets, 
  Stethoscope, 
  LifeBuoy
} from 'lucide-react';

export function ResourceStatus() {
  const items = [
    {
      id: 'food',
      name: 'Food',
      available: '3,800',
      needed: '1,600 more needed',
      pct: 70,
      icon: UtensilsCrossed,
      color: 'bg-amber-500'
    },
    {
      id: 'water',
      name: 'Water',
      available: '6,000',
      needed: '4,800 more needed',
      pct: 55,
      icon: Droplets,
      color: 'bg-blue-500'
    },
    {
      id: 'medical',
      name: 'Medical Teams',
      available: '12',
      needed: '2 needed',
      pct: 85,
      icon: Stethoscope,
      color: 'bg-rose-500'
    },
    {
      id: 'boats',
      name: 'Rescue Boats',
      available: '18',
      needed: '4 needed',
      pct: 80,
      icon: LifeBuoy,
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Resources
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Available vs Needed
        </p>
      </div>

      {/* Items list */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {items.map((res) => {
          const Icon = res.icon;

          return (
            <div
              key={res.id}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {res.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-900">
                  {res.available} available
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${res.color}`}
                  style={{ width: `${res.pct}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 text-right">
                {res.needed}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResourceStatus;
