import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  Check,
  AlertCircle,
  Search,
  UserPlus,
  Scissors,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Phone,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Service, ServiceCategory, ServiceStyle, StaffProfile, Customer } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDuration } from '../../utils/formatDuration';
import {
  useCategories,
  useServices,
  useStyles,
  useStaff,
  useClients,
  useAvailableSlots,
  useInvalidateQueries,
} from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { FormField } from '../ui/FormField';
import { Validation, extractBackendErrors } from '../../utils/validation';

interface AppointmentBookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string;
  initialStaffId?: string;
}

export const AppointmentBookingWizard: React.FC<AppointmentBookingWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialStaffId,
}) => {
  const { branch, branches } = useAuth();

  // Wizard Step: 1 = Customer, 2 = Services, 3 = Stylist & Style, 4 = Date & Time, 5 = Review & Confirm
  // Wizard Step: 1 = Customer, 2 = Services, 3 = Stylist & Style, 4 = Date & Time, 5 = Review & Confirm
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data Catalogs via TanStack React Query (cached across app, 0ms load on open)
  const { data: categories = [] } = useCategories();
  const { data: services = [] } = useServices();
  const { data: styles = [] } = useStyles();
  const { data: staffList = [] } = useStaff(branch?.id);
  const { data: initialCustomers = [] } = useClients();
  const { invalidateAppointments, invalidateMetrics, invalidateClients } = useInvalidateQueries();

  // Local newly created customers in this session
  const [createdCustomers, setCreatedCustomers] = useState<Customer[]>([]);
  const customers = useMemo(() => {
    if (createdCustomers.length === 0) return initialCustomers;
    const existingIds = new Set(createdCustomers.map((c) => c.id));
    return [...createdCustomers, ...initialCustomers.filter((c) => !existingIds.has(c.id))];
  }, [createdCustomers, initialCustomers]);

  // Selection States
  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 200);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustErrors, setNewCustErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [newCustTouched, setNewCustTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);
  const [customerFormError, setCustomerFormError] = useState<string | null>(null);

  // Step 2: Category & Services
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Step 3: Stylist & Style
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || '');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');

  // Auto-select initial stylist when staff list resolves
  useEffect(() => {
    if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(initialStaffId || staffList[0].id);
    }
  }, [staffList, selectedStaffId, initialStaffId]);

  // Step 4: Date & Slots (Timezone: Asia/Kolkata)
  const todayKolkata = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);

  const [bookingDate, setBookingDate] = useState<string>(initialDate || todayKolkata);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Step 5: Notes & Submit
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Reset steps & feedback when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(1);
    setBookingSuccess(false);
    setBookingError(null);
    setCustomerFormError(null);
  }, [isOpen]);

  // Filtered Customers by debounced search
  const filteredCustomers = useMemo(() => {
    const q = debouncedCustomerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [customers, debouncedCustomerSearch]);

  // Filtered Services by category
  const filteredServices = useMemo(() => {
    if (selectedCategoryId === 'ALL') return services;
    return services.filter((s) => s.category === selectedCategoryId);
  }, [services, selectedCategoryId]);

  // Selected Services List
  const selectedServiceObjects = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Total Duration
  const totalDurationMinutes = useMemo(() => {
    const serviceDur = selectedServiceObjects.reduce(
      (acc, s) => acc + (s.duration_minutes || 30),
      0
    );
    const styleObj = styles.find((st) => st.id === selectedStyleId);
    return serviceDur + (styleObj?.extra_duration_minutes || 0);
  }, [selectedServiceObjects, styles, selectedStyleId]);

  // Total Price
  const totalPrice = useMemo(() => {
    const serviceSum = selectedServiceObjects.reduce(
      (acc, s) => acc + Number(s.effective_price || s.price || 0),
      0
    );
    const styleObj = styles.find((st) => st.id === selectedStyleId);
    const styleExtra = styleObj ? Number(styleObj.extra_price || 0) : 0;
    return serviceSum + styleExtra;
  }, [selectedServiceObjects, styles, selectedStyleId]);

  // Available styles for selected services
  const availableStyles = useMemo(() => {
    if (selectedServiceIds.length === 0) return [];
    return styles.filter((st) => selectedServiceIds.includes(st.service));
  }, [styles, selectedServiceIds]);

  // Qualified Stylists for the selected services
  const qualifiedStylists = useMemo(() => {
    if (selectedServiceObjects.length === 0) return staffList;
    return staffList;
  }, [staffList, selectedServiceObjects]);

  // Selected Staff Object
  const selectedStaffObj = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId);
  }, [staffList, selectedStaffId]);

  // Selected Style Object
  const selectedStyleObj = useMemo(() => {
    return styles.find((st) => st.id === selectedStyleId);
  }, [styles, selectedStyleId]);

  // Fetch slots efficiently only when date, stylist, and services are chosen
  const isSlotQueryEnabled = isOpen && Boolean(selectedStaffId && bookingDate && selectedServiceIds.length > 0);
  const { data: rawSlots = [], isLoading: isSlotLoading } = useAvailableSlots(
    {
      staffId: selectedStaffId,
      date: bookingDate,
      duration: totalDurationMinutes,
      branchId: branch?.id,
    },
    isSlotQueryEnabled
  );

  const availableSlots = useMemo(() => {
    if (!isSlotQueryEnabled) return [];
    let slots = rawSlots;
    if (bookingDate === todayKolkata) {
      try {
        const nowKolkata = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date());
        slots = slots.filter((slot) => slot >= nowKolkata);
      } catch {}
    }
    return slots;
  }, [rawSlots, bookingDate, todayKolkata, isSlotQueryEnabled]);

  useEffect(() => {
    if (availableSlots.length > 0) {
      setSelectedSlot((prev) => (availableSlots.includes(prev) ? prev : availableSlots[0]));
    } else {
      setSelectedSlot('');
    }
  }, [availableSlots]);

  // Toggle service selection
  const handleToggleService = (svcId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(svcId)) {
        return prev.filter((id) => id !== svcId);
      } else {
        return [...prev, svcId];
      }
    });
  };

  // Inline Quick Add Customer with full field-level validation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    setNewCustTouched({ name: true, phone: true, email: true });

    const nameErr = Validation.name('Client full name', 2, 80, true)(newCustName);
    const phoneErr = Validation.phone(true, 'IN')(newCustPhone);
    const emailErr = Validation.email(false)(newCustEmail);

    const errs: { name?: string; phone?: string; email?: string } = {};
    if (nameErr) errs.name = nameErr;
    if (phoneErr) errs.phone = phoneErr;
    if (emailErr) errs.email = emailErr;

    setNewCustErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setIsCreatingCustomer(true);
    setCustomerFormError(null);

    try {
      const parts = newCustName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || '';

      const created = await api.post<Customer>('/crm/clients/', {
        first_name: firstName,
        last_name: lastName,
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || undefined,
        notes: 'Created via Appointment Booking Wizard',
      });

      // Update customers list and select this newly created customer
      setCreatedCustomers((prev) => [created, ...prev]);
      setSelectedCustomer(created);
      invalidateClients();
      setShowNewCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustErrors({});
      setNewCustTouched({});
    } catch (err: any) {
      const { fieldErrors, generalError } = extractBackendErrors(err);
      if (fieldErrors.phone || fieldErrors.first_name || fieldErrors.email) {
        setNewCustErrors((prev) => ({
          ...prev,
          phone: fieldErrors.phone,
          name: fieldErrors.first_name,
          email: fieldErrors.email,
        }));
      }
      setCustomerFormError(generalError || 'Failed to create customer. Please check phone number.');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Final Confirmation Submit
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setBookingError('Please select a valid time slot.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      setBookingError('Please select at least one service.');
      return;
    }
    if (!selectedStaffId) {
      setBookingError('Please select a stylist.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const payload: any = {
        branch: branch?.id,
        staff: selectedStaffId,
        service_ids: selectedServiceIds,
        date: bookingDate,
        start_time: selectedSlot,
        notes: internalNotes.trim(),
      };

      if (selectedCustomer) {
        payload.customer = selectedCustomer.id;
      } else {
        payload.first_name = 'Walk-in Client';
        payload.phone = '0000000000';
      }

      if (selectedStyleId) {
        payload.style = selectedStyleId;
      }

      const res = await api.post('/appointments/bookings/', payload);

      // Invalidate appointment cache so lists & calendar update immediately
      clearApiCache('/appointments/');
      clearApiCache('/analytics/metrics/');
      invalidateAppointments();
      invalidateMetrics();

      // Dispatch global window event for instant UI sync
      window.dispatchEvent(
        new CustomEvent('appointment:created', {
          detail: res,
        })
      );

      setBookingSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete appointment booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
      >
        {/* Wizard Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-blue-50/50 to-emerald-50/30 dark:from-blue-950/20 dark:to-emerald-950/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A24E9]/10 text-[#0A24E9] dark:text-[#4D68FF] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                Book New Appointment
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Step {currentStep} of 5 ·{' '}
                {currentStep === 1 && 'Select Customer'}
                {currentStep === 2 && 'Select Services'}
                {currentStep === 3 && 'Choose Stylist & Style'}
                {currentStep === 4 && 'Pick Date & Slot'}
                {currentStep === 5 && 'Review & Confirm'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-5 py-2.5 bg-[var(--surface-secondary)] border-b border-[var(--border)] flex items-center justify-between text-xs">
          {[
            { step: 1, label: 'Customer' },
            { step: 2, label: 'Services' },
            { step: 3, label: 'Stylist' },
            { step: 4, label: 'Date/Time' },
            { step: 5, label: 'Confirm' },
          ].map((item, idx) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div key={item.step} className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => isCompleted && setCurrentStep(item.step)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#5C9764] text-white hover:opacity-90'
                      : isCurrent
                      ? 'bg-[#0A24E9] text-white ring-2 ring-[#0A24E9]/40'
                      : 'bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.step}
                </button>
                <span
                  className={`hidden sm:inline font-semibold ${
                    isCurrent
                      ? 'text-[#0A24E9] dark:text-[#4D68FF]'
                      : isCompleted
                      ? 'text-[#5C9764] dark:text-[#7DB585]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {item.label}
                </span>
                {idx < 4 && (
                  <div className="hidden sm:block w-4 h-0.5 bg-[var(--border)] mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Wizard Step Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Success Screen */}
          {bookingSuccess ? (
            <div className="text-center py-8 space-y-4 animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#059669] dark:text-[#10B981] flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  The appointment has been scheduled and synchronized immediately across the calendar and dashboard.
                </p>
              </div>

              <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Client:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedCustomer ? selectedCustomer.full_name : 'Walk-in Client'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Date & Slot:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDisplayDate(bookingDate)} at {selectedSlot}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Stylist:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedStaffObj?.user_details?.full_name || selectedStaffObj?.title}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold">
                  <span className="text-[var(--text-primary)]">Total:</span>
                  <span className="text-[#059669] dark:text-[#10B981]">{formatINR(totalPrice)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(false);
                    setCurrentStep(1);
                    setSelectedCustomer(null);
                    setSelectedServiceIds([]);
                    setSelectedSlot('');
                  }}
                  className="btn-outline btn-md"
                >
                  Book Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary btn-md shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {bookingError && (
                <div className="flex items-center gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* STEP 1: CUSTOMER SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        Select Client
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Search existing client by name or phone, or quickly add a new client.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                      className="btn-outline btn-sm flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showNewCustomerForm ? 'Cancel New' : '+ New Client'}</span>
                    </button>
                  </div>

                  {/* Inline New Customer Form */}
                  {showNewCustomerForm ? (
                    <form
                      onSubmit={handleCreateCustomer}
                      className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-3"
                      noValidate
                    >
                      <h4 className="text-xs font-bold text-[#0A24E9] dark:text-[#4D68FF] uppercase tracking-wider">
                        Quick Add New Client
                      </h4>
                      {customerFormError && (
                        <div className="flex items-center gap-1.5 p-2.5 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{customerFormError}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <FormField
                          label="Full Name"
                          required
                          error={newCustErrors.name}
                          touched={newCustTouched.name}
                        >
                          <input
                            type="text"
                            placeholder="e.g. Ruhi Patel"
                            value={newCustName}
                            onChange={(e) => {
                              setNewCustName(e.target.value);
                              if (newCustTouched.name) {
                                setNewCustErrors((prev) => ({
                                  ...prev,
                                  name: Validation.name('Client full name', 2, 80, true)(e.target.value) || undefined,
                                }));
                              }
                            }}
                            onBlur={() => {
                              setNewCustTouched((prev) => ({ ...prev, name: true }));
                              setNewCustErrors((prev) => ({
                                ...prev,
                                name: Validation.name('Client full name', 2, 80, true)(newCustName) || undefined,
                              }));
                            }}
                            className={`input-field ${newCustTouched.name && newCustErrors.name ? 'input-error' : ''}`}
                          />
                        </FormField>

                        <FormField
                          label="Phone Number"
                          required
                          error={newCustErrors.phone}
                          touched={newCustTouched.phone}
                        >
                          <input
                            type="tel"
                            placeholder="e.g. 98250 12345"
                            value={newCustPhone}
                            onChange={(e) => {
                              setNewCustPhone(e.target.value);
                              if (newCustTouched.phone) {
                                setNewCustErrors((prev) => ({
                                  ...prev,
                                  phone: Validation.phone(true, 'IN')(e.target.value) || undefined,
                                }));
                              }
                            }}
                            onBlur={() => {
                              setNewCustTouched((prev) => ({ ...prev, phone: true }));
                              setNewCustErrors((prev) => ({
                                ...prev,
                                phone: Validation.phone(true, 'IN')(newCustPhone) || undefined,
                              }));
                            }}
                            className={`input-field ${newCustTouched.phone && newCustErrors.phone ? 'input-error' : ''}`}
                          />
                        </FormField>

                        <div className="sm:col-span-2">
                          <FormField
                            label="Email Address"
                            error={newCustErrors.email}
                            touched={newCustTouched.email}
                            helperText="Optional for confirmations"
                          >
                            <input
                              type="email"
                              placeholder="client@example.com"
                              value={newCustEmail}
                              onChange={(e) => {
                                setNewCustEmail(e.target.value);
                                if (newCustTouched.email) {
                                  setNewCustErrors((prev) => ({
                                    ...prev,
                                    email: Validation.email(false)(e.target.value) || undefined,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                setNewCustTouched((prev) => ({ ...prev, email: true }));
                                setNewCustErrors((prev) => ({
                                  ...prev,
                                  email: Validation.email(false)(newCustEmail) || undefined,
                                }));
                              }}
                              className={`input-field ${newCustTouched.email && newCustErrors.email ? 'input-error' : ''}`}
                            />
                          </FormField>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustErrors({});
                            setNewCustTouched({});
                          }}
                          className="btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingCustomer}
                          className="btn-primary btn-sm"
                        >
                          {isCreatingCustomer ? 'Saving...' : 'Save & Select Client'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search clients by name, phone (+91), or email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="input-field pl-9 text-xs"
                        />
                      </div>

                      {/* Selected Customer Card */}
                      {selectedCustomer && (
                        <div className="p-3 bg-[#EEF2FF] dark:bg-[#1E294B] border border-[#0A24E9]/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0A24E9] text-white flex items-center justify-center font-bold text-xs">
                              {selectedCustomer.first_name?.[0] || 'C'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[var(--text-primary)]">
                                {selectedCustomer.full_name}
                              </p>
                              <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                                <span>{selectedCustomer.phone}</span>
                                {selectedCustomer.visit_count > 0 && (
                                  <span className="text-[#5C9764] font-semibold">
                                    · {selectedCustomer.visit_count} past visits
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-[#5C9764] font-bold">
                            <Check className="w-4 h-4" /> Selected
                          </span>
                        </div>
                      )}

                      {/* Customer List */}
                      <div className="border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] max-h-56 overflow-y-auto bg-[var(--surface)]">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
                            No clients match "{customerSearch}". Click <strong>+ New Client</strong> above to add them.
                          </div>
                        ) : (
                          filteredCustomers.map((cust) => {
                            const isSelected = selectedCustomer?.id === cust.id;
                            return (
                              <button
                                key={cust.id}
                                type="button"
                                onClick={() => setSelectedCustomer(cust)}
                                className={`w-full text-left p-3 flex items-center justify-between transition-colors text-xs ${
                                  isSelected
                                    ? 'bg-[#EEF2FF] dark:bg-[#1E294B] font-semibold text-[var(--text-primary)]'
                                    : 'hover:bg-[var(--surface-secondary)] text-[var(--text-primary)]'
                                }`}
                              >
                                <div>
                                  <p className="font-semibold">{cust.full_name}</p>
                                  <p className="text-[11px] text-[var(--text-secondary)]">
                                    {cust.phone} {cust.email ? `· ${cust.email}` : ''}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-[var(--text-secondary)] block">
                                    Visits: {cust.visit_count || 0}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF] inline-block" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 2: CATEGORY & SERVICES */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Select Treatment Services
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Choose one or multiple services. Filter easily by category.
                    </p>
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId('ALL')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                        selectedCategoryId === 'ALL'
                          ? 'bg-[#0A24E9] text-white shadow-xs'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      All Services ({services.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                          selectedCategoryId === cat.id
                            ? 'bg-[#0A24E9] text-white shadow-xs'
                            : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {filteredServices.length === 0 ? (
                      <div className="col-span-2 p-6 text-center text-xs text-[var(--text-secondary)] italic">
                        No services found in this category.
                      </div>
                    ) : (
                      filteredServices.map((svc) => {
                        const isSelected = selectedServiceIds.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => handleToggleService(svc.id)}
                            className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] dark:border-[#4D68FF] shadow-sm ring-1 ring-[#0A24E9]/40'
                                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[#0A24E9]/40 hover:bg-[var(--surface-secondary)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-[var(--text-primary)] leading-snug">
                                  {svc.name}
                                </p>
                                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                                  {svc.description || `${formatDuration(svc.duration_minutes)} treatment`}
                                </p>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-[#0A24E9] border-[#0A24E9] text-white'
                                    : 'border-[var(--border)] bg-[var(--surface)]'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)] text-[11px]">
                              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(svc.duration_minutes)}
                              </span>
                              <span className="font-bold text-[var(--text-primary)] tabular-nums">
                                {formatINR(svc.effective_price || svc.price)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Full-width Selected Services Summary Bar (Phase 6.6) */}
                  <div className="w-full mt-3 p-3 bg-[#EEF2FF] dark:bg-[#1E294B] rounded-xl border border-[#0A24E9]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs shrink-0">
                    <span className="font-bold text-xs text-[#0A24E9] dark:text-[#60A5FA]">
                      {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'service' : 'services'} selected
                    </span>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Clock className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#60A5FA]" />
                        <span>Duration: <strong className="text-[var(--text-primary)]">{formatDuration(totalDurationMinutes)}</strong></span>
                      </span>
                      <span className="text-[#059669] dark:text-[#10B981] font-bold text-sm tabular-nums">
                        Total: {formatINR(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: STYLIST & STYLE */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Choose Qualified Stylist
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Select from verified salon professionals qualified for your chosen services.
                    </p>
                  </div>

                  {/* Stylist Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto p-1">
                    {qualifiedStylists.map((st) => {
                      const isSelected = selectedStaffId === st.id;
                      const staffName = st.user_details?.full_name || st.title;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedStaffId(st.id)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] dark:border-[#4D68FF] shadow-sm ring-1 ring-[#0A24E9]/40'
                              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[#0A24E9]/40 hover:bg-[var(--surface-secondary)]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] font-bold flex items-center justify-center text-sm shrink-0 border border-[#0A24E9]/20">
                            {staffName?.[0] || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {staffName}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] truncate">
                              {st.title} {st.branch_name ? `· ${st.branch_name}` : ''}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Style Selection */}
                  {availableStyles.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                        <Sparkles className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                        <span>Optional Signature Style Upgrade</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStyleId('')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            !selectedStyleId
                              ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] font-bold text-[var(--text-primary)]'
                              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Standard Service Style (No Extra)
                        </button>
                        {availableStyles.map((sty) => {
                          const isStyleSelected = selectedStyleId === sty.id;
                          return (
                            <button
                              key={sty.id}
                              type="button"
                              onClick={() => setSelectedStyleId(sty.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                                isStyleSelected
                                  ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] font-bold text-[var(--text-primary)] ring-1 ring-[#0A24E9]/40'
                                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{sty.name}</p>
                                <p className="text-[10px] text-[var(--text-secondary)]">
                                  +{formatDuration(sty.extra_duration_minutes)} · +{formatINR(sty.extra_price)}
                                </p>
                              </div>
                              {isStyleSelected && (
                                <Check className="w-3.5 h-3.5 text-[#0A24E9]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: DATE & SLOTS */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Pick Date & Available Slot
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      All slots reflect Indian Standard Time (Asia/Kolkata). Past dates & passed hours are disabled.
                    </p>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Appointment Date (DD/MM/YYYY)
                    </label>
                    <div className="relative max-w-xs">
                      <input
                        type="date"
                        value={bookingDate}
                        min={todayKolkata}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Slot Picker */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Available Slots for {formatDisplayDate(bookingDate)}
                      </label>
                      {isSlotLoading && (
                        <span className="text-xs text-[#0A24E9] dark:text-[#4D68FF] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0A24E9] animate-ping" />
                          Checking slots...
                        </span>
                      )}
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-1">
                        <p className="font-semibold text-[var(--text-primary)]">
                          No slots available for this date and stylist.
                        </p>
                        <p>
                          Please pick a different date or choose another stylist from the previous step.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                                isSelected
                                  ? 'bg-[#059669] text-white border-[#059669] shadow-sm ring-2 ring-emerald-400/40'
                                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#059669] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & CONFIRM */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Review Appointment Details
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Confirm client booking details, scheduled treatments, and assign notes before saving.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-3 text-xs">
                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)] font-medium">Client Name:</span>
                      <span className="font-bold text-[var(--text-primary)] break-words">
                        {selectedCustomer ? selectedCustomer.full_name : 'Walk-in Client'}
                      </span>
                    </div>

                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)] font-medium">Contact Phone:</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {selectedCustomer?.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="grid grid-cols-[130px_1fr] gap-2 items-start border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)] font-medium pt-0.5">Services:</span>
                      <div className="space-y-1">
                        {selectedServiceObjects.map((s) => (
                          <div key={s.id} className="flex justify-between text-xs">
                            <span className="text-[var(--text-primary)] font-semibold">{s.name}</span>
                            <span className="tabular-nums font-bold text-[var(--text-primary)]">
                              {formatINR(s.effective_price || s.price)}
                            </span>
                          </div>
                        ))}
                        {selectedStyleObj && (
                          <div className="flex justify-between text-xs text-[#0A24E9] dark:text-[#4D68FF]">
                            <span>+ Style: {selectedStyleObj.name}</span>
                            <span className="tabular-nums font-bold">
                              {formatINR(selectedStyleObj.extra_price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)] font-medium">Assigned Stylist:</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {selectedStaffObj?.user_details?.full_name || selectedStaffObj?.title}
                      </span>
                    </div>

                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)] font-medium">Date & Time:</span>
                      <span className="font-bold text-[#0A24E9] dark:text-[#4D68FF]">
                        {formatDisplayDate(bookingDate)} at {selectedSlot} ({formatDuration(totalDurationMinutes)})
                      </span>
                    </div>

                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center pt-1 text-sm font-bold">
                      <span className="text-[var(--text-primary)]">Total Price:</span>
                      <span className="text-[#059669] dark:text-[#10B981] tabular-nums font-sans font-bold text-base">
                        {formatINR(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Internal Notes / Special Client Requests (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Client requested quiet session, prefers specific styling products..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="textarea-field text-xs"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {!bookingSuccess && (
          <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 flex items-center justify-between shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="btn-outline btn-sm flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  disabled={
                    (currentStep === 1 && !selectedCustomer && !showNewCustomerForm) ||
                    (currentStep === 2 && selectedServiceIds.length === 0) ||
                    (currentStep === 3 && !selectedStaffId) ||
                    (currentStep === 4 && !selectedSlot)
                  }
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="btn-primary btn-sm flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || !selectedSlot}
                  onClick={handleConfirmBooking}
                  className="btn-success btn-sm flex items-center gap-1.5 font-bold shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Appointment'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

