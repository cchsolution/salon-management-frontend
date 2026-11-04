import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Award,
  Calendar,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatINR } from '../../utils/currency';
import { useClients, useInvalidateQueries } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';
import { AlertCircle } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { data: customers = [], isLoading } = useClients();
  const { invalidateClients } = useInvalidateQueries();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Client Modal with comprehensive field validation
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    values: clientValues,
    errors: clientErrors,
    touched: clientTouched,
    isSubmitting: isSubmittingClient,
    submitError: clientSubmitError,
    handleChange: handleClientChange,
    handleBlur: handleClientBlur,
    handleSubmit: handleClientSubmit,
    resetForm: resetClientForm,
  } = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      notes: '',
    },
    validationSchema: {
      first_name: [Validation.required('First name'), Validation.name('First name', 2, 50, true)],
      last_name: [Validation.name('Last name', 1, 50, false)],
      phone: [Validation.required('Phone number'), Validation.phone(true, 'IN')],
      email: [Validation.email(false)],
    },
    onSubmit: async (vals) => {
      await api.post('/crm/clients/', {
        first_name: vals.first_name.trim(),
        last_name: vals.last_name.trim(),
        phone: vals.phone.trim(),
        email: vals.email.trim() || undefined,
        notes: vals.notes.trim(),
      });
      invalidateClients();
      setIsModalOpen(false);
      resetClientForm();
    },
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));
      const matchesTag = selectedTag ? c.tags && c.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [customers, debouncedSearch, selectedTag]);

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Client Directory & CRM
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Manage salon customer profiles, visit history, preferences, and loyalty points.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary btn-md shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['', 'VIP', 'Frequent', 'New Client'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#0A24E9] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
              }`}
            >
              {tag ? `#${tag}` : 'All Clients'}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
            No customers match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Client Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Tags & Segment</th>
                  <th className="py-3.5 px-4">Visits</th>
                  <th className="py-3.5 px-4">Total Spend</th>
                  <th className="py-3.5 px-4">Loyalty Points</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((c: Customer) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-[var(--surface-secondary)]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6D28D9] dark:bg-purple-950/60 dark:text-[#8B5CF6] font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-800">
                          {c.first_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{c.full_name}</p>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {c.city ? `${c.city}` : 'Gujarat'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                          <Phone className="w-3 h-3 text-[var(--text-secondary)]" /> {c.phone}
                        </p>
                        {c.email && (
                          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <Mail className="w-3 h-3 text-[var(--text-secondary)]" /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t: string, idx: number) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                t === 'VIP'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800/40'
                                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                              }`}
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--text-secondary)] text-[11px]">Regular</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-[var(--text-primary)]">
                      {c.visit_count} visits
                    </td>
                    <td className="py-4 px-4 font-bold text-[#059669] dark:text-[#10B981] tabular-nums">
                      {formatINR(c.total_spend || 0)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-[#6D28D9] dark:text-[#8B5CF6] font-bold">
                        <Award className="w-3.5 h-3.5" />
                        {c.loyalty_points} pts
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-[#059669] dark:text-[#10B981] font-semibold hover:underline inline-flex items-center gap-1">
                        View Profile <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Slide-Over Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] h-full shadow-2xl flex flex-col border-l border-[var(--border)] animate-slide-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#0A24E9] dark:bg-[#1E294B] dark:text-[#4D68FF] font-bold flex items-center justify-center text-base border border-[#0A24E9]/20 shrink-0">
                  {selectedCustomer.first_name?.[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                    {selectedCustomer.full_name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close drawer"
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2.5 text-center p-3.5 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-xs">
                <div className="p-1">
                  <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">Total Spend</p>
                  <p className="font-bold text-[#059669] dark:text-[#10B981] mt-1 tabular-nums text-sm font-sans">
                    {formatINR(selectedCustomer.total_spend || 0)}
                  </p>
                </div>
                <div className="p-1 border-x border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">Visits</p>
                  <p className="font-bold text-[var(--text-primary)] mt-1 tabular-nums text-sm font-sans">
                    {selectedCustomer.visit_count || 0}
                  </p>
                </div>
                <div className="p-1">
                  <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">Points</p>
                  <p className="font-bold text-[#0A24E9] dark:text-[#4D68FF] mt-1 tabular-nums text-sm font-sans">
                    {selectedCustomer.loyalty_points || 0}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Contact Details
                </h4>
                <div className="p-3.5 bg-[var(--surface-secondary)]/60 border border-[var(--border)] rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone:
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email:
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.city && (
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                      <span className="text-[var(--text-secondary)]">City:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedCustomer.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidential Stylist Notes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Stylist & Treatment Notes
                </h4>
                <div className="p-3.5 bg-[var(--surface-secondary)]/60 border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] leading-relaxed">
                  {selectedCustomer.notes || 'No special styling notes recorded yet.'}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Recent Activity Timeline
                </h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[var(--border)]">
                  {selectedCustomer.recent_activities && selectedCustomer.recent_activities.length > 0 ? (
                    selectedCustomer.recent_activities.map((act) => (
                      <div key={act.id} className="relative flex items-start gap-3 pl-7 text-xs">
                        <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#059669] border-2 border-[var(--surface)] shadow-xs"></span>
                        <div className="bg-[var(--surface-secondary)]/50 p-2.5 rounded-xl border border-[var(--border)] w-full">
                          <p className="font-semibold text-[var(--text-primary)]">{act.title}</p>
                          <p className="text-[var(--text-secondary)] text-[11px] mt-0.5">{act.description}</p>
                          <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 block">
                            {new Date(act.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-7 py-2 text-xs text-[var(--text-secondary)] italic">
                      No customer activities recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer with Prominent Close Button */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/70 shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="btn-outline btn-md w-full justify-center font-bold"
              >
                Close Customer Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">New Client Profile</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetClientForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {clientSubmitError && (
              <div className="flex items-start gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{clientSubmitError}</span>
              </div>
            )}

            <form onSubmit={handleClientSubmit()} className="space-y-3.5 text-xs" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="First Name"
                  required
                  error={clientErrors.first_name}
                  touched={clientTouched.first_name}
                >
                  <input
                    type="text"
                    value={clientValues.first_name}
                    placeholder="e.g. Ayesha"
                    onChange={handleClientChange('first_name')}
                    onBlur={handleClientBlur('first_name')}
                    className={`input-field ${clientTouched.first_name && clientErrors.first_name ? 'input-error' : ''}`}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  error={clientErrors.last_name}
                  touched={clientTouched.last_name}
                >
                  <input
                    type="text"
                    value={clientValues.last_name}
                    placeholder="e.g. Sheikh"
                    onChange={handleClientChange('last_name')}
                    onBlur={handleClientBlur('last_name')}
                    className={`input-field ${clientTouched.last_name && clientErrors.last_name ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <FormField
                label="Phone Number"
                required
                error={clientErrors.phone}
                touched={clientTouched.phone}
                helperText="10-digit mobile number for appointment reminders"
              >
                <input
                  type="tel"
                  placeholder="e.g. 98250 12345"
                  value={clientValues.phone}
                  onChange={handleClientChange('phone')}
                  onBlur={handleClientBlur('phone')}
                  className={`input-field ${clientTouched.phone && clientErrors.phone ? 'input-error' : ''}`}
                />
              </FormField>

              <FormField
                label="Email Address"
                error={clientErrors.email}
                touched={clientTouched.email}
                helperText="Optional for invoice & promotions"
              >
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={clientValues.email}
                  onChange={handleClientChange('email')}
                  onBlur={handleClientBlur('email')}
                  className={`input-field ${clientTouched.email && clientErrors.email ? 'input-error' : ''}`}
                />
              </FormField>

              <FormField
                label="Stylist Notes & Preferences"
                helperText="Allergies, formulas, coffee preferences..."
              >
                <textarea
                  rows={2}
                  placeholder="e.g. Sensitive scalp, preferred stylist Ruhi"
                  value={clientValues.notes}
                  onChange={handleClientChange('notes')}
                  className="textarea-field"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetClientForm();
                  }}
                  className="btn-ghost btn-md"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClient}
                  className="btn-primary btn-md"
                >
                  <span>{isSubmittingClient ? 'Saving Client...' : 'Save Client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
