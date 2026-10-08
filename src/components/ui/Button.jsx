import React from 'react';
import { cn } from '../../lib/utils';

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer";

  const sizeStyles = {
    xs: "text-xs px-2.5 py-1 gap-1",
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  const variantStyles = {
    default: "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200",
    primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm border border-transparent",
    danger: "bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm border border-transparent",
    warning: "bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm border border-transparent",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm border border-transparent",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

export default Button;
