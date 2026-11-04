import React from 'react';

export type StatusType =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'COMPLETE'
  | 'PAID'
  | 'PENDING'
  | 'PROCESSING'
  | 'IN_PROGRESS'
  | 'UNPAID'
  | 'CANCELLED'
  | 'CANCELED'
  | 'FAILED'
  | 'REFUNDED'
  | 'NO_SHOW'
  | 'OUT_OF_STOCK'
  | 'LOW_STOCK'
  | 'IN_STOCK'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DRAFT'
  | string;

export interface StatusLabelProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const statusColorMap: Record<string, { text: string; dot: string; defaultLabel: string }> = {
  // Green / Success states
  CONFIRMED: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'Confirmed' },
  COMPLETED: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'Completed' },
  COMPLETE: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'Complete' },
  PAID: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'Paid' },
  IN_STOCK: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'In Stock' },
  ACTIVE: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', defaultLabel: 'Active' },

  // Blue states (in progress, processing)
  IN_PROGRESS: { text: 'text-[#2563EB] dark:text-[#60A5FA]', dot: 'bg-[#2563EB]', defaultLabel: 'In Progress' },
  PROCESSING: { text: 'text-[#2563EB] dark:text-[#60A5FA]', dot: 'bg-[#2563EB]', defaultLabel: 'Processing' },

  // Amber states (pending, low stock, partially paid)
  PENDING: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', defaultLabel: 'Pending' },
  LOW_STOCK: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', defaultLabel: 'Low Stock' },
  PARTIALLY_PAID: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', defaultLabel: 'Partially Paid' },

  // Red states (cancelled, failed, unpaid, out of stock)
  CANCELLED: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'Cancelled' },
  CANCELED: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'Cancelled' },
  FAILED: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'Failed' },
  UNPAID: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'Unpaid' },
  OUT_OF_STOCK: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'Out of Stock' },
  NO_SHOW: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', defaultLabel: 'No Show' },
  INACTIVE: { text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400', defaultLabel: 'Inactive' },
  DRAFT: { text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400', defaultLabel: 'Draft' },
  REFUNDED: { text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400', defaultLabel: 'Refunded' },
};

export const StatusLabel: React.FC<StatusLabelProps> = ({
  status,
  label,
  className = '',
  size = 'sm',
}) => {
  const normalizedKey = (status || '').toUpperCase().replace(/[\s-]/g, '_');
  const config = statusColorMap[normalizedKey] || {
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    defaultLabel: status,
  };

  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold select-none pointer-events-none ${sizeClasses[size]} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
};

