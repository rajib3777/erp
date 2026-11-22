import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
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
  colorScheme = 'blue',
  trend,
  className,
  onClick,
}) => {
  const schemeStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/80',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100/80',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/80',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
    },
    slate: {
      iconBg: 'bg-slate-50 text-slate-700 border border-slate-200/80',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }[colorScheme];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 min-w-0 flex flex-col justify-between group',
        onClick && 'cursor-pointer hover:border-slate-300 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Modern Icon slot matching Screenshot 2 */}
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105', schemeStyles.iconBg)}>
          <Icon className="w-6 h-6 stroke-[1.8]" />
        </div>

        {/* Top-right Trend or Sparkline icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', schemeStyles.badge)}>
              {badge}
            </span>
          )}
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono',
                trend.isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              {trend.value}
            </span>
          ) : (
            <div className="p-1 rounded-md text-slate-300 group-hover:text-slate-400 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-4 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <div
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono tabular-nums mt-1 truncate"
          title={String(value)}
        >
          {value}
        </div>
      </div>

      {/* Subtitle / Footer */}
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <p className="text-[11px] text-slate-500 truncate" title={subtitle}>
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
};
