import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Scissors,
  Phone,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Appointment, AppointmentStatus, StaffProfile } from '../../types';

export const StylistDashboard: React.FC = () => {
  const { user, salon, branch } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myStaffProfile, setMyStaffProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [todayDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStylistData();
  }, [branch]);

  const fetchStylistData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch staff profiles to identify this stylist's staff ID
      const staffRes = await api.get<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/');
      const staffList = Array.isArray(staffRes) ? staffRes : staffRes.results || [];
      const currentStaff = staffList.find((s) => s.user === user?.id) || null;
      setMyStaffProfile(currentStaff);

      // 2. Fetch appointments for today
      let url = `/appointments/bookings/?date=${todayDate}`;
      if (currentStaff) {
        url += `&staff=${currentStaff.id}`;
      }
      if (branch) {
        url += `&branch=${branch.id}`;
      }

      const apptRes = await api.get<{ results?: Appointment[] } | Appointment[]>(url);
      const apptList = Array.isArray(apptRes) ? apptRes : apptRes.results || [];

      // Extra client-side filter if backend didn't filter by staff
      const filtered = currentStaff
        ? apptList.filter((a) => a.staff === currentStaff.id || a.staff_details?.user === user?.id)
        : apptList;

      setAppointments(filtered);
    } catch (err) {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setActionLoading(appointmentId);
    try {
      await api.patch(`/appointments/bookings/${appointmentId}/`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
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
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
            Welcome, {user?.first_name || user?.full_name || 'Stylist'}
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] dark:text-[#C4BFD0] mt-1">
            Personal appointment queue and service schedule for today at {salon?.name || 'Ruhi Beauty Salon'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800/60 self-start sm:self-auto shadow-sm">
          <Scissors className="w-3.5 h-3.5" />
          <span>Stylist Workspace · {myStaffProfile?.title || 'Hair & Beauty Specialist'}</span>
        </div>
      </div>

      {/* KPI Cards: Stylist Specific (NO Financials/Revenue) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Today's Clients
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {appointments.length}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
              Scheduled for today ({todayDate})
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              In Service Now
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {inProgressCount}
            </h3>
            <p className="text-xs text-[#D97706] mt-1.5 font-semibold">
              Currently attending client
            </p>
          </div>
        </div>

        {/* Upcoming */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Upcoming Today
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {upcomingCount}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
              Pending client arrivals
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Completed Visits
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {completedCount}
            </h3>
            <p className="text-xs text-[#059669] dark:text-[#10B981] mt-1.5 font-semibold">
              Finished successfully
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Today's Appointments Queue & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Queue */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                My Appointments for Today
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">
                Client schedule and instant service progress updates
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-[#211A32] text-[#64748B] dark:text-[#C4BFD0]">
              {todayDate}
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0]">
              <div className="w-7 h-7 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading your appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0] space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">No appointments assigned today</p>
              <p className="text-[11px]">Enjoy your break or consult the front desk for walk-in clients.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1E1B2E] dark:text-[#F8FAFC]">
                        {appt.customer_details?.full_name || 'Walk-in Client'}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          appt.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981]'
                            : appt.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706]'
                            : 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6]'
                        }`}
                      >
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#64748B] dark:text-[#C4BFD0] text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        {appt.start_time} - {appt.end_time} ({appt.total_duration_minutes} min)
                      </span>
                      {appt.customer_details?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          {appt.customer_details.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Scissors className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#8B5CF6]" />
                      <span className="font-medium text-[#1E1B2E] dark:text-[#F8FAFC]">
                        {appt.items?.map((i) => i.service_name).join(', ') || 'Service treatment'}
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0] italic bg-slate-50 dark:bg-[#211A32] p-1.5 rounded mt-1">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Service</span>
                      </button>
                    )}
                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                        disabled={actionLoading === appt.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors"
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
            <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              Stylist Profile
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">
              Your active station & professional details
            </p>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <div
              className="w-12 h-12 rounded-xl text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0"
              style={{ backgroundColor: myStaffProfile?.color_code || '#6D28D9' }}
            >
              {user?.first_name?.[0] || 'S'}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-[#1E1B2E] dark:text-[#F8FAFC] truncate">
                {user?.full_name || user?.username}
              </h4>
              <p className="text-xs text-[#6D28D9] dark:text-[#8B5CF6] font-semibold">
                {myStaffProfile?.title || 'Hair Stylist'}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0] truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#332A46]">
              <span className="text-[#64748B] dark:text-[#C4BFD0]">Assigned Branch:</span>
              <span className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">
                {branch?.name || myStaffProfile?.branch_name || 'Main Studio'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#332A46]">
              <span className="text-[#64748B] dark:text-[#C4BFD0]">Online Bookable:</span>
              <span className="font-semibold text-[#059669] dark:text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                Active for clients
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#332A46]">
              <span className="text-[#64748B] dark:text-[#C4BFD0]">Commission Tier:</span>
              <span className="font-bold text-[#059669] dark:text-[#10B981]">
                {myStaffProfile?.commission_rate || '15'}%
              </span>
            </div>
          </div>

          {myStaffProfile?.bio && (
            <div className="p-3 bg-slate-50 dark:bg-[#211A32] rounded-lg border border-[var(--border)] text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0] mb-1">
                Bio & Specializations
              </p>
              <p className="text-[#1E1B2E] dark:text-[#F8FAFC] text-[11px]">
                {myStaffProfile.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
