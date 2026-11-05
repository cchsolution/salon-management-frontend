import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Appointment, AppointmentStatus, StaffProfile } from '../../types';
import { QuickBookingModal } from '../../components/QuickBookingModal';
import { AppointmentCardSkeleton } from '../../components/ui/Skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatINR } from '../../utils/currency';
import { formatDuration } from '../../utils/formatDuration';
import { StatusLabel } from '../../components/ui/StatusLabel';
import { useStaff, useAppointments, useInvalidateQueries } from '../../hooks/useQueries';

export const AppointmentCalendarPage: React.FC = () => {
  const { branch, user, salon } = useAuth();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayInSalonTz = useMemo(() => {
    const tz = salon?.timezone || 'Asia/Kolkata';
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, [salon?.timezone]);

  const [selectedDate, setSelectedDate] = useState<string>(todayInSalonTz);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'agenda'>('day');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  const isTodaySelected = selectedDate === todayInSalonTz;

  const { data: staffList = [] } = useStaff(branch?.id);
  const {
    data: appointments = [],
    isLoading,
    refetch: fetchAppointments,
  } = useAppointments({
    date: selectedDate,
    branchId: branch?.id,
    staffId: selectedStaffFilter || undefined,
    status: selectedStatusFilter || undefined,
  });
  const { invalidateAppointments, invalidateMetrics } = useInvalidateQueries();

  // If stylist logged in, default filter to their own staff profile
  useEffect(() => {
    if (user?.role === 'STYLIST' && staffList.length > 0 && !selectedStaffFilter) {
      const found = staffList.find((s) => s.user === user.id);
      if (found) {
        setSelectedStaffFilter(found.id);
      }
    }
  }, [user, staffList, selectedStaffFilter]);

  // Synchronize instantly when appointments are created or modified elsewhere
  useEffect(() => {
    const handleSync = () => {
      fetchAppointments();
    };
    window.addEventListener('appointment:created', handleSync);
    window.addEventListener('appointment:updated', handleSync);
    return () => {
      window.removeEventListener('appointment:created', handleSync);
      window.removeEventListener('appointment:updated', handleSync);
    };
  }, [fetchAppointments]);

  const handleUpdateStatus = async (apptId: string, newStatus: AppointmentStatus) => {
    try {
      await api.post(`/appointments/bookings/${apptId}/update_status/`, {
        status: newStatus,
      });
      invalidateAppointments();
      invalidateMetrics();
      fetchAppointments();
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const statusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#ECFDF5] dark:bg-[#142A1D] text-[#059669] dark:text-[#34D399] rounded-full border border-[#A7F3D0]/70 dark:border-[#10B981]/40">
            Confirmed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EFF6FF] dark:bg-[#1E294B] text-[#2563EB] dark:text-[#60A5FA] rounded-full border border-[#BFDBFE]/70 dark:border-[#2563EB]/40">
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#ECFDF5] dark:bg-[#142A1D] text-[#059669] dark:text-[#34D399] rounded-full border border-[#A7F3D0]/70 dark:border-[#10B981]/40">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800/40">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-[#FBBF24] rounded-full border border-[#FDE68A]/70 dark:border-amber-800/50">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 page-enter font-sans pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Appointment Calendar
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Real-time schedule management for {branch?.name || 'Ahmedabad CG Road Branch'}.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="btn-primary btn-md shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Date Controls & Filters Card — Responsive & Non-overlapping */}
      <div className="card-surface p-3.5 sm:p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Stepper Group */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => changeDateBy(-1)}
            aria-label="Previous day"
            className="p-2 border border-[#CBD5E1] dark:border-[#252F4E] hover:bg-[#F1F5F9] dark:hover:bg-[#1C2542] rounded-xl text-[#64748B] dark:text-[#94A3B8] transition-colors active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Entire Clickable Calendar Button with Single Icon (Phase 6.1) */}
          <div
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="relative flex items-center gap-2 bg-white dark:bg-[#141A2E] border border-[#CBD5E1] dark:border-[#252F4E] hover:border-[#2563EB]/50 rounded-xl px-3 py-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-[#29315D] dark:text-[#F8FAFC] bg-transparent focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <button
            onClick={() => changeDateBy(1)}
            aria-label="Next day"
            className="p-2 border border-[#CBD5E1] dark:border-[#252F4E] hover:bg-[#F1F5F9] dark:hover:bg-[#1C2542] rounded-xl text-[#64748B] dark:text-[#94A3B8] transition-colors active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Today Button Highlighted ONLY when actually today in salon timezone (Phase 6.2) */}
          <button
            onClick={() => setSelectedDate(todayInSalonTz)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isTodaySelected
                ? 'text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E294B] border border-[#BFDBFE]/80 dark:border-[#2563EB]/40 ring-1 ring-[#2563EB]/30'
                : 'text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#141A2E] hover:bg-[#F1F5F9] dark:hover:bg-[#1C2542] border border-[#CBD5E1] dark:border-[#252F4E]'
            }`}
          >
            Today
          </button>
        </div>

        {/* View Mode & Filter Controls Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stylist Filter */}
          {user?.role === 'STYLIST' ? (
            <div className="text-xs px-3.5 py-2 rounded-xl bg-[#EFF6FF] dark:bg-[#1E294B] text-[#2563EB] dark:text-[#60A5FA] font-bold border border-[#BFDBFE]/70">
              My Schedule
            </div>
          ) : (
            <div className="w-full sm:w-44">
              <CustomSelect
                value={selectedStaffFilter}
                onChange={setSelectedStaffFilter}
                options={[
                  { value: '', label: 'All Stylists' },
                  ...staffList.map((s) => ({
                    value: s.id,
                    label: s.user_details?.full_name || s.title,
                  })),
                ]}
                size="sm"
                className="w-full"
              />
            </div>
          )}

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <CustomSelect
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'CONFIRMED', label: 'Confirmed', badge: 'Active' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              size="sm"
              className="w-full"
            />
          </div>

          {/* Toggle Mode */}
          <div className="flex rounded-xl border border-[#CBD5E1] dark:border-[#252F4E] p-1 bg-[#F1F5F9] dark:bg-[#1C2542] shadow-2xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-[#141A2E] text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#29315D]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-[#141A2E] text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#29315D]'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Cards Grid — Beautiful Clean Responsive Cards */}
      {isLoading ? (
        <AppointmentCardSkeleton count={6} />
      ) : appointments.length === 0 ? (
        <div className="card-surface p-12 text-center rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#252F4E]">
          <CalendarIcon className="w-12 h-12 text-[#94A3B8] dark:text-slate-600 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-bold text-[#29315D] dark:text-[#F8FAFC] mt-3">
            No Bookings Found for {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
            There are no appointments scheduled for this date matching the current filters.
          </p>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="mt-4 btn-primary btn-md shadow-sm"
          >
            Create New Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedAppt(appt)}
              className="bg-white dark:bg-[#141A2E] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#252F4E] hover:border-[#2563EB]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#29315D] dark:text-[#F8FAFC]">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                    <span>
                      {appt.start_time.slice(0, 5)} – {appt.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <StatusLabel status={appt.status} size="xs" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#29315D] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
                    <span>{appt.customer_details?.full_name || 'Walk-in Client'}</span>
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: appt.staff_details?.color_code || '#2563EB' }}
                    ></span>
                    <span>Stylist: {appt.staff_details?.user_details?.full_name || appt.staff_details?.title}</span>
                  </p>
                </div>

                {/* Services Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {appt.items?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#F8FAFC] dark:bg-[#1C2542] text-[#334155] dark:text-[#F8FAFC] rounded-lg border border-[#E2E8F0] dark:border-[#252F4E]"
                    >
                      {item.service_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Total Duration on Left, Total Amount on Right (Phase 6.5) */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#252F4E]/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8] font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>
                    {formatDuration(
                      appt.total_duration_minutes ||
                        appt.items?.reduce((acc, i) => acc + (i.duration_minutes || 0), 0) ||
                        30
                    )}
                  </span>
                </div>
                <span className="font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums text-sm">
                  {formatINR(appt.total_amount || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Slide-Over Modal */}
      {selectedAppt && (
        <div
          onClick={() => setSelectedAppt(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#141A2E] rounded-2xl shadow-modal border border-[#CBD5E1] dark:border-[#252F4E] p-6 space-y-5 animate-scaleIn max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#252F4E] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#29315D] dark:text-[#F8FAFC]">
                  Appointment Details
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {selectedAppt.date} · {selectedAppt.start_time.slice(0, 5)} to {selectedAppt.end_time.slice(0, 5)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                aria-label="Close"
                className="p-1.5 text-[#64748B] hover:text-[#29315D] dark:hover:text-white rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#1C2542] transition-colors active:scale-95 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#252F4E]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Client:</span>
                <span className="font-bold text-[#29315D] dark:text-[#F8FAFC] break-words">
                  {selectedAppt.customer_details?.full_name || 'Walk-in Client'}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#252F4E]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Phone:</span>
                <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                  {selectedAppt.customer_details?.phone || 'Not provided'}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#252F4E]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Stylist:</span>
                <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                  {selectedAppt.staff_details?.user_details?.full_name || selectedAppt.staff_details?.title}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#252F4E]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Branch:</span>
                <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                  {selectedAppt.branch_details?.name || 'Main Branch'}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#252F4E]">
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Status:</span>
                <div>
                  <StatusLabel status={selectedAppt.status} size="sm" />
                </div>
              </div>

              {/* Items */}
              <div className="pt-2">
                <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC] block mb-1.5">
                  Booked Services:
                </span>
                <div className="space-y-1">
                  {selectedAppt.items?.map((it, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-1.5 px-3 bg-[#F8FAFC] dark:bg-[#1C2542] rounded-xl border border-[#E2E8F0] dark:border-[#252F4E]"
                    >
                      <span className="text-[#29315D] dark:text-[#F8FAFC]">
                        {it.service_name} ({formatDuration(it.duration_minutes)})
                      </span>
                      <span className="font-bold text-[#29315D] dark:text-[#F8FAFC] tabular-nums">
                        {formatINR(it.price || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2.5 px-3 border-t border-[#E2E8F0] dark:border-[#252F4E] text-sm font-bold">
                <span className="text-[#29315D] dark:text-[#F8FAFC]">Total Amount:</span>
                <span className="text-[#059669] dark:text-[#34D399] tabular-nums font-bold text-base">
                  {formatINR(selectedAppt.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E2E8F0] dark:border-[#252F4E] justify-end">
              {selectedAppt.status !== 'CANCELLED' && selectedAppt.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'CANCELLED')}
                  className="btn-danger-outline btn-sm font-semibold"
                >
                  <span>Cancel Booking</span>
                </button>
              )}
              {selectedAppt.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'IN_PROGRESS')}
                  className="btn-primary btn-sm font-semibold"
                >
                  <span>Mark In Progress</span>
                </button>
              )}
              {selectedAppt.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'COMPLETED')}
                  className="btn-secondary btn-sm font-semibold"
                >
                  <span>Mark Completed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Modal */}
      {isBookingOpen && (
        <QuickBookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={fetchAppointments}
        />
      )}
    </div>
  );
};
