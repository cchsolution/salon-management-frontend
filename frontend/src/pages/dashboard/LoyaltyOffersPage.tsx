import React, { useState } from 'react';
import { Award, Plus, Tag, Check, Calendar, IndianRupee, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { MembershipPlan, Coupon } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatINR } from '../../utils/currency';
import { useLoyaltyPlans, useCoupons, useInvalidateQueries } from '../../hooks/useQueries';
import { FormField } from '../../components/ui/FormField';
import { Validation } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const LoyaltyOffersPage: React.FC = () => {
  const { data: plans = [], isLoading: isPlansLoading } = useLoyaltyPlans();
  const { data: coupons = [], isLoading: isCouponsLoading } = useCoupons();
  const { invalidateLoyalty } = useInvalidateQueries();
  const isLoading = isPlansLoading && isCouponsLoading && plans.length === 0 && coupons.length === 0;

  // New Coupon Modal & Validation
  const [isModalOpen, setIsModalOpen] = useState(false);
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

      await api.post('/loyalty/coupons/', {
        code: values.code.toUpperCase().trim(),
        discount_type: values.discount_type,
        discount_value: parseFloat(values.discount_value),
        min_spend: parseFloat(values.min_spend) || 0,
        valid_from: today.toISOString().split('T')[0],
        valid_to: validTo.toISOString().split('T')[0],
        description: values.description.trim(),
      });

      invalidateLoyalty();
      setIsModalOpen(false);
      couponForm.reset();
    },
  });

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
          onClick={() => setIsModalOpen(true)}
          className="btn-primary btn-md shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Coupon</span>
        </button>
      </div>

      {/* Promo Coupons */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
          Active Discount Coupons
        </h2>
        {isLoading ? (
          <CardGridSkeleton count={3} columns="3" />
        ) : coupons.length === 0 ? (
          <div className="card-surface p-8 text-center text-xs text-[var(--text-secondary)]">
            No active promo coupons found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="card-surface p-5 relative overflow-hidden flex flex-col justify-between hover:border-[#0A24E9]/40 hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#0A24E9] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] px-2.5 py-1 rounded-lg border border-[#0A24E9]/20">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#5C9764] dark:text-[#7DB585] px-2 py-0.5 rounded-full bg-[#F0FDF4] dark:bg-[#142A1D] border border-[#5C9764]/30">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `${formatINR(c.discount_value)} OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] mt-2 font-medium">{c.description || 'Special client promo'}</p>
                  <div className="mt-3 text-[11px] text-[var(--text-secondary)] space-y-1 pt-2 border-t border-[var(--border)]">
                    <p className="flex justify-between"><span>Min Spend:</span> <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(c.min_spend || 0)}</span></p>
                    <p className="flex justify-between"><span>Valid until:</span> <span className="font-medium text-[var(--text-primary)]">{c.valid_to}</span></p>
                    <p className="flex justify-between"><span>Redeemed:</span> <span className="font-semibold text-[#5C9764] dark:text-[#7DB585]">{c.used_count} times</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership Plans */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585]" />
          VIP Membership Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className="card-surface p-6 flex flex-col justify-between hover:border-[#0A24E9]/40 hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{p.name}</h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] rounded-full border border-[#0A24E9]/20">
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

      {/* Add Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">New Promo Coupon</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  couponForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
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
                  className={`input-field font-mono uppercase ${couponForm.touched.code && couponForm.errors.code ? 'input-error' : ''}`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC] mb-1.5">Discount Type</label>
                  <CustomSelect
                    value={couponForm.values.discount_type}
                    onChange={(v) => couponForm.setFieldValue('discount_type', v as any)}
                    options={[
                      { value: 'PERCENTAGE', label: 'Percentage (%)' },
                      { value: 'FIXED', label: 'Fixed Amount (₹)' },
                    ]}
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
                    className={`input-field ${couponForm.touched.discount_value && couponForm.errors.discount_value ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="minSpend"
                  label="Min Spend (₹)"
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
                    className={`input-field ${couponForm.touched.min_spend && couponForm.errors.min_spend ? 'input-error' : ''}`}
                  />
                </FormField>

                <FormField
                  id="validDays"
                  label="Valid Days"
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
                    className={`input-field ${couponForm.touched.valid_days && couponForm.errors.valid_days ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <FormField
                id="cpnDesc"
                label="Description"
                error={couponForm.errors.description}
                touched={couponForm.touched.description}
              >
                <textarea
                  id="cpnDesc"
                  rows={2}
                  placeholder="Offer details visible to client..."
                  value={couponForm.values.description}
                  onChange={couponForm.handleChange('description')}
                  className="textarea-field"
                />
              </FormField>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    couponForm.reset();
                  }}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponForm.isSubmitting}
                  className="btn-primary btn-md disabled:opacity-50"
                >
                  {couponForm.isSubmitting ? 'Saving Coupon...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
