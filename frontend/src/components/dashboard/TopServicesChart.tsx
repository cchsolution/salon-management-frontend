import React, { useState } from 'react';
import { Scissors, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { Skeleton } from '../ui/Skeleton';

export interface PopularServiceItem {
  name: string;
  bookings: number;
  revenue?: number;
}

export interface TopServicesChartProps {
  data?: PopularServiceItem[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

// Centralized dashboard theme palette: Soft, light pastel tones as requested
const DONUT_COLORS = [
  '#4E89FF', // Soft Light Blue
  '#34D399', // Soft Light Mint Green
  '#FB923C', // Soft Light Peach Orange
  '#38BDF8', // Soft Light Sky
  '#A78BFA', // Soft Light Lavender
];

export const TopServicesChart: React.FC<TopServicesChartProps> = ({
  data = [],
  isLoading = false,
  className = '',
  title = 'Top Services',
  subtitle = 'Bookings by service frequency',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Take top 4-5 services
  const rawServices = data && data.length > 0 ? data : [];
  let processedServices: { name: string; bookings: number; revenue: number; color: string }[] = [];

  if (rawServices.length > 0) {
    const sorted = [...rawServices].sort((a, b) => (b.bookings || 0) - (a.bookings || 0));
    if (sorted.length <= 4) {
      processedServices = sorted.map((s, idx) => ({
        name: s.name,
        bookings: s.bookings || 0,
        revenue: s.revenue || 0,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }));
    } else {
      const top3 = sorted.slice(0, 3);
      const rest = sorted.slice(3);
      const otherBookings = rest.reduce((acc, r) => acc + (r.bookings || 0), 0);
      const otherRevenue = rest.reduce((acc, r) => acc + (r.revenue || 0), 0);

      processedServices = top3.map((s, idx) => ({
        name: s.name,
        bookings: s.bookings || 0,
        revenue: s.revenue || 0,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }));

      if (otherBookings > 0) {
        processedServices.push({
          name: 'Other Services',
          bookings: otherBookings,
          revenue: otherRevenue,
          color: DONUT_COLORS[3],
        });
      }
    }
  }

  const totalBookings = processedServices.reduce((acc, s) => acc + s.bookings, 0);

  // Geometry - Enlarged Donut Proportions for High Impact
  const radius = 75;
  const strokeWidth = 25;
  const circumference = 2 * Math.PI * radius; // ~471.24
  const center = 105;

  let accumulatedLength = 0;
  const slices = processedServices.map((service, idx) => {
    const fraction = totalBookings > 0 ? service.bookings / totalBookings : 0;
    const arcLength = Math.max(fraction * circumference - (processedServices.length > 1 ? 5 : 0), 0);
    const strokeDasharray = `${arcLength} ${circumference - arcLength}`;
    const strokeDashoffset = -accumulatedLength;
    accumulatedLength += fraction * circumference;
    const percent = totalBookings > 0 ? Math.round(fraction * 100) : 0;

    return {
      ...service,
      idx,
      fraction,
      percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredIdx !== null && slices[hoveredIdx] ? slices[hoveredIdx] : null;

  return (
    <div className={`card-surface p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#1E294B] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center border border-[#BFDBFE]/60">
          <Scissors className="w-4 h-4" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-auto">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-44 h-44 rounded-full border-8 border-slate-100 dark:border-slate-800 animate-pulse flex items-center justify-center">
              <Skeleton className="w-14 h-8 rounded" />
            </div>
            <div className="w-full space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="w-28 h-4 rounded" />
                  <Skeleton className="w-8 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : slices.length === 0 || totalBookings === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-7 h-7 text-[#6B7280] dark:text-[#94A3B8] mb-1.5 stroke-[1.5]" />
            <p className="text-xs font-semibold text-[#29315D] dark:text-[#F8FAFC]">No service bookings yet</p>
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              Service distribution will appear as appointments are completed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            {/* Enlarged Centered Donut Chart SVG */}
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center my-2">
              <svg
                viewBox="0 0 210 210"
                className="w-full h-full transform -rotate-90 select-none overflow-visible"
              >
                {/* Background Ring in Light Grey #F0F2F5 */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-[#F0F2F5] dark:text-[#1C2542]"
                  strokeWidth={strokeWidth}
                />

                {/* Donut Slices with Stable Ring & Smooth Highlight without geometry changes */}
                {slices.map((slice) => {
                  const isHovered = hoveredIdx === slice.idx;
                  const isOtherHovered = hoveredIdx !== null && !isHovered;
                  return (
                    <circle
                      key={slice.idx}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      style={{
                        opacity: isOtherHovered ? 0.45 : 1,
                        filter: isHovered ? 'brightness(1.08)' : 'none',
                      }}
                      className="cursor-pointer transition-opacity duration-200 ease-out"
                      onMouseEnter={() => setHoveredIdx(slice.idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onTouchStart={() => setHoveredIdx(slice.idx)}
                    />
                  );
                })}
              </svg>

              {/* Center Metrics Display - Connected to Data */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3">
                {activeSlice ? (
                  <>
                    <span
                      className="text-3xl font-extrabold tabular-nums tracking-tight transition-all"
                      style={{ color: activeSlice.color }}
                    >
                      {activeSlice.bookings}
                    </span>
                    <span className="text-[11px] font-bold text-[#29315D] dark:text-white truncate max-w-[120px]">
                      {activeSlice.name}
                    </span>
                    <span className="text-[10px] font-semibold text-[#5C9764] dark:text-[#7DB585] uppercase tracking-wider">
                      {activeSlice.percent}% share
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                      {totalBookings}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      Total Visits
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Clean Legend Rows with Service Names, Color Dots and Booking Counts */}
            <div className="w-full space-y-1 mt-3">
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                return (
                  <div
                    key={slice.idx}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                      isHovered
                        ? 'bg-[#EFF4FF] dark:bg-[#1E294B]'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1C2542]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform shadow-2xs"
                        style={{
                          backgroundColor: slice.color,
                          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                        }}
                      ></span>
                      <span
                        className={`text-xs truncate transition-colors ${
                          isHovered
                            ? 'font-bold text-[#0A24E9] dark:text-[#60A5FA]'
                            : 'font-medium text-[#29315D] dark:text-[#E2E8F0]'
                        }`}
                        title={slice.name}
                      >
                        {slice.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold tabular-nums ${isHovered ? 'text-[#0A24E9] dark:text-[#60A5FA]' : 'text-[#29315D] dark:text-[#F8FAFC]'}`}>
                        {slice.bookings}
                      </span>
                      <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] tabular-nums w-7 text-right">
                        {slice.percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-1 border-t border-[#D1D5DB]/50 dark:border-[#252F4E]/60 flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
        <span>Ranked by frequency</span>
        {activeSlice && activeSlice.revenue > 0 ? (
          <span className="font-semibold text-[#10B981] dark:text-[#34D399] tabular-nums">
            Rev: {formatINR(activeSlice.revenue)}
          </span>
        ) : (
          <span>{slices.length} service categories</span>
        )}
      </div>
    </div>
  );
};
