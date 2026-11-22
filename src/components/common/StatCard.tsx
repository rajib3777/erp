import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 min-w-0 flex flex-col justify-between',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5',
        className
      )}
    >
      {/* Top Header: Title & Icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Metric Value: Clean, Non-overflowing font */}
      <div className="mt-3 min-w-0">
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums truncate" title={String(value)}>
          {value}
        </div>
      </div>

      {/* Footer Info / Subtitle / Trend */}
      {(subtitle || trend || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs">
          {subtitle && (
            <p className="text-[11px] text-slate-500 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}

          {trend && (
            <span
              className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 font-mono',
                trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
              )}
            >
              {trend.value}
            </span>
          )}

          {badge && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
