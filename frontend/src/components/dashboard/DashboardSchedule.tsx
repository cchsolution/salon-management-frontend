import React from 'react';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import { formatINR } from '../../utils/currency';

export interface ScheduleAppointment {
  id: string;
  customer_name: string;
  staff_name?: string;
  service_name?: string;
  date: string;
  time: string;
  status: string;
  amount?: number;
}

export interface DashboardScheduleProps {
  appointments?: ScheduleAppointment[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  onAppointmentClick?: (appointment: ScheduleAppointment) => void;
}

const getStatusBadge = (status: string) => {
  const norm = (status || '').toUpperCase();
  switch (norm) {
    case 'COMPLETED':
      return {
        label: 'completed',
        bg: 'bg-[#ECFDF5] dark:bg-[#142A1D]',
        text: 'text-[#059669] dark:text-[#34D399]',
        border: 'border-[#A7F3D0]/70 dark:border-[#10B981]/40',
      };
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return {
        label: 'in progress',
        bg: 'bg-[#F5F3FF] dark:bg-[#2A1E4B]',
        text: 'text-[#7C3AED] dark:text-[#C084FC]',
        border: 'border-[#DDD6FE]/70 dark:border-[#7C3AED]/40',
      };
    case 'CONFIRMED':
      return {
        label: 'confirmed',
        bg: 'bg-[#EFF6FF] dark:bg-[#1E294B]',
        text: 'text-[#2563EB] dark:text-[#60A5FA]',
        border: 'border-[#BFDBFE]/70 dark:border-[#2563EB]/40',
      };
    case 'CANCELLED':
      return {
        label: 'cancelled',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
      };
    case 'PENDING':
    default:
      return {
        label: 'pending',
        bg: 'bg-[#FFFBEB] dark:bg-amber-950/40',
        text: 'text-[#D97706] dark:text-[#FBBF24]',
        border: 'border-[#FDE68A]/70 dark:border-amber-800/50',
      };
  }
};

const getInitials = (name: string): string => {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 1).toUpperCase();
};

export const DashboardSchedule: React.FC<DashboardScheduleProps> = ({
  appointments = [],
  isLoading = false,
  className = '',
  title = "Today's Schedule",
  subtitle,
  onAppointmentClick,
}) => {
  const count = appointments.length;
  const countLabel = `${count} appointment${count === 1 ? '' : 's'}`;

  return (
    <div className={`card-surface p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
            {subtitle || countLabel}
          </p>
        </div>

        <Link
          to="/dashboard/appointments"
          className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Appointment Rows Area */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="w-28 h-4 rounded" />
                    <Skeleton className="w-36 h-3 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="w-12 h-3.5 rounded ml-auto" />
                  <Skeleton className="w-16 h-5 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center bg-[#F8FAFC]/60 dark:bg-[#141A2E]/40 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#252F4E] p-5">
            <Calendar className="w-7 h-7 text-[#64748B] dark:text-[#94A3B8] mb-1.5 stroke-[1.5]" />
            <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
              No appointments scheduled for today
            </p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 mb-2.5">
              Bookings will automatically appear here once scheduled.
            </p>
            <Link
              to="/dashboard/appointments"
              className="btn-primary btn-sm text-xs font-semibold"
            >
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {appointments.map((appt, idx) => {
              const badge = getStatusBadge(appt.status);
              const initial = getInitials(appt.customer_name);
              const serviceTitle = appt.service_name || 'Salon Treatment';

              return (
                <div
                  key={appt.id || idx}
                  onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-[#E2E8F0] dark:border-[#252F4E]/60 bg-[#F8FAFC]/50 dark:bg-[#182038] hover:border-[#2563EB]/40 hover:bg-white dark:hover:bg-[#1C2542] hover:shadow-2xs transition-all ${
                    onAppointmentClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Left: Soft amber initial avatar + Service & Client */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] dark:bg-amber-950/60 dark:text-[#FBBF24] flex items-center justify-center font-bold text-xs shrink-0 select-none border border-[#FDE68A]/80">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {serviceTitle}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                        {appt.customer_name || 'Client'}
                        {appt.staff_name && (
                          <span className="text-slate-400 dark:text-slate-500">
                            {' '}· {appt.staff_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Time on top, Badge underneath */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      {appt.time || '10:00'}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          <span>Live calendar stream</span>
        </span>
        <span className="font-medium text-[#111827] dark:text-slate-300">
          {count} booked visits
        </span>
      </div>
    </div>
  );
};
