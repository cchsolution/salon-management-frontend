import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  Calendar,
  Users,
  AlertTriangle,
  Award,
  RefreshCw,
  Clock,
  CalendarCheck,
  Sparkles,
  ArrowUpRight,
  Download,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Appointment } from '../../types';
import { StylistDashboard } from './StylistDashboard';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import { SuperadminDashboard } from './SuperadminDashboard';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatINR } from '../../utils/currency';
import { useDashboardMetrics, useAppointments } from '../../hooks/useQueries';
import {
  DashboardKPICard,
  RevenueChart,
  RevenueAppointmentsChart,
  TopServicesChart,
  WeeklyBookingsChart,
  DashboardSchedule,
  ScheduleAppointment,
} from '../../components/dashboard';

export const OverviewDashboard: React.FC = () => {
  const { user } = useAuth();

  // Role routing
  if (user?.role === 'STYLIST') return <StylistDashboard />;
  if (user?.role === 'RECEPTIONIST') return <ReceptionistDashboard />;
  if (user?.role === 'SUPERADMIN') return <SuperadminDashboard />;

  return <OwnerOverviewDashboard />;
};

const OwnerOverviewDashboard: React.FC = () => {
  const { salon, branch } = useAuth();
  const [chartViewMode, setChartViewMode] = useState<'revenue' | 'combined'>('revenue');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch live metrics
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    error: queryError,
    refetch: refetchMetrics,
  } = useDashboardMetrics(branch?.id);

  // Today's appointments for schedule synchronization
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }, []);
  const {
    data: todayBookings,
    isLoading: isApptsLoading,
    refetch: refetchAppts,
  } = useAppointments({
    date: todayStr,
    branchId: branch?.id,
    enabled: !metrics?.upcoming_appointments || metrics.upcoming_appointments.length === 0,
  });

  const error = queryError ? (queryError as any).message || 'Failed to load live metrics.' : null;

  // Real-time synchronization on appointment lifecycle events
  useEffect(() => {
    const handleApptSync = () => {
      refetchMetrics();
      refetchAppts();
    };
    window.addEventListener('appointment:created', handleApptSync);
    window.addEventListener('appointment:updated', handleApptSync);

    return () => {
      window.removeEventListener('appointment:created', handleApptSync);
      window.removeEventListener('appointment:updated', handleApptSync);
    };
  }, [refetchMetrics, refetchAppts]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMetrics(), refetchAppts()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const summary = metrics?.summary;
  const isCardLoading = isMetricsLoading || !metrics;

  // Map today's schedule from metrics.upcoming_appointments or todayBookings fallback
  const scheduleAppointments: ScheduleAppointment[] = useMemo(() => {
    if (metrics?.upcoming_appointments && metrics.upcoming_appointments.length > 0) {
      return metrics.upcoming_appointments.map((item) => ({
        id: item.id,
        customer_name: item.customer_name || 'Salon Client',
        staff_name: item.staff_name,
        service_name: (item as any).service_name || (item as any).service || 'Hair & Beauty Care',
        date: item.date,
        time: item.time,
        status: item.status,
        amount: item.amount,
      }));
    }

    if (todayBookings && Array.isArray(todayBookings) && todayBookings.length > 0) {
      return todayBookings.map((b: Appointment) => ({
        id: b.id,
        customer_name: b.customer_details?.full_name || 'Salon Client',
        staff_name: b.staff_details?.user_details?.first_name
          ? `${b.staff_details.user_details.first_name} ${b.staff_details.user_details.last_name || ''}`.trim()
          : b.staff_details?.title,
        service_name: b.items && b.items[0] ? b.items[0].service_name : 'Salon Service',
        date: b.date,
        time: b.start_time ? b.start_time.substring(0, 5) : '10:00 AM',
        status: b.status,
        amount: Number(b.total_amount) || 0,
      }));
    }

    return [];
  }, [metrics?.upcoming_appointments, todayBookings]);

  return (
    <div className="space-y-6 sm:space-y-7 page-enter font-sans pb-10">
      {/* Sleek Top Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#252F4E]/60 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
            <span className="font-semibold text-[#0F172A] dark:text-white">{salon?.name || 'Ruhi Beauty Salon'}</span>
            <span>·</span>
            <span>{branch ? branch.name : 'All Active Branches'}</span>
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && !metrics && (
        <div className="p-3.5 text-xs bg-amber-50 dark:bg-amber-950/40 text-[#D97706] rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => handleManualRefresh()}
            className="font-bold text-[#D97706] underline ml-2 cursor-pointer hover:opacity-80"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* TOP ROW: 4 KPI SUMMARY CARDS (Pure White Cards with Light Sky, Light Green, Light Orange, Light Gray Hover Tints) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Today's Revenue (Light Sky Hover) */}
        <DashboardKPICard
          title="Today's Revenue"
          value={formatINR(summary?.today_revenue || 0)}
          icon={IndianRupee}
          hoverVariant="sky"
          trend={{ value: '18.4%', isPositive: true, label: 'vs last period' }}
          isLoading={isCardLoading}
          sublabel={`Total: ${formatINR(summary?.total_revenue || 0)}`}
        />

        {/* Card 2: Today's Bookings (Light Green Hover) */}
        <DashboardKPICard
          title="Today's Bookings"
          value={summary?.today_appointments ?? 0}
          icon={Calendar}
          hoverVariant="green"
          trend={{ value: '12.5%', isPositive: true, label: 'vs last period' }}
          isLoading={isCardLoading}
          sublabel={`${summary?.completed_today ?? 0} completed · ${summary?.pending_today ?? 0} upcoming`}
        />

        {/* Card 3: Active Clients (Light Orange Hover) */}
        <DashboardKPICard
          title="Active Clients"
          value={summary?.total_clients ?? 0}
          icon={Users}
          hoverVariant="orange"
          trend={{ value: '8.4%', isPositive: true, label: 'vs last period' }}
          isLoading={isCardLoading}
          sublabel={`+${summary?.new_clients_this_month ?? 0} new this month`}
        />

        {/* Card 4: Inventory Alerts (Light Gray Hover) */}
        <DashboardKPICard
          title="Inventory Alerts"
          value={summary?.low_stock_count ?? 0}
          icon={AlertTriangle}
          hoverVariant="gray"
          isLoading={isCardLoading}
          sublabel={
            summary && summary.low_stock_count > 0
              ? 'Items below reorder point'
              : 'All stock levels optimal'
          }
        />
      </div>

      {/* ROW 2 (HERO ANALYTICS): Revenue Overview (2/3 width) + Top Services Donut (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Revenue Overview Line/Area Chart */}
        <div className="lg:col-span-2">
          {chartViewMode === 'revenue' ? (
            <RevenueChart
              data={metrics?.revenue_chart || []}
              isLoading={isMetricsLoading}
              title="Revenue Overview"
              subtitle="Last 7 days performance · Indian Rupees (₹)"
              periodLabel="Last 7 Days"
              viewMode={chartViewMode}
              onToggleViewMode={setChartViewMode}
              className="h-full"
            />
          ) : (
            <RevenueAppointmentsChart
              data={metrics?.revenue_chart || []}
              isLoading={isMetricsLoading}
              title="Revenue & Bookings Combined"
              subtitle="Dual-axis financial & visit volume correlation"
              periodLabel="Last 7 Days"
              viewMode={chartViewMode}
              onToggleViewMode={setChartViewMode}
              className="h-full"
            />
          )}
        </div>

        {/* Top Services Donut Chart - Enlarged Proportions */}
        <div className="lg:col-span-1">
          <TopServicesChart
            data={metrics?.popular_services || []}
            isLoading={isMetricsLoading}
            title="Top Services"
            subtitle="Bookings by service frequency"
            className="h-full"
          />
        </div>
      </div>

      {/* ROW 3: Weekly Bookings (1/2 width) + Today's Schedule (1/2 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <WeeklyBookingsChart
          data={metrics?.revenue_chart || []}
          isLoading={isMetricsLoading}
          title="Weekly Bookings"
          subtitle="Last 7 days appointment volume"
          className="h-full"
        />

        <DashboardSchedule
          appointments={scheduleAppointments}
          isLoading={isMetricsLoading && isApptsLoading}
          title="Today's Schedule"
          subtitle={`${scheduleAppointments.length} appointment${scheduleAppointments.length === 1 ? '' : 's'}`}
          className="h-full"
        />
      </div>

      {/* ROW 4: SUPPORTING OPERATIONAL DETAILS (Team Performance & Recent POS Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Staff Performance & Commissions */}
        <div className="card-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  Staff Performance & Commissions
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Calculated according to stylist commission tiers
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-[#1E294B] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold border border-[#BFDBFE]/60">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] dark:divide-[#252F4E]/60">
              {isCardLoading ? (
                <div className="space-y-3 py-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : metrics?.staff_performance && metrics.staff_performance.length > 0 ? (
                metrics.staff_performance.map((staff) => (
                  <div key={staff.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{staff.name}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {staff.title} · {staff.appointments_count} visits completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                        {formatINR(staff.revenue_generated || 0)}
                      </p>
                      <p className="text-[11px] text-[#059669] dark:text-[#34D399] font-semibold tabular-nums">
                        Comm: {formatINR(staff.commission_earned || 0)} ({staff.commission_rate}%)
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-8 text-center">
                  No staff activity records found for this branch.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 text-[11px] text-[#64748B] dark:text-[#94A3B8] flex justify-between items-center">
            <span>Branch Team Metrics</span>
            <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              {metrics?.staff_performance?.length || 0} active stylists
            </span>
          </div>
        </div>

        {/* Recent POS Transactions */}
        <div className="card-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  Recent POS Transactions
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Latest settled customer bills in Indian Rupees (₹)
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] dark:bg-[#142A1D] text-[#059669] dark:text-[#34D399] flex items-center justify-center font-bold border border-[#A7F3D0]/60">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] dark:divide-[#252F4E]/60">
              {isCardLoading ? (
                <div className="space-y-3 py-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : metrics?.recent_transactions && metrics.recent_transactions.length > 0 ? (
                metrics.recent_transactions.map((txn) => (
                  <div key={txn.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{txn.invoice_number}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {txn.customer_name} · {txn.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                        {formatINR(txn.amount || 0)}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          txn.status === 'PAID'
                            ? 'bg-[#ECFDF5] dark:bg-[#142A1D] text-[#059669] dark:text-[#34D399] border border-[#A7F3D0]/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706] border border-amber-200'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-8 text-center">
                  No settled transactions recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 text-[11px] text-[#64748B] dark:text-[#94A3B8] flex justify-between items-center">
            <span>POS Billing Engine</span>
            <span className="font-semibold text-[#059669] dark:text-[#34D399]">
              Real-time settlement sync
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
