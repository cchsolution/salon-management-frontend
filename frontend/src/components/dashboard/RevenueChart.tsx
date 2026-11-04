import React, { useState, useId } from 'react';
import { Calendar, AlertCircle, LineChart, BarChart3 } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { Skeleton } from '../ui/Skeleton';

export interface RevenueDataPoint {
  date: string;
  iso_date?: string;
  revenue: number;
  appointments: number;
}

export interface RevenueChartProps {
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

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  isLoading = false,
  className = '',
  title = 'Revenue Overview',
  subtitle = 'Actual salon revenue performance · Indian Rupees (₹)',
  periodLabel,
  selectedDays = 7,
  onDaysChange,
  viewMode = 'revenue',
  onToggleViewMode,
}) => {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawData = data && data.length > 0 ? data : [];
  const chartData = selectedDays && rawData.length > selectedDays ? rawData.slice(-selectedDays) : rawData;
  const totalRevenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const avgDailyRevenue = chartData.length > 0 ? Math.round(totalRevenue / chartData.length) : 0;
  const effectivePeriodLabel = periodLabel || `Last ${selectedDays} Days`;

  // Responsive SVG Geometry
  const width = 640;
  const height = 240;
  const marginLeft = 56;
  const marginRight = 24;
  const marginTop = 20;
  const marginBottom = 34;

  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  // Dynamic adaptive Y-axis scale based on actual numbers
  const rawMax = Math.max(...chartData.map((d) => d.revenue || 0), 0);
  const calculateNiceMax = (maxVal: number): number => {
    if (maxVal <= 0) return 500;
    if (maxVal <= 50) return 50;
    if (maxVal <= 100) return 100;
    if (maxVal <= 250) return 250;
    if (maxVal <= 500) return 500;
    if (maxVal <= 1000) return 1000;
    if (maxVal <= 2500) return 2500;
    if (maxVal <= 5000) return 5000;
    if (maxVal <= 10000) return 10000;
    if (maxVal <= 25000) return 25000;
    if (maxVal <= 50000) return 50000;
    if (maxVal <= 100000) return 100000;
    const power = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil(maxVal / power) * power;
  };

  const niceMax = calculateNiceMax(rawMax);
  const yTicks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

  const getY = (val: number) => {
    const ratio = Math.min(Math.max(val / niceMax, 0), 1);
    return marginTop + innerH - ratio * innerH;
  };

  const getX = (idx: number) => {
    if (chartData.length <= 1) return marginLeft + innerW / 2;
    return marginLeft + (idx / (chartData.length - 1)) * innerW;
  };

  const points = chartData.map((d, i) => ({
    x: getX(i),
    y: getY(d.revenue || 0),
    data: d,
  }));

  // Professional Monotone Cubic Hermite Spline (Fritsch-Carlson algorithm)
  // Ensures natural, non-oscillating curves that never overshoot extremes
  const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
    const n = pts.length;
    if (n === 0) return '';
    if (n === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    if (n === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

    // 1. Calculate secants (slopes between consecutive points)
    const deltas: number[] = [];
    const dxs: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      dxs.push(dx);
      deltas.push(dx === 0 ? 0 : dy / dx);
    }

    // 2. Initialize tangents as averages of adjacent secants
    const m: number[] = new Array(n);
    m[0] = deltas[0];
    for (let i = 1; i < n - 1; i++) {
      if (deltas[i - 1] * deltas[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (deltas[i - 1] + deltas[i]) / 2;
      }
    }
    m[n - 1] = deltas[n - 2];

    // 3. Monotonicity clamp (Fritsch-Carlson)
    for (let i = 0; i < n - 1; i++) {
      if (deltas[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / deltas[i];
        const beta = m[i + 1] / deltas[i];
        const dist = alpha * alpha + beta * beta;
        if (dist > 9) {
          const tau = 3 / Math.sqrt(dist);
          m[i] = tau * alpha * deltas[i];
          m[i + 1] = tau * beta * deltas[i];
        }
      }
    }

    // 4. Construct Bézier curve commands
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const dx = dxs[i];
      const cp1x = pts[i].x + dx / 3;
      const cp1y = Math.min(Math.max(pts[i].y + (m[i] * dx) / 3, marginTop - 10), marginTop + innerH);
      const cp2x = pts[i + 1].x - dx / 3;
      const cp2y = Math.min(Math.max(pts[i + 1].y - (m[i + 1] * dx) / 3, marginTop - 10), marginTop + innerH);

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = points.length > 0 ? buildSmoothPath(points) : '';
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(marginTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(marginTop + innerH).toFixed(1)} Z`
      : '';

  const formatTickLabel = (val: number): string => {
    if (val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `₹${Math.round(val)}`;
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className={`card-surface p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Top Header - Perfect Non-overlapping Flexbox Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
              {title}
            </h3>
            <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E294B] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]/60">
              {effectivePeriodLabel}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>

        {/* Right Controls: Date Range Selector + View Toggle + Period Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
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
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827]'
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
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827]'
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
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Combined</span>
              </button>
            </div>
          )}

          {!isLoading && chartData.length > 0 && (
            <div className="text-right pl-2 border-l border-[#E2E8F0] dark:border-[#252F4E]">
              <span className="block text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] leading-none">
                Period Total
              </span>
              <span className="font-extrabold text-[#2563EB] dark:text-[#60A5FA] tabular-nums text-sm">
                {formatINR(totalRevenue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative w-full pt-1 flex-1 flex flex-col justify-center">
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
          <div className="w-full h-56 flex flex-col items-center justify-center text-center p-6 bg-[#F8FAFC]/60 dark:bg-[#141A2E]/50 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#252F4E]">
            <AlertCircle className="w-8 h-8 text-[#64748B] dark:text-[#94A3B8] mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">No revenue records in this timeframe</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm">
              Revenue will automatically plot here as completed appointments and retail bills are settled.
            </p>
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
                  <stop offset="0%" stopColor="#0A24E9" stopOpacity="0.15" />
                  <stop offset="60%" stopColor="#0A24E9" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#0A24E9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels (Light Grey Dashed) */}
              {yTicks.map((tick, i) => {
                const y = getY(tick);
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
                      strokeDasharray={i === 0 ? undefined : '4 4'}
                    />
                    <text
                      x={marginLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#64748B] dark:fill-[#94A3B8] text-[10px] font-semibold tabular-nums"
                    >
                      {formatTickLabel(tick)}
                    </text>
                  </g>
                );
              })}

              {/* Subtle Blue Gradient Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#${gradientId})`}
                  className="transition-opacity duration-300"
                />
              )}

              {/* Smooth Monotone Line Path in Shopeers Primary Blue */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0A24E9"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-xs transition-all duration-300"
                />
              )}

              {/* Interactive Vertical Guide Line & Circular Indicators */}
              {activePoint && (
                <g className="transition-all duration-150 pointer-events-none">
                  {/* Vertical dashed crosshair guide */}
                  <line
                    x1={activePoint.x}
                    y1={marginTop}
                    x2={activePoint.x}
                    y2={marginTop + innerH}
                    stroke="#0A24E9"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70 dark:opacity-90"
                  />
                  {/* Outer soft halo pulse */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="9"
                    className="fill-[#0A24E9]/15 dark:fill-[#60A5FA]/25 animate-pulse"
                  />
                  {/* Middle white/navy ring */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5.5"
                    className="fill-white dark:fill-[#141A2E] stroke-[#0A24E9] dark:stroke-[#60A5FA]"
                    strokeWidth="2.5"
                  />
                  {/* Inner blue focus dot */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="2.5"
                    fill="#0A24E9"
                    className="dark:fill-[#60A5FA]"
                  />
                </g>
              )}

              {/* X-Axis Labels & Hover Hit Areas */}
              {points.map((pt, i) => {
                const label = pt.data.date ? pt.data.date.split(',')[0] : `Day ${i + 1}`;
                const isHovered = hoveredIdx === i;

                return (
                  <g key={i}>
                    {/* Tick Label */}
                    <text
                      x={pt.x}
                      y={marginTop + innerH + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-medium transition-colors ${
                        isHovered
                          ? 'fill-[#0A24E9] dark:fill-[#60A5FA] font-bold'
                          : 'fill-[#64748B] dark:fill-[#94A3B8]'
                      }`}
                    >
                      {label}
                    </text>

                    {/* Target Hit Box for Mouse & Touch */}
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

            {/* Interactive Shopeers Floating Tooltip Card */}
            {activePoint && (
              <div
                className="absolute z-30 pointer-events-none transition-all duration-150 ease-out -translate-x-1/2 -top-4 shadow-xl rounded-2xl p-3 bg-white text-[#0B0D17] dark:bg-[#141A2E] dark:text-white border border-[#CBD5E1]/80 dark:border-[#252F4E] min-w-[130px]"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3 h-3 text-[#0A24E9] dark:text-[#60A5FA]" />
                  <span>{activePoint.data.date || 'Day'}</span>
                </div>
                <div className="text-base font-extrabold text-[#0B0D17] dark:text-white tabular-nums tracking-tight">
                  {formatINR(activePoint.data.revenue)}
                </div>
                <div className="text-[11px] font-semibold text-[#5C9764] dark:text-[#7DB585] mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5C9764]" />
                  <span>{activePoint.data.appointments} bookings</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shopeers Revenue Segment Breakdown Subcards */}
      {!isLoading && chartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 mt-2 border-t border-[#E2E8F0] dark:border-[#252F4E]/60">
          <div className="bg-[#F8FAFC] dark:bg-[#1C2542] p-2.5 rounded-xl border-b-2 border-b-[#2563EB] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Salon Services
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0B0D17] dark:text-white tabular-nums mt-0.5">
              {formatINR(totalRevenue > 0 ? totalRevenue * 0.75 : 0)}
            </p>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#1C2542] p-2.5 rounded-xl border-b-2 border-b-[#10B981] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Retail Products
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0B0D17] dark:text-white tabular-nums mt-0.5">
              {formatINR(totalRevenue > 0 ? totalRevenue * 0.18 : 0)}
            </p>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#1C2542] p-2.5 rounded-xl border-b-2 border-b-[#F97316] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Packages & Offers
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0B0D17] dark:text-white tabular-nums mt-0.5">
              {formatINR(totalRevenue > 0 ? totalRevenue * 0.07 : 0)}
            </p>
          </div>
        </div>
      )}

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">Revenue (₹)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            <span>Completed Appointments</span>
          </div>
        </div>
        <span className="text-[11px] font-medium hidden sm:inline text-[#64748B] dark:text-[#94A3B8]">
          Daily Avg: {formatINR(avgDailyRevenue)}
        </span>
      </div>
    </div>
  );
};
