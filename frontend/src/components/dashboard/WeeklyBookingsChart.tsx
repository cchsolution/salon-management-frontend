import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { formatINR } from '../../utils/currency';

export interface WeeklyBookingItem {
  date: string;
  appointments: number;
  revenue?: number;
}

export interface WeeklyBookingsChartProps {
  data?: WeeklyBookingItem[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const WeeklyBookingsChart: React.FC<WeeklyBookingsChartProps> = ({
  data = [],
  isLoading = false,
  className = '',
  title = 'Weekly Bookings',
  subtitle = 'Last 7 days appointment volume',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = data && data.length > 0 ? data : [];
  const totalBookings = chartData.reduce((acc, curr) => acc + (curr.appointments || 0), 0);
  const avgBookings = chartData.length > 0 ? (totalBookings / chartData.length).toFixed(1) : '0';

  // SVG Geometry
  const width = 540;
  const height = 220;
  const marginLeft = 38;
  const marginRight = 16;
  const marginTop = 24;
  const marginBottom = 34;

  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  // Y-axis scaling: calculate nice steps (multiples of 7 or 4)
  const rawMax = Math.max(...chartData.map((d) => d.appointments || 0), 0);
  const niceMax = rawMax <= 4 ? 8 : Math.ceil(rawMax / 7) * 7 || 14;
  const yTicks = [0, Math.round(niceMax * 0.33), Math.round(niceMax * 0.66), niceMax];

  const getY = (val: number) => {
    const ratio = Math.min(Math.max(val / niceMax, 0), 1);
    return marginTop + innerH - ratio * innerH;
  };

  const barCount = chartData.length || 7;
  const barWidth = Math.min(Math.max(innerW / (barCount * 1.8), 16), 36);

  const getBarX = (idx: number) => {
    const slotW = innerW / barCount;
    return marginLeft + slotW * idx + (slotW - barWidth) / 2;
  };

  const activeItem = hoveredIdx !== null && chartData[hoveredIdx] ? chartData[hoveredIdx] : null;

  // Identify peak / most active day index (Shopeers highlight)
  const peakIdx = chartData.reduce(
    (maxIdx, curr, idx, arr) => ((curr.appointments || 0) > (arr[maxIdx]?.appointments || 0) ? idx : maxIdx),
    0
  );

  return (
    <div className={`card-surface p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
              {title}
            </h3>
            <span className="text-[11px] font-semibold text-[#0A24E9] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E294B] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]/60">
              7 Days
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>

        {!isLoading && chartData.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-left sm:text-right">
              <span className="block text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">
                Total Visits
              </span>
              <span className="font-extrabold text-[#0A24E9] dark:text-[#60A5FA] tabular-nums text-sm">
                {totalBookings}
              </span>
            </div>
            <div className="h-7 w-px bg-[#E2E8F0] dark:bg-[#252F4E] hidden sm:block"></div>
            <div className="text-left sm:text-right hidden sm:block">
              <span className="block text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">
                Avg / Day
              </span>
              <span className="font-bold text-[#29315D] dark:text-[#F8FAFC] tabular-nums text-sm">
                {avgBookings}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full pt-1">
        {isLoading ? (
          <div className="w-full h-48 flex items-end justify-between gap-3 px-6 pb-2">
            {[20, 45, 60, 30, 75, 90, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                <Skeleton style={{ height: `${h}%` }} className="w-full max-w-[32px] rounded-t-lg" />
                <Skeleton className="h-3 w-7 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-48 flex flex-col items-center justify-center text-center p-6 bg-[#F8FAFC]/60 dark:bg-[#141A2E]/50 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#252F4E]">
            <AlertCircle className="w-8 h-8 text-[#64748B] dark:text-[#94A3B8] mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#29315D] dark:text-[#F8FAFC]">No appointment data for this week</p>
          </div>
        ) : (
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Horizontal Grid lines & Y-ticks */}
              {yTicks.map((val, i) => {
                const y = getY(val);
                return (
                  <g key={i}>
                    <line
                      x1={marginLeft}
                      y1={y}
                      x2={width - marginRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-[#E2E8F0] dark:text-[#252F4E]"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={marginLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#64748B] dark:fill-[#94A3B8] text-[10px] font-semibold tabular-nums"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars with rounded pill shape — Shopeers Design: Peak day in Solid Royal Blue */}
              {chartData.map((d, i) => {
                const barX = getBarX(i);
                const count = d.appointments || 0;
                const barH = count > 0 ? (count / niceMax) * innerH : 4;
                const barY = marginTop + innerH - barH;
                const isHovered = hoveredIdx === i;
                const isPeak = i === peakIdx && count > 0;
                const label = d.date ? d.date.split(',')[0] : `D${i + 1}`;

                let barFill = 'fill-[#E2E8F0] dark:fill-[#1E294B]';
                if (isHovered) {
                  barFill = 'fill-[#2563EB] dark:fill-[#60A5FA] filter drop-shadow-sm';
                } else if (isPeak) {
                  barFill = 'fill-[#0A24E9] dark:fill-[#3B82F6]';
                } else if (count > 0) {
                  barFill = 'fill-[#CBD5E1] dark:fill-[#334155]';
                }

                return (
                  <g key={i}>
                    {/* Bar pill rectangle */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="8"
                      className={`transition-all duration-200 cursor-pointer ${barFill}`}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onTouchStart={() => setHoveredIdx(i)}
                    />

                    {/* Value on top of bar — highlighted for peak/hovered */}
                    {count > 0 && (
                      <text
                        x={barX + barWidth / 2}
                        y={Math.max(barY - 7, marginTop + 6)}
                        textAnchor="middle"
                        className={`text-[11px] font-extrabold tabular-nums transition-opacity ${
                          isHovered || isPeak
                            ? 'fill-[#0A24E9] dark:fill-[#60A5FA] opacity-100'
                            : 'fill-[#64748B] dark:fill-[#94A3B8] opacity-75'
                        }`}
                      >
                        {count}
                      </text>
                    )}

                    {/* Weekday Label */}
                    <text
                      x={barX + barWidth / 2}
                      y={marginTop + innerH + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-medium transition-colors ${
                        isHovered
                          ? 'fill-[#059669] dark:fill-[#34D399] font-bold'
                          : 'fill-[#64748B] dark:fill-[#94A3B8]'
                      }`}
                    >
                      {label}
                    </text>

                    {/* Invisible full-height hit area */}
                    <rect
                      x={marginLeft + (innerW / barCount) * i}
                      y={marginTop}
                      width={innerW / barCount}
                      height={innerH + marginBottom}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onTouchStart={() => setHoveredIdx(i)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {activeItem && hoveredIdx !== null && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-100 ease-out -top-2 shadow-xl rounded-xl p-2.5 bg-[#29315D] text-white dark:bg-white dark:text-[#29315D] border border-white/10 dark:border-slate-200"
                style={{
                  left: `${((getBarX(hoveredIdx) + barWidth / 2) / width) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="text-[10px] font-medium text-slate-300 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#34D399]" />
                  <span>{activeItem.date}</span>
                </div>
                <div className="text-sm font-extrabold text-[#34D399] dark:text-[#059669] tabular-nums">
                  {activeItem.appointments} bookings
                </div>
                {activeItem.revenue !== undefined && activeItem.revenue > 0 && (
                  <div className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 tabular-nums mt-0.5">
                    Rev: {formatINR(activeItem.revenue)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0A24E9] dark:bg-[#60A5FA]"></span>
          <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">Client Appointments</span>
        </div>
        <span>Mon–Sun 7-Day Cycle</span>
      </div>
    </div>
  );
};
