import React from 'react';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (normalized) {
    // Payment Statuses
    case 'paid':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Paid';
      break;
    case 'partial':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Partial';
      break;
    case 'unpaid':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Unpaid';
      break;

    // Transaction Statuses
    case 'completed':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Completed';
      break;
    case 'cancelled':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-300 line-through';
      label = 'Cancelled';
      break;

    // Stock Statuses
    case 'in_stock':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'In Stock';
      break;
    case 'low_stock':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Low Stock';
      break;
    case 'out_of_stock':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Out of Stock';
      break;

    // Financial Types
    case 'income':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Income';
      break;
    case 'expense':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Expense';
      break;

    default:
      label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-md uppercase tracking-wider',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
};
