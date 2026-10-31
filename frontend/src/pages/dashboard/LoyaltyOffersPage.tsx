import React, { useState, useEffect } from 'react';
import { Award, Plus, Tag, Check, Calendar, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';
import { MembershipPlan, Coupon } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';

export const LoyaltyOffersPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>(() => {
    const c = api.getCached<{ results?: MembershipPlan[] } | MembershipPlan[]>('/loyalty/plans/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const c = api.getCached<{ results?: Coupon[] } | Coupon[]>('/loyalty/coupons/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [isLoading, setIsLoading] = useState(() => plans.length === 0 && coupons.length === 0);

  // New Coupon Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discType, setDiscType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discVal, setDiscVal] = useState('20');
  const [minSpend, setMinSpend] = useState('500');
  const [validDays, setValidDays] = useState('60');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    if (plans.length === 0 && coupons.length === 0) {
      setIsLoading(true);
    }
    try {
      const [plansRes, coupRes] = await Promise.all([
        api.get<{ results?: MembershipPlan[] } | MembershipPlan[]>('/loyalty/plans/'),
        api.get<{ results?: Coupon[] } | Coupon[]>('/loyalty/coupons/'),
      ]);

      setPlans(Array.isArray(plansRes) ? plansRes : plansRes.results || []);
      setCoupons(Array.isArray(coupRes) ? coupRes : coupRes.results || []);
    } catch {
      setPlans([]);
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    try {
      const today = new Date();
      const validTo = new Date();
      validTo.setDate(today.getDate() + parseInt(validDays, 10));

      await api.post('/loyalty/coupons/', {
        code: code.toUpperCase(),
        discount_type: discType,
        discount_value: parseFloat(discVal),
        min_spend: parseFloat(minSpend),
        valid_from: today.toISOString().split('T')[0],
        valid_to: validTo.toISOString().split('T')[0],
        description: desc,
      });

      setIsModalOpen(false);
      setCode('');
      setDesc('');
      fetchLoyaltyData();
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon.');
    }
  };

  return (
    <div className="space-y-8 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Loyalty & Promotional Offers
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Boost customer retention with VIP membership tiers and promotional coupon codes in INR (₹).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary btn-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Coupon</span>
        </button>
      </div>

      {/* Promo Coupons */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
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
                className="card-surface p-5 relative overflow-hidden flex flex-col justify-between hover:border-[#6D28D9]/40 hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/40">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-[#059669] dark:text-[#10B981] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] mt-2 font-medium">{c.description || 'Special client promo'}</p>
                  <div className="mt-3 text-[11px] text-[var(--text-secondary)] space-y-1 pt-2 border-t border-[var(--border)]">
                    <p className="flex justify-between"><span>Min Spend:</span> <span className="font-semibold text-[var(--text-primary)]">₹{c.min_spend}</span></p>
                    <p className="flex justify-between"><span>Valid until:</span> <span className="font-medium text-[var(--text-primary)]">{c.valid_to}</span></p>
                    <p className="flex justify-between"><span>Redeemed:</span> <span className="font-semibold text-[#059669] dark:text-[#10B981]">{c.used_count} times</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership Plans */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
          VIP Membership Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className="card-surface p-6 flex flex-col justify-between hover:border-[#6D28D9]/40 hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">{p.name}</h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] rounded-full border border-purple-200 dark:border-purple-800/40">
                    {p.tier}
                  </span>
                </div>
                <p className="text-2xl font-serif font-bold text-[var(--text-primary)] mt-2">
                  ₹{Number(p.price).toLocaleString('en-IN')}
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
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">New Promo Coupon</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-field font-mono uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Discount Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as any)}
                    className="select-field"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Discount Value</label>
                  <input
                    type="number"
                    step="1"
                    value={discVal}
                    onChange={(e) => setDiscVal(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Valid Days</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Offer details visible to client..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
