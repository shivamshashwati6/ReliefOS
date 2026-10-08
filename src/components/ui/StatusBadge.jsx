import React from 'react';
import { getSeverityStyles, cn } from '../../lib/utils';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export function StatusBadge({ status, label, size = 'sm', className = '', showPulse = false }) {
  const styles = getSeverityStyles(status);
  const displayLabel = label || status;

  const getIcon = () => {
    const s = String(status).toLowerCase();
    if (s === 'critical') return <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />;
    if (s === 'high') return <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
    if (s === 'medium') return <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  };

  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5 gap-1 font-medium' 
    : size === 'md'
    ? 'text-xs px-2.5 py-1 gap-1.5 font-medium'
    : 'text-xs px-2 py-0.5 gap-1.5 font-medium';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border',
        styles.badgeBg,
        styles.badgeBorder,
        styles.badgeText,
        sizeClasses,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {showPulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', styles.dotBg)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', styles.dotBg)} />
      </span>
      {getIcon()}
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
