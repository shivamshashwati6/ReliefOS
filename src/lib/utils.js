/**
 * Utility functions for styling and disaster response formatters
 */

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getSeverityStyles(severity) {
  const norm = String(severity || '').toLowerCase();
  switch (norm) {
    case 'critical':
      return {
        badgeBg: 'bg-red-50',
        badgeBorder: 'border-red-200',
        badgeText: 'text-red-700',
        dotBg: 'bg-red-500',
        borderLeft: 'border-l-red-500',
        glow: 'shadow-red-500/10',
        ring: 'ring-red-500/20',
      };
    case 'high':
      return {
        badgeBg: 'bg-orange-50',
        badgeBorder: 'border-orange-200',
        badgeText: 'text-orange-700',
        dotBg: 'bg-orange-500',
        borderLeft: 'border-l-orange-500',
        glow: 'shadow-orange-500/10',
        ring: 'ring-orange-500/20',
      };
    case 'medium':
      return {
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-200',
        badgeText: 'text-amber-800',
        dotBg: 'bg-amber-500',
        borderLeft: 'border-l-amber-500',
        glow: 'shadow-amber-500/10',
        ring: 'ring-amber-500/20',
      };
    case 'low':
      return {
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-200',
        badgeText: 'text-emerald-700',
        dotBg: 'bg-emerald-500',
        borderLeft: 'border-l-emerald-500',
        glow: 'shadow-emerald-500/10',
        ring: 'ring-emerald-500/20',
      };
    default:
      return {
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-200',
        badgeText: 'text-slate-700',
        dotBg: 'bg-slate-400',
        borderLeft: 'border-l-slate-400',
        glow: 'shadow-slate-500/10',
        ring: 'ring-slate-500/20',
      };
  }
}
