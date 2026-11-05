import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  PlayCircle,
  Scissors,
  Phone,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Appointment, AppointmentStatus, StaffProfile } from '../../types';
import { MetricCardSkeleton, AppointmentCardSkeleton } from '../../components/ui/Skeleton';
import { useStaff, useAppointments, useInvalidateQueries } from '../../hooks/useQueries';

export const StylistDashboard: React.FC = () => {
  const { user, salon, branch } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [todayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const { data: staffList = [] } = useStaff(branch?.id);
  const myStaffProfile = React.useMemo(
    () => staffList.find((s) => s.user === user?.id) || null,
    [staffList, user?.id]
  );

  const {
    data: rawAppointments = [],
    isLoading,
    refetch,
  } = useAppointments({
    date: todayDate,
    branchId: branch?.id,
    staffId: myStaffProfile?.id,
  });

  const { invalidateAppointments, invalidateMetrics } = useInvalidateQueries();

  const appointments = React.useMemo(() => {
    if (!myStaffProfile) return rawAppointments;
    return rawAppointments.filter(
      (a) => a.staff === myStaffProfile.id || a.staff_details?.user === user?.id
    );
  }, [rawAppointments, myStaffProfile, user?.id]);

  useEffect(() => {
    const handleSync = () => {
      refetch();
    };
    window.addEventListener('appointment:created', handleSync);
    window.addEventListener('appointment:updated', handleSync);

    return () => {
      window.removeEventListener('appointment:created', handleSync);
      window.removeEventListener('appointment:updated', handleSync);
    };
  }, [refetch]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setActionLoading(appointmentId);
    try {
      await api.patch(`/appointments/bookings/${appointmentId}/`, { status: newStatus });
      invalidateAppointments();
      invalidateMetrics();
      refetch();
    } catch {
      // Silently handle error
    } finally {
      setActionLoading(null);
    }
  };

  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length;

  return (
    <div className="space-y-6 sm:space-y-8 page-enter font-sans">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Welcome, {user?.first_name || user?.full_name || 'Stylist'}
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Personal appointment queue and service schedule for today at {salon?.name || 'Ruhi Beauty Salon'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] px-3.5 py-1.5 rounded-full border border-[#0A24E9]/20 self-start sm:self-auto shadow-xs">
          <Scissors className="w-3.5 h-3.5" />
          <span>Stylist Workspace · {myStaffProfile?.title || 'Hair & Beauty Specialist'}</span>
        </div>
      </div>

      {/* KPI Cards: Stylist Specific (NO Financials/Revenue) */}
      {isLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Today */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Today's Clients
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {appointments.length}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-2">
                Scheduled for today ({todayDate})
              </p>
            </div>
          </div>

          {/* In Progress */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                In Service Now
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {inProgressCount}
              </h3>
              <p className="text-xs text-[#D97706] mt-2 font-semibold">
                Currently attending client
              </p>
            </div>
          </div>

          {/* Upcoming */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Upcoming Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {upcomingCount}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-2">
                Pending client arrivals
              </p>
            </div>
          </div>

          {/* Completed */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Completed Visits
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {completedCount}
              </h3>
              <p className="text-xs text-[#5C9764] dark:text-[#7DB585] mt-2 font-semibold">
                Finished successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Today's Appointments Queue & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Queue */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#29315D] dark:text-[#F8FAFC]">
                My Appointments for Today
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Client schedule and instant service progress updates
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F0F2F5] dark:bg-[#1C2542] text-[#6B7280] dark:text-[#94A3B8]">
              {todayDate}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <AppointmentCardSkeleton count={3} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8] space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">No appointments assigned today</p>
              <p className="text-[11px]">Enjoy your break or consult the front desk for walk-in clients.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/60">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F0F2F5]/60 dark:hover:bg-[#1C2542]/60 rounded-xl px-2.5 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#29315D] dark:text-[#F8FAFC]">
                        {appt.customer_details?.full_name || 'Walk-in Client'}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.status === 'COMPLETED'
                            ? 'bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] border border-[#5C9764]/30'
                            : appt.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706] border border-amber-200'
                            : 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20'
                        }`}
                      >
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#6B7280] dark:text-[#94A3B8] text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                        {appt.start_time} - {appt.end_time} ({appt.total_duration_minutes} min)
                      </span>
                      {appt.customer_details?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#5C9764] dark:text-[#7DB585]" />
                          {appt.customer_details.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Scissors className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                      <span className="font-medium text-[#29315D] dark:text-[#F8FAFC]">
                        {appt.items?.map((i) => i.service_name).join(', ') || 'Service treatment'}
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] italic bg-[#F0F2F5] dark:bg-[#1C2542] p-2 rounded-lg mt-1 border border-[#CACED6]/40 dark:border-[#252F4E]/40">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  {/* Stylist Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'IN_PROGRESS')}
                        disabled={actionLoading === appt.id}
                        className="btn-primary btn-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Service</span>
                      </button>
                    )}
                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                        disabled={actionLoading === appt.id}
                        className="btn-success btn-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stylist Profile & Status Summary Card */}
        <div className="card-surface p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#29315D] dark:text-[#F8FAFC]">
              Stylist Profile
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Your active station & professional details
            </p>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F0F2F5] dark:bg-[#1C2542] border border-[#CACED6]/70 dark:border-[#252F4E]">
            <div
              className="w-12 h-12 rounded-xl text-white font-bold flex items-center justify-center text-lg shadow-xs shrink-0 ring-2 ring-white/10"
              style={{ backgroundColor: myStaffProfile?.color_code || '#0A24E9' }}
            >
              {user?.first_name?.[0] || 'S'}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-[#29315D] dark:text-[#F8FAFC] truncate">
                {user?.full_name || user?.username}
              </h4>
              <p className="text-xs text-[#0A24E9] dark:text-[#4D68FF] font-semibold">
                {myStaffProfile?.title || 'Hair Stylist'}
              </p>
              <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#CACED6]/40 dark:border-[#252F4E]/60">
              <span className="text-[#6B7280] dark:text-[#94A3B8]">Assigned Branch:</span>
              <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                {branch?.name || myStaffProfile?.branch_name || 'Main Studio'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CACED6]/40 dark:border-[#252F4E]/60">
              <span className="text-[#6B7280] dark:text-[#94A3B8]">Online Bookable:</span>
              <span className="font-semibold text-[#5C9764] dark:text-[#7DB585] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C9764] animate-pulse"></span>
                Active for clients
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CACED6]/40 dark:border-[#252F4E]/60">
              <span className="text-[#6B7280] dark:text-[#94A3B8]">Commission Tier:</span>
              <span className="font-bold text-[#5C9764] dark:text-[#7DB585] tabular-nums">
                {myStaffProfile?.commission_rate || '15'}%
              </span>
            </div>
          </div>

          {myStaffProfile?.bio && (
            <div className="p-3 bg-[#F0F2F5] dark:bg-[#1C2542] rounded-xl border border-[#CACED6]/60 dark:border-[#252F4E] text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A9B6C0] dark:text-[#94A3B8] mb-1">
                Bio & Specializations
              </p>
              <p className="text-[#29315D] dark:text-[#F8FAFC] text-[11px]">
                {myStaffProfile.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
