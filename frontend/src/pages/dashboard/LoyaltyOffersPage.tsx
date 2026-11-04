import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Plus,
  Tag,
  Check,
  Calendar,
  IndianRupee,
  AlertCircle,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  X,
  Search,
  Save,
  ShieldAlert
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { MembershipPlan, Coupon, Customer } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { StatusLabel } from '../../components/ui/StatusLabel';
import { formatINR } from '../../utils/currency';
import { useLoyaltyPlans, useCoupons, useClients, useInvalidateQueries } from '../../hooks/useQueries';
import { FormField } from '../../components/ui/FormField';
import { Validation } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const LoyaltyOffersPage: React.FC = () => {
  const { data: plans = [], isLoading: isPlansLoading } = useLoyaltyPlans();
  const { data: coupons = [], isLoading: isCouponsLoading } = useCoupons();
  const { data: allClients = [] } = useClients();
  const { invalidateLoyalty } = useInvalidateQueries();
  const isLoading = isPlansLoading && isCouponsLoading && plans.length === 0 && coupons.length === 0;

  // New Coupon Modal & Audience Targeting
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audienceType, setAudienceType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editDiscountType, setEditDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [editDiscountVal, setEditDiscountVal] = useState('20');
  const [editMinSpend, setEditMinSpend] = useState('500');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Coupon Confirmation State
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const couponForm = useFormValidation({
    initialValues: {
      code: '',
      discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
      discount_value: '20',
      min_spend: '500',
      valid_days: '60',
      description: '',
    },
    validationSchema: {
      code: Validation.code('Coupon code', 3, 20, true),
      discount_value: (val: string, all: any) => {
        if (all.discount_type === 'PERCENTAGE') {
          return Validation.percentage('Discount percentage', true)(val);
        }
        return Validation.price('Discount amount', 1, true)(val);
      },
      min_spend: Validation.price('Minimum spend', 0, false),
      valid_days: Validation.quantity('Valid days', 1, true),
    },
    onSubmit: async (values) => {
      const today = new Date();
      const validTo = new Date();
      validTo.setDate(today.getDate() + parseInt(values.valid_days, 10));

      const payload: any = {
        code: values.code.toUpperCase().trim(),
        discount_type: values.discount_type,
        discount_value: parseFloat(values.discount_value),
        min_spend: parseFloat(values.min_spend) || 0,
        valid_from: today.toISOString().split('T')[0],
        valid_to: validTo.toISOString().split('T')[0],
        description: values.description.trim(),
        audience_type: audienceType,
      };

      if (audienceType === 'SPECIFIC') {
        payload.client_ids = selectedClientIds;
      }

      await api.post('/loyalty/coupons/', payload);
      clearApiCache('/loyalty/');
      invalidateLoyalty();
      setIsModalOpen(false);
      couponForm.reset();
      setSelectedClientIds([]);
      setAudienceType('ALL');
    },
  });

  // Open Edit Modal with coupon values
  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setEditDiscountType(c.discount_type);
    setEditDiscountVal(String(c.discount_value));
    setEditMinSpend(String(c.min_spend || c.min_order_amount || '0'));
    setEditDesc(c.description || '');
    setEditError(null);
  };

  // Save edited coupon
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      setIsSavingEdit(true);
      setEditError(null);
      await api.patch(`/loyalty/coupons/${editingCoupon.id}/`, {
        discount_type: editDiscountType,
        discount_value: parseFloat(editDiscountVal),
        min_spend: parseFloat(editMinSpend) || 0,
        description: editDesc.trim(),
      });
      clearApiCache('/loyalty/');
      invalidateLoyalty();
      setEditingCoupon(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to update coupon.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm delete coupon
  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await api.delete(`/loyalty/coupons/${deletingCoupon.id}/`);
      clearApiCache('/loyalty/');
      invalidateLoyalty();
      setDeletingCoupon(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to delete coupon.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter clients for audience search
  const filteredClients = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return allClients.slice(0, 10);
    return allClients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 15);
  }, [allClients, clientSearchQuery]);

  // Selected client objects
  const selectedClientsList = useMemo(() => {
    return allClients.filter((c) => selectedClientIds.includes(c.id));
  }, [allClients, selectedClientIds]);

  // Modal scroll locking
  const isAnyModalOpen = isModalOpen || Boolean(editingCoupon) || Boolean(deletingCoupon);
  useEffect(() => {
    if (!isAnyModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingCoupon) setDeletingCoupon(null);
        else if (editingCoupon) setEditingCoupon(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, deletingCoupon, editingCoupon, isModalOpen]);

  return (
    <div className="space-y-8 page-enter font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Loyalty & Promotional Offers
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Boost customer retention with VIP membership tiers and promotional coupon codes in INR (₹).
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setAudienceType('ALL');
            setSelectedClientIds([]);
          }}
          className="btn-primary btn-md shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Coupon</span>
        </button>
      </div>

      {/* Promo Coupons */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#2868ff] dark:text-[#4D68FF]" />
          Active Discount Coupons
        </h2>
        {isLoading ? (
          <CardGridSkeleton count={3} columns="3" />
        ) : coupons.length === 0 ? (
          <div className="card-surface p-8 text-center text-xs text-[var(--text-secondary)]">
            No active promo coupons found. Click "Create Promo Coupon" above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="card-surface p-5 relative overflow-hidden flex flex-col justify-between hover:border-[#2868ff]/40 hover:-translate-y-0.5 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#2868ff] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] px-2.5 py-1 rounded-lg border border-[#2868ff]/20">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#059669] dark:text-[#10B981] px-2 py-0.5 rounded-full bg-[#F0FDF4] dark:bg-[#142A1D] border border-[#059669]/30">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `${formatINR(c.discount_value)} OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] mt-2 font-medium">
                    {c.description || 'Special client promotion'}
                  </p>
                  <div className="mt-3 text-[11px] text-[var(--text-secondary)] space-y-1 pt-2 border-t border-[var(--border)]">
                    <p className="flex justify-between">
                      <span>Min Spend:</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatINR(c.min_spend || c.min_order_amount || 0)}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Valid until:</span>
                      <span className="font-medium text-[var(--text-primary)]">{c.valid_to || 'Ongoing'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Redeemed:</span>
                      <span className="font-semibold text-[#059669] dark:text-[#10B981] tabular-nums">
                        {c.used_count ?? c.times_used ?? 0} times
                      </span>
                    </p>
                  </div>
                </div>

                {/* Card Action Controls: Edit & Delete */}
                <div className="mt-4 pt-2.5 border-t border-[var(--border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="btn-outline btn-xs flex items-center gap-1 text-[var(--text-secondary)] hover:text-[#2868ff]"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCoupon(c)}
                    className="btn-outline btn-xs flex items-center gap-1 text-red-500 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership Plans */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
          VIP Membership Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className="card-surface p-6 flex flex-col justify-between hover:border-[#2868ff]/40 hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{p.name}</h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EEF2FF] dark:bg-[#1E294B] text-[#2868ff] dark:text-[#4D68FF] rounded-full border border-[#2868ff]/20">
                    {p.tier}
                  </span>
                </div>
                <p className="text-2xl font-sans font-bold text-[var(--text-primary)] mt-2 tabular-nums">
                  {formatINR(p.price)}
                  <span className="text-xs font-normal text-[var(--text-secondary)]">/{(p.billing_cycle || 'month').toLowerCase()}</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{p.description}</p>
                <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 text-xs text-[var(--text-primary)]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#059669] dark:text-[#10B981] shrink-0" />
                    <span>{p.discount_percentage}% discount on all services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#059669] dark:text-[#10B981] shrink-0" />
                    <span>{p.free_services_count} complimentary treatment/mo</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Coupon Modal using createPortal with z-[100] */}
      {isModalOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !couponForm.isSubmitting) {
                setIsModalOpen(false);
                couponForm.reset();
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Create Promotional Coupon</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Issue a discount voucher with audience targeting</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    couponForm.reset();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {couponForm.submitError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{couponForm.submitError}</span>
                </div>
              )}

              <form onSubmit={couponForm.handleSubmit} noValidate className="space-y-3.5 text-xs">
                <FormField
                  id="cpnCode"
                  label="Coupon Code"
                  required
                  error={couponForm.errors.code}
                  touched={couponForm.touched.code}
                >
                  <input
                    id="cpnCode"
                    type="text"
                    placeholder="e.g. FESTIVE20"
                    value={couponForm.values.code}
                    onChange={couponForm.handleChange('code')}
                    onBlur={couponForm.handleBlur('code')}
                    className={`input-field font-mono uppercase ${
                      couponForm.touched.code && couponForm.errors.code ? 'input-error' : ''
                    }`}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Discount Type <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={couponForm.values.discount_type}
                      onChange={(v) => couponForm.setFieldValue('discount_type', v as any)}
                      options={[
                        { value: 'PERCENTAGE', label: 'Percentage (%)' },
                        { value: 'FIXED', label: 'Fixed Amount (₹)' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <FormField
                    id="cpnVal"
                    label={couponForm.values.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
                    required
                    error={couponForm.errors.discount_value}
                    touched={couponForm.touched.discount_value}
                  >
                    <input
                      id="cpnVal"
                      type="number"
                      step="1"
                      min="1"
                      max={couponForm.values.discount_type === 'PERCENTAGE' ? 100 : undefined}
                      value={couponForm.values.discount_value}
                      onChange={couponForm.handleChange('discount_value')}
                      onBlur={couponForm.handleBlur('discount_value')}
                      className={`input-field ${
                        couponForm.touched.discount_value && couponForm.errors.discount_value ? 'input-error' : ''
                      }`}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="minSpend"
                    label="Minimum Spend (₹)"
                    error={couponForm.errors.min_spend}
                    touched={couponForm.touched.min_spend}
                  >
                    <input
                      id="minSpend"
                      type="number"
                      step="1"
                      min="0"
                      value={couponForm.values.min_spend}
                      onChange={couponForm.handleChange('min_spend')}
                      onBlur={couponForm.handleBlur('min_spend')}
                      className="input-field"
                    />
                  </FormField>

                  <FormField
                    id="validDays"
                    label="Valid For (Days)"
                    required
                    error={couponForm.errors.valid_days}
                    touched={couponForm.touched.valid_days}
                  >
                    <input
                      id="validDays"
                      type="number"
                      min="1"
                      value={couponForm.values.valid_days}
                      onChange={couponForm.handleChange('valid_days')}
                      onBlur={couponForm.handleBlur('valid_days')}
                      className="input-field"
                    />
                  </FormField>
                </div>

                {/* Audience Targeting Section */}
                <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-2.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Audience Targeting
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAudienceType('ALL')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        audienceType === 'ALL'
                          ? 'bg-[#2868ff] text-white shadow-xs'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-secondary)]'
                      }`}
                    >
                      All Clients
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceType('SPECIFIC')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        audienceType === 'SPECIFIC'
                          ? 'bg-[#2868ff] text-white shadow-xs'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-secondary)]'
                      }`}
                    >
                      Specific Clients ({selectedClientIds.length})
                    </button>
                  </div>

                  {audienceType === 'SPECIFIC' && (
                    <div className="space-y-2 pt-1 animate-fade-in">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search clients by name or phone..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="input-field pl-8 !py-1 text-xs"
                        />
                      </div>

                      {/* Client selection search dropdown results */}
                      <div className="max-h-32 overflow-y-auto border border-[var(--border)] rounded-lg bg-[var(--surface)] divide-y divide-[var(--border)]">
                        {filteredClients.length === 0 ? (
                          <p className="p-2 text-center text-[11px] text-[var(--text-secondary)]">No clients found</p>
                        ) : (
                          filteredClients.map((cl) => {
                            const isSelected = selectedClientIds.includes(cl.id);
                            return (
                              <button
                                key={cl.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedClientIds(selectedClientIds.filter((id) => id !== cl.id));
                                  } else {
                                    setSelectedClientIds([...selectedClientIds, cl.id]);
                                  }
                                }}
                                className={`w-full p-2 text-left text-xs flex items-center justify-between hover:bg-[var(--surface-secondary)] transition-colors ${
                                  isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''
                                }`}
                              >
                                <div>
                                  <p className="text-[var(--text-primary)]">{cl.full_name}</p>
                                  <p className="text-[10px] text-[var(--text-secondary)]">{cl.phone}</p>
                                </div>
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-[#2868ff]" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Selected client badges */}
                      {selectedClientsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedClientsList.map((cl) => (
                            <span
                              key={cl.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EEF2FF] text-[#2868ff] dark:bg-[#1E294B] dark:text-[#4D68FF] border border-[#2868ff]/20"
                            >
                              <span>{cl.full_name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedClientIds(selectedClientIds.filter((id) => id !== cl.id))}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <FormField
                  id="cpnDesc"
                  label="Description / Terms"
                  error={couponForm.errors.description}
                  touched={couponForm.touched.description}
                >
                  <textarea
                    id="cpnDesc"
                    rows={2}
                    placeholder="Offer details visible to client..."
                    value={couponForm.values.description}
                    onChange={couponForm.handleChange('description')}
                    className="textarea-field text-xs"
                  />
                </FormField>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      couponForm.reset();
                    }}
                    className="btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={couponForm.isSubmitting}
                    className="btn-primary btn-sm"
                  >
                    {couponForm.isSubmitting ? 'Creating Coupon...' : 'Save Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Coupon Modal using createPortal with z-[100] */}
      {editingCoupon &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSavingEdit) {
                setEditingCoupon(null);
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Coupon: {editingCoupon.code}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Update discount terms and conditions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Discount Type
                    </label>
                    <CustomSelect
                      value={editDiscountType}
                      onChange={(v) => setEditDiscountType(v as any)}
                      options={[
                        { value: 'PERCENTAGE', label: 'Percentage (%)' },
                        { value: 'FIXED', label: 'Fixed Amount (₹)' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max={editDiscountType === 'PERCENTAGE' ? 100 : undefined}
                      value={editDiscountVal}
                      onChange={(e) => setEditDiscountVal(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Minimum Spend (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editMinSpend}
                    onChange={(e) => setEditMinSpend(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
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
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Coupon Confirmation Modal using createPortal with z-[100] */}
      {deletingCoupon &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setDeletingCoupon(null);
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4 animate-scale-in"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Coupon</h3>
                  <p className="text-xs text-[var(--text-secondary)]">This action will deactivate this code</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs">
                <p className="font-bold text-[var(--text-primary)] font-mono">{deletingCoupon.code}</p>
                <p className="text-[var(--text-secondary)] mt-0.5">
                  {deletingCoupon.discount_type === 'PERCENTAGE'
                    ? `${deletingCoupon.discount_value}% discount`
                    : `₹${deletingCoupon.discount_value} discount`}
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingCoupon(null)}
                  className="btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCoupon}
                  className="btn-danger btn-sm flex items-center gap-1.5 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
