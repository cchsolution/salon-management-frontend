import React, { useState, useId } from 'react';
import { Calendar, AlertCircle, LineChart, BarChart3 } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { Skeleton } from '../ui/Skeleton';
import { RevenueDataPoint } from './RevenueChart';

export interface RevenueAppointmentsChartProps {
  data?: RevenueDataPoint[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  periodLabel?: string;
  selectedDays?: number;
  onDaysChange?: (days: number) => void;
  viewMode?: 'revenue' | 'combined';
  onToggleViewMode?: (mode: 'revenue' | 'combined') => void;
}

export const RevenueAppointmentsChart: React.FC<RevenueAppointmentsChartProps> = ({
  data = [],
  isLoading = false,
  className = '',
  title = 'Revenue & Appointments Combined',
  subtitle = 'Dual-metric volume & financial trends · Indian Rupees (₹)',
  periodLabel,
  selectedDays = 7,
  onDaysChange,
  viewMode = 'combined',
  onToggleViewMode,
}) => {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showBookings, setShowBookings] = useState(true);

  const rawData = data && data.length > 0 ? data : [];
  const chartData = selectedDays && rawData.length > selectedDays ? rawData.slice(-selectedDays) : rawData;
  const totalRevenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalBookings = chartData.reduce((acc, curr) => acc + (curr.appointments || 0), 0);
  const effectivePeriodLabel = periodLabel || `Last ${selectedDays} Days`;

  // SVG Dimensions
  const width = 640;
  const height = 240;
  const marginLeft = 56;
  const marginRight = 44;
  const marginTop = 24;
  const marginBottom = 34;

  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  // Scales
  const rawMaxRev = Math.max(...chartData.map((d) => d.revenue || 0), 0);
  const niceMaxRev = rawMaxRev <= 0 ? 10000 : Math.ceil(rawMaxRev / 4000) * 4000 || 10000;

  const rawMaxBookings = Math.max(...chartData.map((d) => d.appointments || 0), 0);
  const niceMaxBookings = Math.max(Math.ceil(rawMaxBookings / 4) * 4, 4);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const getRevY = (val: number) => {
    const ratio = Math.min(Math.max(val / niceMaxRev, 0), 1);
    return marginTop + innerH - ratio * innerH;
  };

  const getBookingsY = (val: number) => {
    const ratio = Math.min(Math.max(val / niceMaxBookings, 0), 1);
    return marginTop + innerH - ratio * innerH;
  };

  const getX = (idx: number) => {
    if (chartData.length <= 1) return marginLeft + innerW / 2;
    return marginLeft + (idx / (chartData.length - 1)) * innerW;
  };

  const points = chartData.map((d, i) => ({
    x: getX(i),
    yRev: getRevY(d.revenue || 0),
    yBookings: getBookingsY(d.appointments || 0),
    data: d,
  }));

  // Build curved line for revenue
  const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const tension = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      const clamped1 = Math.min(Math.max(cp1y, marginTop - 10), marginTop + innerH);
      const clamped2 = Math.min(Math.max(cp2y, marginTop - 10), marginTop + innerH);

      path += ` C ${cp1x.toFixed(1)} ${clamped1.toFixed(1)}, ${cp2x.toFixed(1)} ${clamped2.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const revLinePts = points.map((p) => ({ x: p.x, y: p.yRev }));
  const revLinePath = points.length > 0 ? buildSmoothPath(revLinePts) : '';
  const revAreaPath =
    points.length > 0
      ? `${revLinePath} L ${points[points.length - 1].x.toFixed(1)} ${(marginTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(marginTop + innerH).toFixed(1)} Z`
      : '';

  const formatCompactK = (val: number): string => {
    if (val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `₹${val}`;
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className={`card-surface p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
              {title}
            </h3>
            {effectivePeriodLabel && (
              <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E294B] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]/60">
                {effectivePeriodLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>

        {/* View Toggle + Metric Visibility */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs self-start sm:self-auto">
          {onDaysChange && (
            <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1C2542] p-1 rounded-xl border border-[#CBD5E1]/60 dark:border-[#252F4E] text-xs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedDays === d
                      ? 'bg-white dark:bg-[#141A2E] text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#29315D]'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}
          {onToggleViewMode && (
            <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1C2542] p-1 rounded-xl border border-[#CBD5E1]/60 dark:border-[#252F4E]">
              <button
                type="button"
                onClick={() => onToggleViewMode('revenue')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'revenue'
                    ? 'bg-white dark:bg-[#141A2E] text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#29315D]'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Trend</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleViewMode('combined')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'combined'
                    ? 'bg-white dark:bg-[#141A2E] text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#29315D]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Combined</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowRevenue(!showRevenue)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showRevenue
                  ? 'bg-[#EEF2FF] text-[#1428F0] border-[#1428F0]/30 dark:bg-[#1E294B] dark:text-[#4D68FF]'
                  : 'bg-transparent text-[#6B7280] border-[#D1D5DB] dark:border-[#252F4E] opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#1428F0]"></span>
              <span>Revenue</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBookings(!showBookings)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showBookings
                  ? 'bg-[#F0FDF4] text-[#5A9D68] border-[#5A9D68]/30 dark:bg-[#142A1D] dark:text-[#7DB585]'
                  : 'bg-transparent text-[#6B7280] border-[#D1D5DB] dark:border-[#252F4E] opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#5A9D68]"></span>
              <span>Bookings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full pt-1">
        {isLoading ? (
          <div className="w-full h-56 flex flex-col justify-between py-2">
            <div className="flex items-end justify-between h-44 gap-3 px-8">
              {[40, 65, 85, 50, 70, 95, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <Skeleton style={{ height: `${h}%` }} className="w-full max-w-[40px] rounded-t-lg" />
                  <Skeleton className="h-3 w-8 rounded mt-2" />
                </div>
              ))}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-56 flex flex-col items-center justify-center text-center p-6 bg-[#F0F2F5]/50 dark:bg-[#141A2E]/50 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#252F4E]">
            <AlertCircle className="w-8 h-8 text-[#6B7280] dark:text-[#94A3B8] mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#29315D] dark:text-[#F8FAFC]">No data recorded for this timeframe</p>
          </div>
        ) : (
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1428F0" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#1428F0" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#1428F0" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines and Left (₹) / Right (Bookings) Y-Axes */}
              {yTicks.map((ratio, i) => {
                const y = marginTop + innerH - ratio * innerH;
                const revVal = ratio * niceMaxRev;
                const bookVal = Math.round(ratio * niceMaxBookings);

                return (
                  <g key={i}>
                    <line
                      x1={marginLeft}
                      y1={y}
                      x2={width - marginRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-[#E5E7EB] dark:text-[#252F4E]"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? undefined : '3 3'}
                    />
                    {/* Left Axis: INR */}
                    {showRevenue && (
                      <text
                        x={marginLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#1428F0] dark:fill-[#4D68FF] text-[10px] font-bold tabular-nums"
                      >
                        {formatCompactK(revVal)}
                      </text>
                    )}
                    {/* Right Axis: Bookings */}
                    {showBookings && (
                      <text
                        x={width - marginRight + 8}
                        y={y + 4}
                        textAnchor="start"
                        className="fill-[#5A9D68] dark:fill-[#7DB585] text-[10px] font-bold tabular-nums"
                      >
                        {bookVal}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Bookings Bars (Behind or Combined) */}
              {showBookings &&
                points.map((pt, i) => {
                  const barW = Math.min(Math.max(innerW / (chartData.length * 2.2), 12), 24);
                  const barH = (pt.data.appointments / niceMaxBookings) * innerH;
                  const barY = marginTop + innerH - barH;
                  const isHovered = hoveredIdx === i;

                  return (
                    <rect
                      key={`bar-${i}`}
                      x={pt.x - barW / 2}
                      y={barY}
                      width={barW}
                      height={Math.max(barH, 2)}
                      rx="4"
                      className={`transition-all duration-150 ${
                        isHovered
                          ? 'fill-[#5A9D68] opacity-90'
                          : 'fill-[#5A9D68]/40 dark:fill-[#5A9D68]/30'
                      }`}
                    />
                  );
                })}

              {/* Revenue Area Fill & Curved Line */}
              {showRevenue && revAreaPath && (
                <path d={revAreaPath} fill={`url(#${gradientId})`} />
              )}
              {showRevenue && revLinePath && (
                <path
                  d={revLinePath}
                  fill="none"
                  stroke="#1428F0"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Active Hover Guide and Dots */}
              {activePoint && (
                <g className="pointer-events-none">
                  <line
                    x1={activePoint.x}
                    y1={marginTop}
                    x2={activePoint.x}
                    y2={marginTop + innerH}
                    stroke="#29315D"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-40 dark:opacity-60"
                  />
                  {showRevenue && (
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.yRev}
                      r="6"
                      className="fill-[#EEF2FF] stroke-[#1428F0]"
                      strokeWidth="2.5"
                    />
                  )}
                </g>
              )}

              {/* X Axis Labels & Hit Targets */}
              {points.map((pt, i) => {
                const label = pt.data.date ? pt.data.date.split(',')[0] : `D${i + 1}`;
                const isHovered = hoveredIdx === i;

                return (
                  <g key={`x-${i}`}>
                    <text
                      x={pt.x}
                      y={marginTop + innerH + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-medium transition-colors ${
                        isHovered
                          ? 'fill-[#29315D] dark:fill-white font-bold'
                          : 'fill-[#6B7280] dark:fill-[#94A3B8]'
                      }`}
                    >
                      {label}
                    </text>
                    <rect
                      x={pt.x - innerW / (chartData.length * 2)}
                      y={marginTop}
                      width={innerW / chartData.length}
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

            {/* Tooltip */}
            {activePoint && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-100 ease-out -top-3 shadow-xl rounded-xl p-2.5 bg-[#29315D] text-white dark:bg-white dark:text-[#29315D] border border-white/10 dark:border-slate-200"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="text-[10px] font-medium text-slate-300 dark:text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#1428F0] dark:text-[#4D68FF]" />
                  <span>{activePoint.data.date || 'Day'}</span>
                </div>
                <div className="text-sm font-extrabold text-[#93C5FD] dark:text-[#1428F0] tabular-nums">
                  Revenue: {formatINR(activePoint.data.revenue)}
                </div>
                <div className="text-xs font-bold text-[#86EFAC] dark:text-[#5A9D68] tabular-nums mt-0.5">
                  Bookings: {activePoint.data.appointments} visits
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#D1D5DB]/50 dark:border-[#252F4E]/60 text-xs text-[#6B7280] dark:text-[#94A3B8]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1428F0]"></span>
            <span>Total: {formatINR(totalRevenue)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5A9D68]"></span>
            <span>Total: {totalBookings} visits</span>
          </div>
        </div>
        <span className="text-[11px] font-medium hidden sm:inline">
          Interactive dual-axis visualization
        </span>
      </div>
    </div>
  );
};

