import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
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
  trend,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs transition-colors',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="p-2 rounded-md bg-slate-100 text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-slate-900 tracking-tight font-mono tabular-nums">
          {value}
        </p>

        {trend && (
          <span
            className={cn(
              'text-xs font-medium inline-flex items-center',
              trend.isPositive ? 'text-emerald-700' : 'text-slate-600'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
      )}
    </div>
  );
};
