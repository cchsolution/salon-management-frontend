import React, { useState, useEffect } from 'react';
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

export const AppointmentCalendarPage: React.FC = () => {
  const { branch, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [staffList, setStaffList] = useState<StaffProfile[]>(() => {
    const c = api.getCached<{ results?: StaffProfile[] } | StaffProfile[]>(
      branch?.id ? `/catalog/staff/?branch=${branch.id}` : '/catalog/staff/'
    ) || api.getCached<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/');
    return Array.isArray(c) ? c : c?.results || [];
  });

  // Filters
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>(() => {
    if (user?.role === 'STYLIST' && staffList.length > 0) {
      const found = staffList.find((s) => s.user === user.id);
      return found ? found.id : '';
    }
    return '';
  });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'agenda'>('day');

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    let url = `/appointments/bookings/?date=${new Date().toISOString().split('T')[0]}`;
    if (branch?.id) url += `&branch=${branch.id}`;
    const c = api.getCached<{ results?: Appointment[] } | Appointment[]>(url);
    return Array.isArray(c) ? c : c?.results || [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => appointments.length === 0);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (appointments.length === 0) {
        setIsLoading(true);
      }

      try {
        const staffUrl = branch?.id ? `/catalog/staff/?branch=${branch.id}` : '/catalog/staff/';
        const staffPromise = staffList.length > 0
          ? Promise.resolve(staffList)
          : api.get<{ results?: StaffProfile[] } | StaffProfile[]>(staffUrl);

        let activeStaffFilter = selectedStaffFilter;

        const staffRes = await staffPromise;
        const currentStaffList = Array.isArray(staffRes) ? staffRes : staffRes.results || [];

        if (isMounted && staffList.length === 0) {
          setStaffList(currentStaffList);
        }

        if (user?.role === 'STYLIST' && !activeStaffFilter) {
          const found = currentStaffList.find((s: StaffProfile) => s.user === user.id);
          if (found) {
            activeStaffFilter = found.id;
            if (isMounted) setSelectedStaffFilter(found.id);
          }
        }

        let apptUrl = `/appointments/bookings/?date=${selectedDate}`;
        if (branch?.id) apptUrl += `&branch=${branch.id}`;
        if (activeStaffFilter) apptUrl += `&staff=${activeStaffFilter}`;
        if (selectedStatusFilter) apptUrl += `&status=${selectedStatusFilter}`;

        const apptRes = await api.get<{ results?: Appointment[] } | Appointment[]>(apptUrl);

        if (isMounted) {
          setAppointments(Array.isArray(apptRes) ? apptRes : apptRes.results || []);
        }
      } catch {
        if (isMounted && appointments.length === 0) {
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, branch?.id, selectedStaffFilter, selectedStatusFilter]);

  const fetchAppointments = async () => {
    try {
      let url = `/appointments/bookings/?date=${selectedDate}`;
      if (branch?.id) url += `&branch=${branch.id}`;
      if (selectedStaffFilter) url += `&staff=${selectedStaffFilter}`;
      if (selectedStatusFilter) url += `&status=${selectedStatusFilter}`;

      const data = await api.get<{ results?: Appointment[] } | Appointment[]>(url, { forceRefresh: true });
      const list = Array.isArray(data) ? data : data.results || [];
      setAppointments(list);
    } catch {
      setAppointments([]);
    }
  };

  const handleUpdateStatus = async (apptId: string, newStatus: AppointmentStatus) => {
    try {
      await api.post(`/appointments/bookings/${apptId}/update_status/`, {
        status: newStatus,
      });
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
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-full border border-emerald-200 dark:border-emerald-800/40">Confirmed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] rounded-full border border-purple-200 dark:border-purple-800/40">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-full border border-emerald-200 dark:border-emerald-800/40">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-[#DC2626] rounded-full border border-red-200 dark:border-red-800/40">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-[#D97706] rounded-full border border-amber-200 dark:border-amber-800/40">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Appointment Calendar
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Real-time schedule management for {branch?.name || 'Himmatnagar Main Studio'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Date Controls & Filters */}
      <div className="card-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Stepper */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => changeDateBy(-1)}
            aria-label="Previous day"
            className="p-1.5 border border-[var(--border)] hover:bg-[var(--surface-secondary)] rounded-md text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-md px-2.5 py-1 focus:outline-none"
            />
          </div>
          <button
            onClick={() => changeDateBy(1)}
            aria-label="Next day"
            className="p-1.5 border border-[var(--border)] hover:bg-[var(--surface-secondary)] rounded-md text-[var(--text-secondary)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100/80 rounded-md border border-purple-200 dark:border-purple-800"
          >
            Today
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stylist Filter */}
          {user?.role === 'STYLIST' ? (
            <div className="text-xs px-2.5 py-1.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] font-semibold border border-purple-200 dark:border-purple-800">
              My Schedule
            </div>
          ) : (
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="text-xs border border-[var(--border)] rounded-md px-2.5 py-1.5 bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">All Stylists</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user_details?.full_name || s.title}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs border border-[var(--border)] rounded-md px-2.5 py-1.5 bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Toggle Mode */}
          <div className="flex rounded-md border border-[var(--border)] p-0.5 bg-[var(--surface-secondary)]">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === 'day' ? 'bg-[var(--surface)] text-[#6D28D9] dark:text-[#8B5CF6] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === 'agenda' ? 'bg-[var(--surface)] text-[#6D28D9] dark:text-[#8B5CF6] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Slots / Timeline */}
      {isLoading ? (
        <div className="card-surface p-12 text-center">
          <div className="w-8 h-8 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[var(--text-secondary)] mt-3">Loading calendar bookings...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-purple-300 dark:text-purple-800 mx-auto" />
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)] mt-3">
            No Bookings Found for {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            There are no appointments scheduled for this date matching the current filters.
          </p>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="mt-4 btn-primary"
          >
            Create New Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              onClick={() => setSelectedAppt(appt)}
              className="card-surface p-5 hover:border-[#6D28D9]/40 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                    <Clock className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#8B5CF6]" />
                    <span>
                      {appt.start_time.slice(0, 5)} – {appt.end_time.slice(0, 5)}
                    </span>
                  </div>
                  {statusBadge(appt.status)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    {appt.customer_details?.full_name || 'Walk-in Guest'}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: appt.staff_details?.color_code || '#6D28D9' }}></span>
                    Stylist: {appt.staff_details?.user_details?.full_name || appt.staff_details?.title}
                  </p>
                </div>

                {/* Services Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {appt.items?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[11px] font-medium bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border)]"
                    >
                      {item.service_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)]">₹{Number(appt.total_amount || 0).toLocaleString('en-IN')}</span>
                <div className="flex items-center gap-1.5">
                  {appt.status === 'CONFIRMED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(appt.id, 'IN_PROGRESS');
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] rounded-md transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {appt.status === 'IN_PROGRESS' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(appt.id, 'COMPLETED');
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Slide-Over Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                  Appointment Details
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedAppt.date} · {selectedAppt.start_time.slice(0, 5)} to {selectedAppt.end_time.slice(0, 5)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                aria-label="Close"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--surface-secondary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Client:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedAppt.customer_details?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Phone:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedAppt.customer_details?.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Stylist:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedAppt.staff_details?.user_details?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Branch:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedAppt.branch_details?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Status:</span>
                <div>{statusBadge(selectedAppt.status)}</div>
              </div>

              {/* Items */}
              <div className="pt-2">
                <span className="font-semibold text-[var(--text-primary)] block mb-1">Booked Services:</span>
                <div className="space-y-1">
                  {selectedAppt.items?.map((it, i) => (
                    <div key={i} className="flex justify-between py-1.5 px-2 bg-[var(--surface-secondary)] rounded-md">
                      <span className="text-[var(--text-primary)]">{it.service_name} ({it.duration_minutes}m)</span>
                      <span className="font-bold text-[var(--text-primary)]">₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between py-2 text-sm font-bold border-t border-[var(--border)]">
                <span className="text-[var(--text-primary)]">Total Amount:</span>
                <span className="text-[#059669] dark:text-[#10B981]">₹{Number(selectedAppt.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)] justify-end">
              {selectedAppt.status !== 'CANCELLED' && selectedAppt.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'CANCELLED')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#DC2626] bg-red-50 dark:bg-red-950/40 hover:bg-red-100/80 rounded-md"
                >
                  Cancel Booking
                </button>
              )}
              {selectedAppt.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'IN_PROGRESS')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] rounded-md"
                >
                  Mark In Progress
                </button>
              )}
              {selectedAppt.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'COMPLETED')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md shadow-sm"
                >
                  Mark Completed
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
