import React from 'react';
import { StaffProfile } from '../../types';
import { StaffCardSkeleton } from '../../components/ui/Skeleton';
import { useStaff } from '../../hooks/useQueries';

export const StaffPage: React.FC = () => {
  const { data: staffList = [], isLoading } = useStaff();

  return (
    <div className="space-y-6 page-enter font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Salon Stylists & Staff
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Manage your team of certified hair stylists, beauticians, shifts, and commission rates in Gujarat.
          </p>
        </div>
      </div>

      {isLoading ? (
        <StaffCardSkeleton count={6} />
      ) : staffList.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
          No staff members found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((stf) => (
            <div
              key={stf.id}
              className="card-surface p-6 hover:border-[#0A24E9]/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-base shadow-sm border border-[var(--border)] ring-2 ring-white/10"
                    style={{ backgroundColor: stf.color_code || '#0A24E9' }}
                  >
                    {stf.user_details?.first_name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC]">
                      {stf.user_details?.full_name || stf.title}
                    </h3>
                    <p className="text-xs text-[#0A24E9] dark:text-[#4D68FF] font-semibold">{stf.title}</p>
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-3 line-clamp-3">
                  {stf.bio || 'Professional team member providing bespoke salon treatments.'}
                </p>

                <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl space-y-1.5 text-xs text-[var(--text-primary)] border border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Commission Rate:</span>
                    <span className="font-bold text-[#5C9764] dark:text-[#7DB585]">{stf.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Branch Assignment:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{stf.branch_name || 'Himmatnagar & Ahmedabad'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Online Bookable:</span>
                    <span className={`font-semibold ${stf.is_bookable ? 'text-[#5C9764] dark:text-[#7DB585]' : 'text-[var(--text-secondary)]'}`}>
                      {stf.is_bookable ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Stylist Accent:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-[var(--border)] shadow-xs" style={{ backgroundColor: stf.color_code || '#0A24E9' }}></span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">{stf.color_code || '#0A24E9'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
