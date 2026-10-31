import React, { useState, useEffect } from 'react';
import { Download, IndianRupee } from 'lucide-react';
import { api, API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardMetrics } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';

export const AnalyticsReportsPage: React.FC = () => {
  const { salon, branch } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => {
    return (
      api.getCached<DashboardMetrics>(branch?.id ? `/analytics/metrics/?branch=${branch.id}` : '/analytics/metrics/') ||
      api.getCached<DashboardMetrics>('/analytics/metrics/')
    );
  });
  const [isLoading, setIsLoading] = useState(() => !metrics);

  useEffect(() => {
    fetchMetrics();
  }, [branch?.id]);

  const fetchMetrics = async () => {
    if (!metrics) {
      setIsLoading(true);
    }
    try {
      const url = branch?.id ? `/analytics/metrics/?branch=${branch.id}` : '/analytics/metrics/';
      const data = await api.get<DashboardMetrics>(url);
      setMetrics(data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = (type: 'invoices' | 'staff_commission') => {
    const token = localStorage.getItem('luxe_token');
    const slug = salon?.slug || '';
    const url = `${API_BASE}/analytics/export/?type=${type}&salon_slug=${slug}`;

    
    const authHeader = token ? (token.startsWith('Bearer ') || token.startsWith('Token ') ? token : `Bearer ${token}`) : '';
    // Trigger download with auth header
    fetch(url, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `salon_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      });
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Reports & Business Analytics
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Export financial audits, track staff commission payouts, and view branch performance in INR (₹).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExportCsv('invoices')}
            className="btn-outline btn-md"
          >
            <Download className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('staff_commission')}
            className="btn-primary btn-md"
          >
            <Download className="w-4 h-4" />
            <span>Export Commissions CSV</span>
          </button>
        </div>
      </div>

      {/* Staff Commission Audit Table */}
      <div className="card-surface p-6 space-y-4">
        <div>
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
            Staff Commission Breakdown
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Realized earnings computed from completed appointments and billed service items.
          </p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] uppercase tracking-wider font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Completed Appointments</th>
                  <th className="py-3.5 px-4">Revenue Generated</th>
                  <th className="py-3.5 px-4">Commission Rate</th>
                  <th className="py-3.5 px-4 text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {metrics?.staff_performance?.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">{s.name}</td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">{s.title}</td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">{s.branch}</td>
                    <td className="py-3.5 px-4 text-[var(--text-primary)] font-semibold">{s.appointments_count}</td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">₹{Number(s.revenue_generated || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">{s.commission_rate}%</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#059669] dark:text-[#10B981]">
                      ₹{Number(s.commission_earned || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Branch Comparisons */}
      <div className="card-surface p-6 space-y-4">
        <div>
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
            Gujarat Branch Performance Comparison
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Comparative revenue and appointment volume across Himmatnagar & Ahmedabad physical studios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics?.branch_comparison?.map((b) => (
            <div key={b.id} className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex justify-between items-center">
              <div>
                <p className="font-bold text-[var(--text-primary)] text-sm">{b.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{b.city} Studio · {b.appointments} total bookings</p>
              </div>
              <p className="text-lg font-serif font-bold text-[#059669] dark:text-[#10B981]">₹{Number(b.revenue || 0).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
