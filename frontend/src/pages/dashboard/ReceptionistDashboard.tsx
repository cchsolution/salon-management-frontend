import React, { useState, useEffect, useCallback, useRef } from 'react';
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

export const ReceptionistDashboard: React.FC = () => {
  const { salon, branch } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [todayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReceptionData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      let apptUrl = `/appointments/bookings/?date=${todayDate}`;
      if (branch?.id) {
        apptUrl += `&branch=${branch.id}`;
      }

      // Fetch appointments (branch-dependent) and clients concurrently
      const [apptRes, custRes] = await Promise.all([
        api.get<{ results?: Appointment[] } | Appointment[]>(apptUrl, {
          signal: controller.signal,
        }),
        customers.length > 0
          ? Promise.resolve(customers)
          : api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/', {
              signal: controller.signal,
            }),
      ]);

      setAppointments(Array.isArray(apptRes) ? apptRes : apptRes.results || []);
      if (Array.isArray(custRes) || custRes?.results) {
        setCustomers(Array.isArray(custRes) ? custRes : custRes.results || []);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setAppointments([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [branch?.id, todayDate]);

  useEffect(() => {
    fetchReceptionData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReceptionData]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setActionLoading(appointmentId);
    try {
      await api.patch(`/appointments/bookings/${appointmentId}/`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch {
      // Handle error gracefully
    } finally {
      setActionLoading(null);
    }
  };

  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const inServiceCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const upcomingCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length;

  const filteredClients = clientSearch.trim()
    ? customers.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone?.includes(clientSearch)
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
            Front Desk · {salon?.name || 'Ruhi Beauty Salon'}
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] dark:text-[#C4BFD0] mt-1">
            Live client check-in queue, booking management, and front desk operations ({branch?.name || 'Main Studio'}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickBookingOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Front-Desk KPIs (NO financial owner analytics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Today's Bookings
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {appointments.length}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
              Scheduled on {todayDate}
            </p>
          </div>
        </div>

        {/* In Service */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Checked-In & Serving
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {inServiceCount}
            </h3>
            <p className="text-xs text-[#D97706] mt-1.5 font-semibold">
              Currently in stylist chairs
            </p>
          </div>
        </div>

        {/* Upcoming Arrivals */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Upcoming Arrivals
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
              Awaiting client arrival
            </p>
          </div>
        </div>

        {/* Completed Visits */}
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
              Ready for bill settlement
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Live Queue & Check-In Action Table */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                Today's Appointment & Check-In Queue
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">
                One-click customer check-in and checkout routing
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] hover:underline"
            >
              Full Calendar →
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0]">
              <div className="w-7 h-7 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading queue...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0] space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">No bookings scheduled for today</p>
              <button
                onClick={() => setIsQuickBookingOpen(true)}
                className="mt-2 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] underline"
              >
                + Book a Walk-in Client
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        {appt.start_time} - {appt.end_time}
                      </span>
                      {appt.customer_details?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          {appt.customer_details.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[#1E1B2E] dark:text-[#F8FAFC] font-semibold">
                        <Scissors className="w-3 h-3 text-purple-500" />
                        Stylist: {appt.staff_details?.user_details?.full_name || appt.staff_details?.title || 'Assigned Stylist'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0]">
                      Service: <span className="text-[#1E1B2E] dark:text-[#F8FAFC] font-medium">{appt.items?.map((i) => i.service_name).join(', ') || 'Service'}</span>
                    </p>
                  </div>

                  {/* Reception Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {appt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'IN_PROGRESS')}
                        disabled={actionLoading === appt.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </button>
                    )}
                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                        disabled={actionLoading === appt.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Visit</span>
                      </button>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <button
                        onClick={() => navigate('/dashboard/pos')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
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
              <h3 className="text-sm font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
                Client Quick Lookup
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">
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
              <div className="divide-y divide-[#E2E8F0] dark:divide-[#332A46] pt-1">
                {filteredClients.map((c) => (
                  <div key={c.id} className="py-2 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">{c.full_name}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0]">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsQuickBookingOpen(true);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/40 rounded hover:bg-purple-100"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard/clients')}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-secondary)] hover:bg-slate-100 dark:hover:bg-[#211A32] rounded-lg border border-[var(--border)] transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#8B5CF6]" />
              <span>Open Customer CRM & Register</span>
            </button>
          </div>

          {/* Front Desk Shortcuts */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              Front-Desk Operations
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => navigate('/dashboard/pos')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-[var(--border)] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                  <span className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">
                    POS Billing & Counter
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] dark:text-[#C4BFD0]">Open →</span>
              </button>

              <button
                onClick={() => navigate('/dashboard/services')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-[var(--border)] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
                  <span className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">
                    Service Menu & Pricing
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] dark:text-[#C4BFD0]">Lookup →</span>
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
          onSuccess={() => fetchReceptionData()}
        />
      )}
    </div>
  );
};
