import React, { useState, useEffect } from 'react';
import { Download, IndianRupee } from 'lucide-react';
import { api, API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardMetrics } from '../../types';

export const AnalyticsReportsPage: React.FC = () => {
  const { salon, branch } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [branch]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const url = branch ? `/analytics/metrics/?branch=${branch.id}` : '/analytics/metrics/';
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

    
    // Trigger download with auth header
    fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
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
    <div className="space-y-6">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv('invoices')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('staff_commission')}
            className="btn-primary"
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
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            Loading analytics metrics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] uppercase tracking-wider font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Completed Appointments</th>
                  <th className="py-3 px-4">Revenue Generated</th>
                  <th className="py-3 px-4">Commission Rate</th>
                  <th className="py-3 px-4 text-right">Commission Earned</th>
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
