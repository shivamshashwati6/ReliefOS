import React from 'react';
import { Users, AlertCircle, FileText, PackageX, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function KPICard({ item }) {
  const iconMap = {
    Users: Users,
    CriticalZones: AlertCircle,
    Reports: FileText,
    Shortages: PackageX,
    Activity: Activity
  };

  const IconComponent = iconMap[item.iconName] || Activity;

  // Soft accents for meaning
  const accentStyles = {
    critical: {
      iconBg: 'bg-red-50 text-red-600',
    },
    high: {
      iconBg: 'bg-orange-50 text-orange-600',
    },
    medium: {
      iconBg: 'bg-amber-50 text-amber-600',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-600',
    },
    normal: {
      iconBg: 'bg-slate-50 text-slate-600',
    }
  };

  const style = accentStyles[item.status] || accentStyles.normal;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {item.value}
          </div>
          <div className="text-sm font-medium text-slate-700 mt-1">
            {item.label}
          </div>
        </div>
        <div className={cn("p-2.5 rounded-lg shrink-0", style.iconBg)}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      {item.explanation && (
        <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 truncate">
          {item.explanation}
        </div>
      )}
    </div>
  );
}

export default KPICard;
