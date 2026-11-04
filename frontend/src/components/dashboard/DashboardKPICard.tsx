import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export interface DashboardKPICardProps {
  title: string;
  value: string | number;
  sublabel?: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'green' | 'blue' | 'gray' | 'orange' | 'sky' | 'neutral';
  hoverVariant?: 'green' | 'blue' | 'gray' | 'orange' | 'sky';
  hoverRgb?: string;
  trend?: {
    value: string | number;
    numericValue?: number;
    isPositive?: boolean;
    label?: string;
  };
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Dynamic metric threshold rule:
 * - A value of 0 should use red.
 * - A positive value above 0 and below 20 should use yellow/orange.
 * - A value of 20 or above should use green.
 * - Negative values should use red.
 */
export function getMetricColorClass(num: number): {
  badgeClass: string;
  arrow: string;
} {
  if (num === 0) {
    return {
      badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40',
      arrow: '',
    };
  }
  if (num < 0) {
    return {
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40',
      arrow: '▼',
    };
  }
  if (num > 0 && num < 20) {
    return {
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40',
      arrow: '▲',
    };
  }
  // num >= 20
  return {
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40',
    arrow: '▲',
  };
}

const colorStyles: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    iconBorder: string;
    hoverClass: string;
    accentDot: string;
  }
> = {
  // Revenue: Green
  green: {
    iconBg: 'bg-[#F0FDF4] dark:bg-[#0C2A1E]',
    iconColor: 'text-[#10B981] dark:text-[#34D399]',
    iconBorder: 'border-emerald-200 dark:border-emerald-800',
    hoverClass: 'hover:bg-[#F0FDF4]/60 dark:hover:bg-[#0C2A1E]/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-[0_2px_12px_rgba(16,185,129,0.08)]',
    accentDot: 'bg-[#10B981]',
  },
  // Bookings: Blue
  blue: {
    iconBg: 'bg-[#EFF6FF] dark:bg-[#0C1E3A]',
    iconColor: 'text-[#2563EB] dark:text-[#60A5FA]',
    iconBorder: 'border-blue-200 dark:border-blue-800',
    hoverClass: 'hover:bg-[#EFF6FF]/60 dark:hover:bg-[#0C1E3A]/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-[0_2px_12px_rgba(37,99,235,0.08)]',
    accentDot: 'bg-[#2563EB]',
  },
  sky: {
    iconBg: 'bg-[#EFF6FF] dark:bg-[#0C1E3A]',
    iconColor: 'text-[#2563EB] dark:text-[#60A5FA]',
    iconBorder: 'border-blue-200 dark:border-blue-800',
    hoverClass: 'hover:bg-[#EFF6FF]/60 dark:hover:bg-[#0C1E3A]/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-[0_2px_12px_rgba(37,99,235,0.08)]',
    accentDot: 'bg-[#2563EB]',
  },
  // Active Clients: Grey
  gray: {
    iconBg: 'bg-[#F8FAFC] dark:bg-[#1E2538]',
    iconColor: 'text-[#64748B] dark:text-[#94A3B8]',
    iconBorder: 'border-slate-300 dark:border-slate-700',
    hoverClass: 'hover:bg-[#F8FAFC]/80 dark:hover:bg-[#1E2538]/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_2px_12px_rgba(100,116,139,0.08)]',
    accentDot: 'bg-[#64748B]',
  },
  // Inventory Alerts: Orange
  orange: {
    iconBg: 'bg-[#FFF7ED] dark:bg-[#2A170A]',
    iconColor: 'text-[#F97316] dark:text-[#FB923C]',
    iconBorder: 'border-orange-200 dark:border-orange-800',
    hoverClass: 'hover:bg-[#FFF7ED]/60 dark:hover:bg-[#2A170A]/40 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-[0_2px_12px_rgba(249,115,22,0.08)]',
    accentDot: 'bg-[#F97316]',
  },
};

export const DashboardKPICard: React.FC<DashboardKPICardProps> = ({
  title,
  value,
  sublabel,
  icon: Icon,
  variant,
  hoverVariant,
  trend,
  isLoading = false,
  className = '',
  onClick,
}) => {
  const chosenKey = hoverVariant || variant || 'blue';
  const s = colorStyles[chosenKey] || colorStyles.blue;

  // Extract actual numeric value for trend threshold evaluation
  let numericTrendVal: number | null = null;
  if (trend) {
    if (typeof trend.numericValue === 'number' && !isNaN(trend.numericValue)) {
      numericTrendVal = trend.numericValue;
    } else {
      const parsed = parseFloat(String(trend.value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        numericTrendVal = trend.isPositive === false && parsed > 0 ? -parsed : parsed;
      }
    }
  }

  const metricColor = numericTrendVal !== null ? getMetricColorClass(numericTrendVal) : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#141A2E] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#252F4E] shadow-2xs transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between min-h-[148px] ${
        s.hoverClass
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-wide">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${s.iconBg} ${s.iconColor} ${s.iconBorder} transition-colors`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight tabular-nums">
              {value}
            </h3>
            {trend ? (
              <div className="text-xs mt-2 flex items-center gap-1.5 font-medium">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                    metricColor ? metricColor.badgeClass : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {metricColor?.arrow ? `${metricColor.arrow} ` : ''}
                  {trend.value}
                </span>
                {trend.label && (
                  <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">{trend.label}</span>
                )}
              </div>
            ) : sublabel ? (
              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-2 flex items-center gap-1.5 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${s.accentDot}`}></span>
                <span>{sublabel}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
