import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Calendar,
  Users,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardMetrics } from '../../types';
import { StylistDashboard } from './StylistDashboard';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import { SuperadminDashboard } from './SuperadminDashboard';
import { Skeleton } from '../../components/ui/Skeleton';

// Client-side cache for loaded metrics to eliminate skeleton flicker on tab switching
const metricsCache = new Map<string, DashboardMetrics>();

export const OverviewDashboard: React.FC = () => {
  const { user } = useAuth();

  // Route to dedicated role dashboards
  if (user?.role === 'STYLIST') {
    return <StylistDashboard />;
  }

  if (user?.role === 'RECEPTIONIST') {
    return <ReceptionistDashboard />;
  }

  if (user?.role === 'SUPERADMIN') {
    return <SuperadminDashboard />;
  }

  // Salon Owner / Manager Dashboard
  return <OwnerOverviewDashboard />;
};

const OwnerOverviewDashboard: React.FC = () => {
  const { salon, branch, branches } = useAuth();
  const cacheKey = branch?.id || 'default';

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => metricsCache.get(cacheKey) || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !metricsCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If branches are configured or available, wait until active branch is hydrated
    if (branches.length > 0 && !branch) {
      return;
    }

    const controller = new AbortController();
    const currentKey = branch?.id || 'default';

    const fetchMetrics = async () => {
      // If we don't have cached data for this branch, show local card loading
      if (!metricsCache.has(currentKey)) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const url = branch?.id ? `/analytics/metrics/?branch=${branch.id}` : '/analytics/metrics/';
        const data = await api.get<DashboardMetrics>(url, {
          signal: controller.signal,
        });

        metricsCache.set(currentKey, data);
        setMetrics(data);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Failed to load live metrics.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    return () => {
      controller.abort();
    };
  }, [branch?.id]);

  const summary = metrics?.summary;
  const isCardLoading = isLoading || !metrics;

  return (
    <div className="space-y-6 sm:space-y-8 page-enter">
      {/* Page Title & Status — ALWAYS renders instantly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
            Welcome, {salon?.name || 'Ruhi Beauty Salon'}
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] dark:text-[#C4BFD0] mt-1">
            Real-time business performance across {branch ? branch.name : 'all branches in Gujarat'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          Live Studio Performance
        </div>
      </div>

      {error && !metrics && (
        <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/40 text-[#D97706] rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              metricsCache.delete(cacheKey);
              setIsLoading(true);
              const url = branch?.id ? `/analytics/metrics/?branch=${branch.id}` : '/analytics/metrics/';
              api.get<DashboardMetrics>(url).then((d) => {
                metricsCache.set(cacheKey, d);
                setMetrics(d);
                setError(null);
              }).catch((e) => {
                setError(e?.message || 'Failed to reload metrics.');
              }).finally(() => setIsLoading(false));
            }}
            className="font-bold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue — Purple Accent */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isCardLoading || !summary ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-7 w-28 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                  ₹{Number(summary.today_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5 flex items-center gap-1.5">
                  <span className="text-[#059669] dark:text-[#10B981] font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    Total: ₹{Number(summary.total_revenue || 0).toLocaleString('en-IN')}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Today's Bookings — Green Accent */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Today's Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isCardLoading || !summary ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-3.5 w-36 rounded" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                  {summary.today_appointments}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
                  <span className="text-[#059669] dark:text-[#10B981] font-semibold">{summary.completed_today}</span> completed · {summary.pending_today} upcoming
                </p>
              </>
            )}
          </div>
        </div>

        {/* Active Customers — Purple/Blue Accent */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Active Clients
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isCardLoading || !summary ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                  {summary.total_clients}
                </h3>
                <p className="text-xs text-[#059669] dark:text-[#10B981] mt-1.5 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#6D28D9] dark:text-[#8B5CF6]" />
                  +{summary.new_clients_this_month} new this month
                </p>
              </>
            )}
          </div>
        </div>

        {/* Stock Alert — Warning only when relevant */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Inventory Status
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                summary && summary.low_stock_count > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706]'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isCardLoading || !summary ? (
              <div className="space-y-2 pt-1">
                <Skeleton className="h-7 w-14 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                  {summary.low_stock_count}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
                  {summary.low_stock_count > 0 ? (
                    <span className="text-[#D97706] font-semibold">Items below reorder point</span>
                  ) : (
                    <span className="text-[#059669] dark:text-[#10B981]">All stock levels optimal</span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart & Popular Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                Revenue & Appointments (7 Days)
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">Financial trends from completed visits</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#6D28D9] dark:bg-[#8B5CF6]"></span>
                <span className="text-[#64748B] dark:text-[#C4BFD0]">Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#059669] dark:bg-[#10B981]"></span>
                <span className="text-[#64748B] dark:text-[#C4BFD0]">Appointments</span>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-[#E2E8F0] dark:border-[#332A46]">
            {isCardLoading || !metrics?.revenue_chart ? (
              <div className="w-full h-full flex items-end gap-2 sm:gap-4 pb-2">
                {[35, 60, 80, 45, 70, 90, 55].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                    <Skeleton
                      style={{ height: `${h}%` }}
                      className="w-full max-w-[42px] rounded-t-md"
                    />
                    <Skeleton className="h-3 w-8 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : metrics.revenue_chart.length > 0 ? (
              metrics.revenue_chart.map((day, idx) => {
                const maxRev = Math.max(...metrics.revenue_chart.map((d) => d.revenue), 100);
                const heightPercent = Math.max(Math.round((day.revenue / maxRev) * 100), 10);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E1B2E] text-white dark:bg-white dark:text-[#1E1B2E] text-[10px] font-semibold py-1.5 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                      ₹{day.revenue.toLocaleString('en-IN')} · {day.appointments} bookings
                    </div>
                    {/* Bar — Deep Purple with Light Purple gradient */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-[#6D28D9] to-[#8B5CF6] dark:from-[#5B21B6] dark:to-[#A78BFA] rounded-t-md group-hover:opacity-90 transition-all shadow-sm"
                    ></div>
                    <span className="text-[11px] font-medium text-[#64748B] dark:text-[#C4BFD0] mt-2 truncate w-full text-center">
                      {day.date.split(',')[0]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full flex items-center justify-center text-xs text-[#64748B] dark:text-[#C4BFD0]">
                No revenue records in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Most Popular Services */}
        <div className="card-surface p-6">
          <div className="mb-4">
            <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              Top Booked Services
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">Ranked by client frequency</p>
          </div>
          <div className="space-y-3.5">
            {isCardLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : metrics?.popular_services && metrics.popular_services.length > 0 ? (
              metrics.popular_services.map((svc, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-[#8B5CF6] font-bold flex items-center justify-center text-[10px] shrink-0 border border-purple-200 dark:border-purple-800">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC] truncate max-w-[130px] sm:max-w-[160px]">
                        {svc.name}
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#C4BFD0]">{svc.bookings} appointments</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#059669] dark:text-[#10B981] shrink-0">₹{svc.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] py-6 text-center">No service data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Staff Workload & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                Staff Performance & Commissions
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">Calculated according to stylist commission tier</p>
            </div>
            <Award className="w-5 h-5 text-[#6D28D9] dark:text-[#8B5CF6]" />
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
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
                    <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">{staff.name}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0]">
                      {staff.title} · {staff.appointments_count} visits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">₹{Number(staff.revenue_generated || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-[#059669] dark:text-[#10B981] font-semibold">
                      Comm: ₹{Number(staff.commission_earned || 0).toLocaleString('en-IN')} ({staff.commission_rate}%)
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] py-4 text-center">No staff records yet.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                Recent POS Transactions
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">Latest settled customer bills (Rupees)</p>
            </div>
            <IndianRupee className="w-5 h-5 text-[#059669] dark:text-[#10B981]" />
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
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
                    <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">{txn.invoice_number}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0]">{txn.customer_name} · {txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">₹{Number(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        txn.status === 'PAID'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981]'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706]'
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] py-4 text-center">No recent transactions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
