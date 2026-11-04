import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export interface DashboardKPICardProps {
  title: string;
  value: string | number;
  sublabel?: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'blue' | 'green' | 'orange' | 'purple' | 'neutral';
  hoverRgb?: '58,67,110' | '110,86,58' | '110,58,74' | '84,84,84' | string;
  hoverVariant?: 'sky' | 'green' | 'orange' | 'gray';
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
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
  // Light Sky
  sky: {
    iconBg: 'bg-[#F0F7FF] dark:bg-[#0C1E3A]',
    iconColor: 'text-[#0284C7] dark:text-[#38BDF8]',
    iconBorder: 'border-sky-200 dark:border-sky-800',
    hoverClass: 'hover:bg-[#F0F7FF] dark:hover:bg-[#0C1E3A] hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-[0_2px_8px_rgba(2,132,199,0.08)]',
    accentDot: 'bg-[#0284C7]',
  },
  // Light Green
  green: {
    iconBg: 'bg-[#F0FDF4] dark:bg-[#0C2A1E]',
    iconColor: 'text-[#10B981] dark:text-[#34D399]',
    iconBorder: 'border-emerald-200 dark:border-emerald-800',
    hoverClass: 'hover:bg-[#F0FDF4] dark:hover:bg-[#0C2A1E] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
    accentDot: 'bg-[#10B981]',
  },
  // Light Orange
  orange: {
    iconBg: 'bg-[#FFF7ED] dark:bg-[#2A170A]',
    iconColor: 'text-[#F97316] dark:text-[#FB923C]',
    iconBorder: 'border-orange-200 dark:border-orange-800',
    hoverClass: 'hover:bg-[#FFF7ED] dark:hover:bg-[#2A170A] hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-[0_2px_8px_rgba(249,115,22,0.08)]',
    accentDot: 'bg-[#F97316]',
  },
  // Light Gray
  gray: {
    iconBg: 'bg-[#F8FAFC] dark:bg-[#1E2538]',
    iconColor: 'text-[#64748B] dark:text-[#94A3B8]',
    iconBorder: 'border-slate-300 dark:border-slate-700',
    hoverClass: 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E2538] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_2px_8px_rgba(100,116,139,0.06)]',
    accentDot: 'bg-[#64748B]',
  },
  // Legacy aliases
  '58,67,110': {
    iconBg: 'bg-[#F0F7FF] dark:bg-[#0C1E3A]',
    iconColor: 'text-[#0284C7] dark:text-[#38BDF8]',
    iconBorder: 'border-sky-200 dark:border-sky-800',
    hoverClass: 'hover:bg-[#F0F7FF] dark:hover:bg-[#0C1E3A] hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-[0_2px_8px_rgba(2,132,199,0.08)]',
    accentDot: 'bg-[#0284C7]',
  },
  '110,86,58': {
    iconBg: 'bg-[#F0FDF4] dark:bg-[#0C2A1E]',
    iconColor: 'text-[#10B981] dark:text-[#34D399]',
    iconBorder: 'border-emerald-200 dark:border-emerald-800',
    hoverClass: 'hover:bg-[#F0FDF4] dark:hover:bg-[#0C2A1E] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
    accentDot: 'bg-[#10B981]',
  },
  '110,58,74': {
    iconBg: 'bg-[#FFF7ED] dark:bg-[#2A170A]',
    iconColor: 'text-[#F97316] dark:text-[#FB923C]',
    iconBorder: 'border-orange-200 dark:border-orange-800',
    hoverClass: 'hover:bg-[#FFF7ED] dark:hover:bg-[#2A170A] hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-[0_2px_8px_rgba(249,115,22,0.08)]',
    accentDot: 'bg-[#F97316]',
  },
  '84,84,84': {
    iconBg: 'bg-[#F8FAFC] dark:bg-[#1E2538]',
    iconColor: 'text-[#64748B] dark:text-[#94A3B8]',
    iconBorder: 'border-slate-300 dark:border-slate-700',
    hoverClass: 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E2538] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_2px_8px_rgba(100,116,139,0.06)]',
    accentDot: 'bg-[#64748B]',
  },
};

export const DashboardKPICard: React.FC<DashboardKPICardProps> = ({
  title,
  value,
  sublabel,
  icon: Icon,
  variant = 'blue',
  hoverRgb,
  hoverVariant,
  trend,
  isLoading = false,
  className = '',
  onClick,
}) => {
  const chosenKey = hoverVariant || hoverRgb;
  if (chosenKey && colorStyles[chosenKey]) {
    const s = colorStyles[chosenKey];
    return (
      <div
        onClick={onClick}
        className={`bg-white dark:bg-[#141A2E] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#252F4E] shadow-2xs transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between ${
          s.hoverClass
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-wide">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${s.iconBg} ${s.iconColor} ${s.iconBorder} transition-transform group-hover:scale-105`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="mt-3">
          {isLoading ? (
            <div className="space-y-2 pt-1">
              <Skeleton className="h-9 w-24 rounded-lg" />
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
                      trend.isPositive
                        ? 'bg-[#ECFDF5] text-[#059669]'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {trend.isPositive ? '▲' : '▼'} {trend.value}
                  </span>
                  {trend.label && (
                    <span className="text-[#94A3B8]">{trend.label}</span>
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
  }

  // Classic Card
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#141A2E] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#252F4E] shadow-2xs hover:border-[#0A24E9]/35 hover:shadow-md transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60 dark:bg-[#1E294B] dark:text-[#60A5FA]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums tracking-tight">
              {value}
            </h3>

            {sublabel && (
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 flex items-center gap-1.5">
                {sublabel}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
