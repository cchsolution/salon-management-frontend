import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Clock,
  IndianRupee,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Service, ServiceCategory, StaffProfile } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';

export const ServicesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageServices = hasPermission('MANAGE_SERVICES');

  const [services, setServices] = useState<Service[]>(() => {
    const c = api.getCached<{ results?: Service[] } | Service[]>('/catalog/services/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const c = api.getCached<{ results?: ServiceCategory[] } | ServiceCategory[]>('/catalog/categories/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [staffList, setStaffList] = useState<StaffProfile[]>(() => {
    const c = api.getCached<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(() => services.length === 0 && categories.length === 0);

  // New Service Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [svcName, setSvcName] = useState('');
  const [svcCategory, setSvcCategory] = useState(() => (categories.length > 0 ? categories[0].id : ''));
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDiscountPrice, setSvcDiscountPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('45');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcFeatured, setSvcFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (services.length === 0) {
      setIsLoading(true);
    }
    try {
      const [svcRes, catRes, staffRes] = await Promise.all([
        api.get<{ results?: Service[] } | Service[]>('/catalog/services/'),
        api.get<{ results?: ServiceCategory[] } | ServiceCategory[]>('/catalog/categories/'),
        api.get<{ results?: StaffProfile[] } | StaffProfile[]>('/catalog/staff/'),
      ]);

      const sList = Array.isArray(svcRes) ? svcRes : svcRes.results || [];
      const cList = Array.isArray(catRes) ? catRes : catRes.results || [];
      const stList = Array.isArray(staffRes) ? staffRes : staffRes.results || [];

      setServices(sList);
      setCategories(cList);
      setStaffList(stList);

      if (cList.length > 0 && !svcCategory) {
        setSvcCategory(cList[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload: any = {
        name: svcName,
        category: svcCategory,
        price: parseFloat(svcPrice),
        duration_minutes: parseInt(svcDuration),
        description: svcDesc,
        is_featured: svcFeatured,
      };
      if (svcDiscountPrice) {
        payload.discount_price = parseFloat(svcDiscountPrice);
      }

      await api.post('/catalog/services/', payload);
      setIsModalOpen(false);
      setSvcName('');
      setSvcPrice('');
      setSvcDiscountPrice('');
      setSvcDesc('');
      setSvcFeatured(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create service.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalog/categories/', {
        name: newCatName,
        description: newCatDesc,
      });
      setIsCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  const filteredServices =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6 page-enter">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Services & Treatments Catalog
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Configure hair, spa, bridal, and skincare treatments with pricing in INR, durations, and qualified stylists.
          </p>
        </div>

        {canManageServices && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="btn-outline btn-md"
            >
              <Layers className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
              <span>New Category</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary btn-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 ${
            activeCategory === 'all'
              ? 'bg-[#6D28D9] dark:bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-slate-400'
          }`}
        >
          All Services ({services.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 ${
              activeCategory === c.id
                ? 'bg-[#6D28D9] dark:bg-[#8B5CF6] text-white shadow-sm'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-slate-400'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} columns="3" />
      ) : filteredServices.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Scissors className="w-10 h-10 text-purple-300 dark:text-purple-800 mx-auto" />
          <h3 className="text-base font-serif font-bold text-[var(--text-primary)] mt-3">No Services in this Category</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Get started by creating your first salon treatment.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 btn-primary btn-md">
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className="card-surface p-5 hover:border-[#6D28D9]/40 hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border)]">
                    {svc.category_name || 'General'}
                  </span>
                  {svc.is_featured && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-md border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Featured
                    </span>
                  )}
                </div>

                <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">{svc.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {svc.description || 'Premium salon treatment customized to client style and condition.'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#8B5CF6]" />
                    {svc.duration_minutes} mins
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[var(--text-primary)]">
                    <IndianRupee className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981]" />
                    ₹{Number(svc.effective_price || svc.price).toLocaleString('en-IN')}
                    {svc.discount_price && (
                      <span className="line-through text-[var(--text-secondary)] font-normal ml-1">
                        ₹{Number(svc.price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Qualified Stylists Badges */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Qualified Stylists:</span>
                <div className="flex flex-wrap gap-1">
                  {svc.qualified_staff_details && svc.qualified_staff_details.length > 0 ? (
                    svc.qualified_staff_details.map((stf) => (
                      <span
                        key={stf.id}
                        className="px-2 py-0.5 text-[10px] bg-[var(--surface-secondary)] text-[var(--text-primary)] font-medium rounded border border-[var(--border)]"
                      >
                        {stf.user_details?.full_name?.split(' ')[0] || stf.title}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-[var(--text-secondary)] italic">All available stylists</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Add New Service</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            {formError && <p className="text-xs text-[#DC2626] bg-[#DC2626]/10 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">{formError}</p>}
            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Hair Spa & Deep Conditioning"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Category</label>
                  <select
                    value={svcCategory}
                    onChange={(e) => setSvcCategory(e.target.value)}
                    className="select-field"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1200"
                    value={svcPrice}
                    onChange={(e) => setSvcPrice(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Discount Price (Optional ₹)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Leave empty if none"
                    value={svcDiscountPrice}
                    onChange={(e) => setSvcDiscountPrice(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Service highlights, formulas used..."
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={svcFeatured}
                  onChange={(e) => setSvcFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6D28D9] focus:ring-[#6D28D9] cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                  Feature on Salon Website Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">New Service Category</h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bridal Makeup & Mehendi"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of treatments in this category"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="textarea-field"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
