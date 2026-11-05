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
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatINR } from '../../utils/currency';
import { useServices, useCategories, useStaff, useInvalidateQueries } from '../../hooks/useQueries';
import { FormField } from '../../components/ui/FormField';
import { Validation, extractBackendErrors } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const ServicesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageServices = hasPermission('MANAGE_SERVICES');

  const { data: services = [], isLoading: isServicesLoading } = useServices();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: staffList = [] } = useStaff();
  const { invalidateCatalog } = useInvalidateQueries();

  const isLoading = isServicesLoading && isCategoriesLoading && services.length === 0 && categories.length === 0;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // New Service Modal & Validation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const serviceForm = useFormValidation({
    initialValues: {
      name: '',
      category: '',
      price: '',
      discount_price: '',
      duration_minutes: '45',
      description: '',
      is_featured: false,
    },
    validationSchema: {
      name: Validation.name('Service name', 2, 80, true),
      category: Validation.required('Category'),
      price: Validation.price('Service price', 1, true),
      duration_minutes: Validation.quantity('Duration', 5, true),
      discount_price: (val: string, all: any) => {
        if (!val || val.trim() === '') return null;
        const dp = Number(val);
        const p = Number(all.price);
        if (isNaN(dp) || dp < 0) return 'Discount price must be a valid positive amount.';
        if (!isNaN(p) && p > 0 && dp >= p) return 'Discount price must be lower than original price.';
        return null;
      },
    },
    onSubmit: async (values) => {
      const payload: any = {
        name: values.name.trim(),
        category: values.category || (categories.length > 0 ? categories[0].id : ''),
        price: parseFloat(values.price),
        duration_minutes: parseInt(values.duration_minutes, 10),
        description: values.description.trim(),
        is_featured: values.is_featured,
      };
      if (values.discount_price.trim()) {
        payload.discount_price = parseFloat(values.discount_price);
      }

      await api.post('/catalog/services/', payload);
      invalidateCatalog();
      setIsModalOpen(false);
      serviceForm.reset();
    },
  });

  // Category Modal & Validation
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const categoryForm = useFormValidation({
    initialValues: {
      name: '',
      description: '',
    },
    validationSchema: {
      name: Validation.name('Category name', 2, 50, true),
    },
    onSubmit: async (values) => {
      await api.post('/catalog/categories/', {
        name: values.name.trim(),
        description: values.description.trim(),
      });
      invalidateCatalog();
      setIsCatModalOpen(false);
      categoryForm.reset();
    },
  });

  // Default first category
  useEffect(() => {
    if (categories.length > 0 && !serviceForm.values.category) {
      serviceForm.setFieldValue('category', categories[0].id);
    }
  }, [categories, serviceForm.values.category]);

  const filteredServices = React.useMemo(() => {
    return activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Services & Treatments Catalog
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Configure hair, spa, bridal, and skincare treatments with pricing in INR, durations, and qualified stylists.
          </p>
        </div>

        {canManageServices && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="btn-outline btn-md shadow-xs"
            >
              <Layers className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
              <span>New Category</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary btn-md shadow-sm"
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
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[#0A24E9] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-slate-400'
          }`}
        >
          All Services ({services.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
              activeCategory === c.id
                ? 'bg-[#0A24E9] text-white shadow-xs'
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
          <Scissors className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mt-3">No Services in this Category</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Get started by creating your first salon treatment.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 btn-primary btn-md shadow-sm">
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className="card-surface p-5 hover:border-[#0A24E9]/40 hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border)]">
                    {svc.category_name || 'General'}
                  </span>
                  {svc.is_featured && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] rounded-md border border-[#5C9764]/30 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Featured
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)]">{svc.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {svc.description || 'Premium salon treatment customized to client style and condition.'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0A24E9] dark:text-[#4D68FF]" />
                    {svc.duration_minutes} mins
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[var(--text-primary)] tabular-nums">
                    {formatINR(svc.effective_price || svc.price)}
                    {svc.discount_price && (
                      <span className="line-through text-[var(--text-secondary)] font-normal ml-1">
                        {formatINR(svc.price)}
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
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add New Service</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  serviceForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            {serviceForm.submitError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{serviceForm.submitError}</span>
              </div>
            )}
            <form onSubmit={serviceForm.handleSubmit} noValidate className="space-y-4 text-xs">
              <FormField
                id="svcName"
                label="Service Name"
                required
                error={serviceForm.errors.name}
                touched={serviceForm.touched.name}
              >
                <input
                  id="svcName"
                  type="text"
                  placeholder="e.g. Hair Spa & Deep Conditioning"
                  value={serviceForm.values.name}
                  onChange={serviceForm.handleChange('name')}
                  onBlur={serviceForm.handleBlur('name')}
                  className={`input-field ${serviceForm.touched.name && serviceForm.errors.name ? 'input-error' : ''}`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="svcCat"
                  label="Category"
                  required
                  error={serviceForm.errors.category}
                  touched={serviceForm.touched.category}
                >
                  <CustomSelect
                    value={serviceForm.values.category}
                    onChange={(val) => serviceForm.setFieldValue('category', val)}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </FormField>

                <FormField
                  id="svcDuration"
                  label="Duration (Minutes)"
                  required
                  error={serviceForm.errors.duration_minutes}
                  touched={serviceForm.touched.duration_minutes}
                >
                  <input
                    id="svcDuration"
                    type="number"
                    min="5"
                    step="5"
                    value={serviceForm.values.duration_minutes}
                    onChange={serviceForm.handleChange('duration_minutes')}
                    onBlur={serviceForm.handleBlur('duration_minutes')}
                    className={`input-field ${serviceForm.touched.duration_minutes && serviceForm.errors.duration_minutes ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="svcPrice"
                  label="Price (₹)"
                  required
                  error={serviceForm.errors.price}
                  touched={serviceForm.touched.price}
                >
                  <input
                    id="svcPrice"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 1200"
                    value={serviceForm.values.price}
                    onChange={serviceForm.handleChange('price')}
                    onBlur={serviceForm.handleBlur('price')}
                    className={`input-field ${serviceForm.touched.price && serviceForm.errors.price ? 'input-error' : ''}`}
                  />
                </FormField>

                <FormField
                  id="svcDiscountPrice"
                  label="Discount Price (Optional ₹)"
                  error={serviceForm.errors.discount_price}
                  touched={serviceForm.touched.discount_price}
                >
                  <input
                    id="svcDiscountPrice"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Leave empty if none"
                    value={serviceForm.values.discount_price}
                    onChange={serviceForm.handleChange('discount_price')}
                    onBlur={serviceForm.handleBlur('discount_price')}
                    className={`input-field ${serviceForm.touched.discount_price && serviceForm.errors.discount_price ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <FormField
                id="svcDesc"
                label="Description"
                error={serviceForm.errors.description}
                touched={serviceForm.touched.description}
              >
                <textarea
                  id="svcDesc"
                  rows={2}
                  placeholder="Service highlights, formulas used..."
                  value={serviceForm.values.description}
                  onChange={serviceForm.handleChange('description')}
                  className="textarea-field"
                />
              </FormField>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={serviceForm.values.is_featured}
                  onChange={serviceForm.handleChange('is_featured')}
                  className="w-4 h-4 rounded text-[#0A24E9] focus:ring-[#0A24E9] cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                  Feature on Salon Website Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    serviceForm.reset();
                  }}
                  className="btn-ghost btn-md"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={serviceForm.isSubmitting}
                  className="btn-primary btn-md shadow-sm disabled:opacity-50"
                >
                  <span>{serviceForm.isSubmitting ? 'Saving Service...' : 'Save Service'}</span>
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
              <h3 className="text-base font-bold text-[var(--text-primary)]">New Service Category</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCatModalOpen(false);
                  categoryForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            {categoryForm.submitError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{categoryForm.submitError}</span>
              </div>
            )}
            <form onSubmit={categoryForm.handleSubmit} noValidate className="space-y-4 text-xs">
              <FormField
                id="newCatName"
                label="Category Name"
                required
                error={categoryForm.errors.name}
                touched={categoryForm.touched.name}
              >
                <input
                  id="newCatName"
                  type="text"
                  placeholder="e.g. Bridal Makeup & Mehendi"
                  value={categoryForm.values.name}
                  onChange={categoryForm.handleChange('name')}
                  onBlur={categoryForm.handleBlur('name')}
                  className={`input-field ${categoryForm.touched.name && categoryForm.errors.name ? 'input-error' : ''}`}
                />
              </FormField>

              <FormField
                id="newCatDesc"
                label="Description"
                error={categoryForm.errors.description}
                touched={categoryForm.touched.description}
              >
                <textarea
                  id="newCatDesc"
                  rows={2}
                  placeholder="Brief summary of treatments in this category"
                  value={categoryForm.values.description}
                  onChange={categoryForm.handleChange('description')}
                  className="textarea-field"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCatModalOpen(false);
                    categoryForm.reset();
                  }}
                  className="btn-ghost btn-md"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={categoryForm.isSubmitting}
                  className="btn-primary btn-md disabled:opacity-50"
                >
                  <span>{categoryForm.isSubmitting ? 'Creating Category...' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
