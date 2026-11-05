import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  UserCheck,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { Customer } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatINR } from '../../utils/currency';
import { useClients, useInvalidateQueries } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';

export const CustomersPage: React.FC = () => {
  const { data: customers = [], isLoading } = useClients();
  const { invalidateClients } = useInvalidateQueries();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Edit customer state
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editValues, setEditValues] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Delete customer state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [serverRequiresToken, setServerRequiresToken] = useState(false);
  const [serverTokenPrompt, setServerTokenPrompt] = useState<string | null>(null);
  const [deleteTokenInput, setDeleteTokenInput] = useState('');

  // Sync editValues when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setEditValues({
        first_name: selectedCustomer.first_name || '',
        last_name: selectedCustomer.last_name || '',
        phone: selectedCustomer.phone || '',
        address: selectedCustomer.address || '',
        city: selectedCustomer.city || '',
        notes: selectedCustomer.notes || '',
      });
      setIsEditingCustomer(false);
      setEditErrors({});
      setEditSuccessMsg(null);
      setShowDeleteConfirm(false);
      setDeleteError(null);
      setServerRequiresToken(false);
      setDeleteTokenInput('');
    }
  }, [selectedCustomer]);

  // Handle body scroll locking and Escape key for modals
  const isAnyModalOpen = isEditingCustomer || Boolean(selectedCustomer) || showDeleteConfirm;
  useEffect(() => {
    if (!isAnyModalOpen && !selectedCustomer) return;

    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (selectedCustomer) {
          setSelectedCustomer(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, selectedCustomer, showDeleteConfirm]);

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
      clearApiCache('/crm/clients/');
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

  // Save changes handler for customer profile
  const handleSaveCustomerChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const errors: Record<string, string> = {};
    if (!editValues.first_name.trim()) {
      errors.first_name = 'First name is required.';
    }
    if (!editValues.phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!/^[0-9]{10}$/.test(editValues.phone.replace(/[^0-9]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditErrors({});
      setEditSuccessMsg(null);

      const payload = {
        first_name: editValues.first_name.trim(),
        last_name: editValues.last_name.trim(),
        phone: editValues.phone.trim(),
        address: editValues.address.trim(),
        city: editValues.city.trim(),
        notes: editValues.notes.trim(),
      };

      const updated = await api.patch<Customer>(`/crm/clients/${selectedCustomer.id}/`, payload);
      clearApiCache('/crm/clients/');
      invalidateClients();
      setSelectedCustomer((prev) => (prev ? { ...prev, ...updated, ...payload, full_name: `${payload.first_name} ${payload.last_name}`.trim() } : null));
      setEditSuccessMsg('Customer profile updated successfully.');
      setIsEditingCustomer(false);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const backendErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          backendErrors[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
        setEditErrors(backendErrors);
      } else {
        setEditErrors({ general: err?.message || 'Failed to update customer profile.' });
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Secure deletion handler with server confirmation/token support
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const requestConfig: any = {};
      if (serverRequiresToken && deleteTokenInput.trim()) {
        requestConfig.data = {
          token: deleteTokenInput.trim(),
          otp: deleteTokenInput.trim(),
        };
      }

      await api.delete(`/crm/clients/${selectedCustomer.id}/`, requestConfig);
      clearApiCache('/crm/clients/');
      invalidateClients();
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.token_required || data?.otp_required || err?.response?.status === 428) {
        setServerRequiresToken(true);
        setServerTokenPrompt(
          data?.detail || data?.message || 'Verification token or OTP required by server to authorize deletion.'
        );
      } else {
        setDeleteError(
          data?.detail || data?.message || err?.message || 'Failed to delete customer profile from server.'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
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
                  ? 'bg-[#2868ff] text-white shadow-xs'
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
                        {/* Theme-aligned Customer Avatar */}
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#2868ff] dark:bg-[#1E294B] dark:text-[#4D68FF] font-bold flex items-center justify-center text-xs border border-[#2868ff]/20 shrink-0">
                          {c.first_name?.[0] || c.full_name?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{c.full_name}</p>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {c.city ? `${c.city}` : 'Client'}
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
                                  ? 'bg-[#2868ff]/10 text-[#2868ff] dark:text-[#4D68FF] border border-[#2868ff]/30'
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
                    {/* Loyalty Points: White text badge */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 bg-[#2868ff] text-white px-2.5 py-0.5 rounded-md font-bold text-xs shadow-xs">
                        <Award className="w-3.5 h-3.5 text-white" />
                        {c.loyalty_points || 0} pts
                      </span>
                    </td>
                    {/* View Profile: Professional Green Button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="btn-success btn-sm text-white inline-flex items-center gap-1.5 font-semibold"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal using createPortal with z-[100] and even blur */}
      {selectedCustomer &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !showDeleteConfirm) {
                setSelectedCustomer(null);
              }
            }}
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--surface)] h-full shadow-2xl flex flex-col border-l border-[var(--border)] animate-slide-left overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#2868ff] dark:bg-[#1E294B] dark:text-[#4D68FF] font-bold flex items-center justify-center text-base border border-[#2868ff]/20 shrink-0">
                    {selectedCustomer.first_name?.[0] || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                      {selectedCustomer.full_name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{selectedCustomer.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isEditingCustomer && (
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(true)}
                      className="btn-outline btn-xs flex items-center gap-1"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    aria-label="Close drawer"
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Success Banner */}
                {editSuccessMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-[#059669] bg-[#059669]/10 border border-[#059669]/25 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                {/* Edit Form or Normal View */}
                {isEditingCustomer ? (
                  <form onSubmit={handleSaveCustomerChanges} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Edit Customer Information
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCustomer(false);
                          setEditErrors({});
                        }}
                        className="text-xs text-[var(--text-secondary)] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>

                    {editErrors.general && (
                      <div className="flex items-start gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{editErrors.general}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editValues.first_name}
                          onChange={(e) => setEditValues({ ...editValues, first_name: e.target.value })}
                          className={`input-field ${editErrors.first_name ? 'input-error' : ''}`}
                          placeholder="First Name"
                        />
                        {editErrors.first_name && (
                          <p className="text-[11px] text-red-500 mt-1">{editErrors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editValues.last_name}
                          onChange={(e) => setEditValues({ ...editValues, last_name: e.target.value })}
                          className={`input-field ${editErrors.last_name ? 'input-error' : ''}`}
                          placeholder="Last Name"
                        />
                        {editErrors.last_name && (
                          <p className="text-[11px] text-red-500 mt-1">{editErrors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editValues.phone}
                        onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                        className={`input-field ${editErrors.phone ? 'input-error' : ''}`}
                        placeholder="10-digit Phone Number"
                      />
                      {editErrors.phone && (
                        <p className="text-[11px] text-red-500 mt-1">{editErrors.phone}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={editValues.city}
                          onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                          className={`input-field ${editErrors.city ? 'input-error' : ''}`}
                          placeholder="City"
                        />
                        {editErrors.city && (
                          <p className="text-[11px] text-red-500 mt-1">{editErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          Address / Area
                        </label>
                        <input
                          type="text"
                          value={editValues.address}
                          onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                          className={`input-field ${editErrors.address ? 'input-error' : ''}`}
                          placeholder="Street or Locality"
                        />
                        {editErrors.address && (
                          <p className="text-[11px] text-red-500 mt-1">{editErrors.address}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                        Stylist Notes / Preferences
                      </label>
                      <textarea
                        rows={3}
                        value={editValues.notes}
                        onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                        className="textarea-field text-xs"
                        placeholder="Treatment preferences, formulas, etc."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCustomer(false);
                          setEditErrors({});
                        }}
                        className="btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Quick Metrics */}
                    <div className="grid grid-cols-3 gap-2.5 text-center p-3.5 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-xs">
                      <div className="p-1">
                        <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">
                          Total Spend
                        </p>
                        <p className="font-bold text-[#059669] dark:text-[#10B981] mt-1 tabular-nums text-sm font-sans">
                          {formatINR(selectedCustomer.total_spend || 0)}
                        </p>
                      </div>
                      <div className="p-1 border-x border-[var(--border)]">
                        <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">
                          Visits
                        </p>
                        <p className="font-bold text-[var(--text-primary)] mt-1 tabular-nums text-sm font-sans">
                          {selectedCustomer.visit_count || 0}
                        </p>
                      </div>
                      <div className="p-1 flex flex-col items-center">
                        <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1">
                          Points
                        </p>
                        <span className="inline-flex items-center gap-1 bg-[#2868ff] text-white px-2 py-0.5 rounded-md font-bold text-xs shadow-xs">
                          <Award className="w-3 h-3 text-white" />
                          {selectedCustomer.loyalty_points || 0}
                        </span>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Contact & Address
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingCustomer(true)}
                          className="text-[11px] text-[#2868ff] hover:underline font-semibold"
                        >
                          Edit Info
                        </button>
                      </div>
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
                            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                              {selectedCustomer.email}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                          <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> City:
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {selectedCustomer.city || 'Not provided'}
                          </span>
                        </div>
                        {selectedCustomer.address && (
                          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                            <span className="text-[var(--text-secondary)]">Address:</span>
                            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[220px]">
                              {selectedCustomer.address}
                            </span>
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
                                    year: 'numeric',
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
                  </>
                )}
              </div>

              {/* Sticky Drawer Footer with Close & Delete Buttons */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/70 shrink-0 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800/40 dark:hover:bg-red-950/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-outline btn-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal with Token/OTP support */}
      {showDeleteConfirm &&
        selectedCustomer &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setShowDeleteConfirm(false);
              }
            }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Customer Profile</h3>
                  <p className="text-xs text-[var(--text-secondary)]">This action requires explicit confirmation</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {selectedCustomer.full_name} ({selectedCustomer.phone})
                </p>
                <p className="text-[var(--text-secondary)]">
                  All visit history, appointment records, and loyalty points linked to this customer will be affected.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              {serverRequiresToken && (
                <div className="space-y-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                    <KeyRound className="w-4 h-4" />
                    <span>Security Verification Required</span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                    {serverTokenPrompt || 'Please enter the verification token or OTP sent to authorize deletion.'}
                  </p>
                  <input
                    type="text"
                    placeholder="Enter verification code / token"
                    value={deleteTokenInput}
                    onChange={(e) => setDeleteTokenInput(e.target.value)}
                    className="input-field text-xs bg-[var(--surface)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError(null);
                    setServerRequiresToken(false);
                  }}
                  className="btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || (serverRequiresToken && !deleteTokenInput.trim())}
                  onClick={handleDeleteCustomer}
                  className="btn-danger btn-sm flex items-center gap-1.5 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting Customer...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Add Client Modal using createPortal with z-[100] */}
      {isModalOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                resetClientForm();
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scale-in"
            >
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
          </div>,
          document.body
        )}
    </div>
  );
};
