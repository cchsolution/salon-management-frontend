import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Service, StaffProfile, Customer } from '../types';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { branch, branches } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSlotLoading, setIsSlotLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial options
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [svcRes, staffRes, custRes] = await Promise.all([
          api.get<{ results?: Service[] } | Service[]>('/catalog/services/'),
          api.get<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/'),
          api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/'),
        ]);

        const svcs = Array.isArray(svcRes) ? svcRes : svcRes.results || [];
        const staff = Array.isArray(staffRes) ? staffRes : staffRes.results || [];
        const custs = Array.isArray(custRes) ? custRes : custRes.results || [];

        setServices(svcs);
        setStaffList(staff);
        setCustomers(custs);

        if (staff.length > 0 && !selectedStaff) {
          setSelectedStaff(staff[0].id);
        }
        if (svcs.length > 0 && selectedServices.length === 0) {
          setSelectedServices([svcs[0].id]);
        }
      } catch (err: any) {
        setError('Failed to load catalog data.');
      }
    };

    loadData();
  }, [isOpen]);

  // Fetch slots whenever staff, date, or services change
  useEffect(() => {
    if (!selectedStaff || !bookingDate || selectedServices.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsSlotLoading(true);
      try {
        const dur = selectedServices.reduce((acc, sid) => {
          const s = services.find((item) => item.id === sid);
          return acc + (s ? s.duration_minutes : 30);
        }, 0);

        const res = await api.get<{ slots: string[] }>(
          `/appointments/bookings/available_slots/?staff_id=${selectedStaff}&date=${bookingDate}&duration=${dur}&branch_id=${branch?.id || ''}`
        );
        setAvailableSlots(res.slots || []);
        if (res.slots && res.slots.length > 0) {
          setSelectedTime(res.slots[0]);
        } else {
          setSelectedTime('');
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsSlotLoading(false);
      }
    };

    fetchSlots();
  }, [selectedStaff, bookingDate, selectedServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      setError('Please select an available time slot.');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        branch: branch?.id,
        staff: selectedStaff,
        service_ids: selectedServices,
        date: bookingDate,
        start_time: selectedTime,
        notes,
      };

      if (selectedCustomer) {
        payload.customer = selectedCustomer;
      } else {
        if (!newCustomerPhone) {
          setError('Customer phone number is required.');
          setIsLoading(false);
          return;
        }
        payload.first_name = newCustomerName || 'Walk-in';
        payload.phone = newCustomerPhone;
      }

      await api.post('/appointments/bookings/', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-[#6D28D9] dark:text-[#8B5CF6]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[var(--text-primary)]">
                Schedule New Appointment
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Assign client, treatment services, qualified stylist, and available time slot.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Client Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Select Existing Client</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Or enter new client below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
              {!selectedCustomer && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ayesha Sheikh"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 98250 00000"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Services Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Select Services
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1.5 border border-[var(--border)] rounded-xl bg-[var(--surface-secondary)]/40">
              {services.map((svc) => {
                const isSelected = selectedServices.includes(svc.id);
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all border ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-[#6D28D9] dark:border-[#8B5CF6] text-[var(--text-primary)] font-semibold shadow-sm ring-1 ring-[#6D28D9]/30'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#6D28D9]/40 hover:bg-slate-50/50 dark:hover:bg-[#211A32]/40'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{svc.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {svc.duration_minutes} mins · ₹{Number(svc.effective_price || svc.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stylist & Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Stylist
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="select-field"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user_details?.full_name || s.title} ({s.title})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Slot Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Available Start Time
              </label>
              {isSlotLoading && <span className="text-xs text-[#6D28D9] dark:text-[#8B5CF6] font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-ping"></span> Checking slots...</span>}
            </div>

            {availableSlots.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic p-3 bg-[var(--surface-secondary)] rounded-xl text-center border border-[var(--border)]">
                No slots available on this date. Please pick another date or stylist.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#059669] text-white border-[#059669] shadow-sm'
                          : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#059669]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Client requested experienced stylist, sensitive scalp."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea-field"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedTime}
              className="btn-primary btn-md"
            >
              {isLoading ? 'Confirming...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
