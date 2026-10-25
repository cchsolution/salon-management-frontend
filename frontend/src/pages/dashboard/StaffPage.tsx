import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StaffProfile } from '../../types';

export const StaffPage: React.FC = () => {
  const { branch } = useAuth();
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [branch]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ results?: StaffProfile[] } | StaffProfile[]>('/staff/');
      const list = Array.isArray(res) ? res : res.results || [];
      setStaffList(list);
    } catch {
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Salon Stylists & Staff
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage your team of certified hair stylists, beauticians, shifts, and commission rates in Gujarat.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="card-surface p-12 text-center text-xs text-[var(--text-secondary)]">
          <div className="w-8 h-8 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading team members...
        </div>
      ) : staffList.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-[var(--text-secondary)]">
          No staff members found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((stf) => (
            <div
              key={stf.id}
              className="card-surface p-6 hover:border-[#6D28D9]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-base shadow-sm border border-[var(--border)]"
                    style={{ backgroundColor: stf.color_code || '#6D28D9' }}
                  >
                    {stf.user_details?.first_name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                      {stf.user_details?.full_name || stf.title}
                    </h3>
                    <p className="text-xs text-[#6D28D9] dark:text-[#8B5CF6] font-semibold">{stf.title}</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3 line-clamp-3">
                  {stf.bio || 'Professional team member providing bespoke salon treatments.'}
                </p>

                <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl space-y-1.5 text-xs text-[var(--text-primary)] border border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Commission Rate:</span>
                    <span className="font-bold text-[#059669] dark:text-[#10B981]">{stf.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Branch Assignment:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{stf.branch_name || 'Himmatnagar & Ahmedabad'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Online Bookable:</span>
                    <span className={`font-semibold ${stf.is_bookable ? 'text-[#059669] dark:text-[#10B981]' : 'text-[var(--text-secondary)]'}`}>
                      {stf.is_bookable ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Stylist Accent:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-[var(--border)]" style={{ backgroundColor: stf.color_code || '#6D28D9' }}></span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">{stf.color_code || '#6D28D9'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
