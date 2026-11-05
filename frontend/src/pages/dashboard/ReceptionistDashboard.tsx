import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Users,
  CreditCard,
  Search,
  CheckCircle2,
  PlayCircle,
  Phone,
  Scissors
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Appointment, AppointmentStatus, Customer } from '../../types';
import { QuickBookingModal } from '../../components/QuickBookingModal';
import { MetricCardSkeleton, AppointmentCardSkeleton } from '../../components/ui/Skeleton';
import { useAppointments, useClients, useInvalidateQueries } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';

export const ReceptionistDashboard: React.FC = () => {
  const { salon, branch } = useAuth();
  const navigate = useNavigate();

  const [clientSearch, setClientSearch] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 200);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [todayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const {
    data: appointments = [],
    isLoading: isApptsLoading,
    refetch: refetchAppointments,
  } = useAppointments({
    date: todayDate,
    branchId: branch?.id,
  });

  const { data: customers = [], isLoading: isCustsLoading } = useClients();
  const { invalidateAppointments, invalidateMetrics } = useInvalidateQueries();
  const isLoading = isApptsLoading && appointments.length === 0;

  useEffect(() => {
    const handleSync = () => {
      refetchAppointments();
    };
    window.addEventListener('appointment:created', handleSync);
    window.addEventListener('appointment:updated', handleSync);

    return () => {
      window.removeEventListener('appointment:created', handleSync);
      window.removeEventListener('appointment:updated', handleSync);
    };
  }, [refetchAppointments]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setActionLoading(appointmentId);
    try {
      await api.patch(`/appointments/bookings/${appointmentId}/`, { status: newStatus });
      invalidateAppointments();
      invalidateMetrics();
      refetchAppointments();
    } catch {
      // Handle error gracefully
    } finally {
      setActionLoading(null);
    }
  };

  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const inServiceCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length;

  const filteredClients = useMemo(() => {
    const q = debouncedClientSearch.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      )
      .slice(0, 5);
  }, [customers, debouncedClientSearch]);

  return (
    <div className="space-y-6 sm:space-y-8 page-enter font-sans">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Front Desk · {salon?.name || 'Ruhi Beauty Salon'}
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Live client check-in queue, booking management, and front desk operations ({branch?.name || 'Main Studio'}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickBookingOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Front-Desk KPIs (NO financial owner analytics) */}
      {isLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Today */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Today's Bookings
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {appointments.length}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-2">
                Scheduled on {todayDate}
              </p>
            </div>
          </div>

          {/* In Service */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Checked-In & Serving
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {inServiceCount}
              </h3>
              <p className="text-xs text-[#D97706] mt-2 font-semibold">
                Currently in stylist chairs
              </p>
            </div>
          </div>

          {/* Upcoming Arrivals */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Upcoming Arrivals
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
                Awaiting client arrival
              </p>
            </div>
          </div>

          {/* Completed Visits */}
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
                Ready for bill settlement
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Live Queue & Check-In Action Table */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#29315D] dark:text-[#F8FAFC]">
                Today's Appointment & Check-In Queue
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                One-click customer check-in and checkout routing
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] hover:underline"
            >
              Full Calendar →
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <AppointmentCardSkeleton count={3} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8] space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">No bookings scheduled for today</p>
              <button
                onClick={() => setIsQuickBookingOpen(true)}
                className="mt-2 text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] underline"
              >
                + Book a Walk-in Client
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/60">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F0F2F5]/60 dark:hover:bg-[#1C2542]/60 rounded-xl px-2.5 transition-colors">
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
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                        {appt.start_time} - {appt.end_time}
                      </span>
                      {appt.customer_details?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#5C9764] dark:text-[#7DB585]" />
                          {appt.customer_details.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#29315D] dark:text-[#F8FAFC] font-semibold">
                        <Scissors className="w-3 h-3 text-[#0A24E9] dark:text-[#4D68FF]" />
                        Stylist: {appt.staff_details?.user_details?.full_name || appt.staff_details?.title || 'Assigned Stylist'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Service: <span className="text-[#29315D] dark:text-[#F8FAFC] font-medium">{appt.items?.map((i) => i.service_name).join(', ') || 'Service'}</span>
                    </p>
                  </div>

                  {/* Reception Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'IN_PROGRESS')}
                        disabled={actionLoading === appt.id}
                        className="btn-primary btn-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </button>
                    )}
                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                        disabled={actionLoading === appt.id}
                        className="btn-success btn-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Visit</span>
                      </button>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <button
                        onClick={() => navigate('/dashboard/pos')}
                        className="btn-secondary btn-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                        <span>Bill Checkout</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Lookup & Front-Desk Shortcuts */}
        <div className="space-y-5">
          {/* Quick Client Search */}
          <div className="card-surface p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#29315D] dark:text-[#F8FAFC]">
                Client Quick Lookup
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                Search existing salon client or register new
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="input-field pl-9 text-xs"
              />
            </div>

            {filteredClients.length > 0 && (
              <div className="divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/60 pt-1">
                {filteredClients.map((c) => (
                  <div key={c.id} className="py-2 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">{c.full_name}</p>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsQuickBookingOpen(true);
                      }}
                      className="btn-secondary btn-sm px-2.5 py-1 text-[11px]"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard/clients')}
              className="w-full btn-secondary btn-sm justify-center py-2"
            >
              <Users className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
              <span>Open Customer CRM & Register</span>
            </button>
          </div>

          {/* Front Desk Shortcuts */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#29315D] dark:text-[#F8FAFC]">
              Front-Desk Operations
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => navigate('/dashboard/pos')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5] dark:bg-[#1C2542] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] border border-[#CACED6]/60 dark:border-[#252F4E] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585]" />
                  <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                    POS Billing & Counter
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Open →</span>
              </button>

              <button
                onClick={() => navigate('/dashboard/services')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5] dark:bg-[#1C2542] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] border border-[#CACED6]/60 dark:border-[#252F4E] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
                  <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC]">
                    Service Menu & Pricing
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">Lookup →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Booking Modal */}
      {isQuickBookingOpen && (
        <QuickBookingModal
          isOpen={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
          onSuccess={() => refetchAppointments()}
        />
      )}
    </div>
  );
};
