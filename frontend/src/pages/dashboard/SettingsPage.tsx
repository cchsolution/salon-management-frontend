import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Save,
  MapPin,
  Clock,
  Plus,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Branch, Salon } from '../../types';
import { FormField } from '../../components/ui/FormField';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Validation } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const SettingsPage: React.FC = () => {
  const { salon, branches, setSalon, branch, setBranch } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const SHOW_BRANCH_MANAGEMENT = false;

  // Salon Profile Form & Validation
  const salonForm = useFormValidation({
    initialValues: {
      name: salon?.name || '',
      email: salon?.email || '',
      phone: salon?.phone || '',
      address: salon?.address || '',
      tax_rate: salon?.tax_rate?.toString() || '18.00',
    },
    validationSchema: {
      name: Validation.name('Salon name', 2, 80, true),
      email: Validation.email(false),
      phone: Validation.phone(false, 'IN'),
      tax_rate: (val: string) => {
        const allowed = ['0', '0.00', '5', '5.00', '18', '18.00', '40', '40.00'];
        if (!allowed.includes(String(val))) {
          return 'Please select a valid GST tax rate (0%, 5%, 18%, or 40%).';
        }
        return null;
      },
      address: (val: string) => {
        const trimmed = (val ?? '').trim();
        if (trimmed && trimmed.length < 5) return 'Address must be at least 5 characters.';
        return null;
      },
    },
    onSubmit: async (values) => {
      if (!salon) return;
      setSaveSuccess(false);
      const updated = await api.patch<Salon>(`/salons/${salon.slug}/`, {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        tax_rate: parseFloat(values.tax_rate) || 0,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      });
      clearApiCache('/salons/');
      setSalon(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    },
  });

  const suggestedSlug = useMemo(() => {
    return (salonForm.values.name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }, [salonForm.values.name]);

  // Branch creation modal & validation
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const branchForm = useFormValidation({
    initialValues: {
      name: '',
      city: 'Himmatnagar',
      address: '',
      opening_time: '09:00',
      closing_time: '20:00',
    },
    validationSchema: {
      name: Validation.name('Branch name', 2, 60, true),
      city: Validation.name('City', 2, 40, true),
      address: Validation.name('Full address', 5, 200, true),
      opening_time: Validation.required('Opening time'),
      closing_time: (val: string, all: any) => {
        if (!val) return 'Closing time is required.';
        if (all.opening_time && val <= all.opening_time) {
          return 'Closing time must be after opening time.';
        }
        return null;
      },
    },
    onSubmit: async (values) => {
      await api.post('/branches/', {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        opening_time: `${values.opening_time}:00`,
        closing_time: `${values.closing_time}:00`,
      });
      setIsBranchModalOpen(false);
      branchForm.reset();
      window.location.reload();
    },
  });

  useEffect(() => {
    if (salon) {
      salonForm.setFieldValue('name', salon.name);
      salonForm.setFieldValue('email', salon.email || '');
      salonForm.setFieldValue('phone', salon.phone || '');
      salonForm.setFieldValue('address', salon.address || '');
      salonForm.setFieldValue('tax_rate', salon.tax_rate?.toString() || '18.00');
    }
  }, [salon]);

  const themeOptions: { mode: ThemeMode; label: string; desc: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Light Mode (Default)', desc: 'Crisp #F0F2F5 canvas with White cards & Royal Blue brand accents', icon: Sun },
    { mode: 'dark', label: 'Dark Mode (Engineered)', desc: 'Sophisticated #0E1222 midnight navy backdrop with #141A2E surfaces', icon: Moon },
    { mode: 'system', label: 'System Sync', desc: 'Dynamically aligns with your operating system preference', icon: Laptop },
  ];

  return (
    <div className="space-y-8 page-enter font-sans">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
          Salon Organization Settings
        </h1>
        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
          Manage brand configuration, physical studio branches in Gujarat, operating hours, and appearance.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 text-xs text-[#5C9764] dark:text-[#7DB585] bg-[#F0FDF4] dark:bg-[#142A1D] border border-[#5C9764]/30 rounded-xl font-semibold animate-fadeIn">
          Salon settings saved successfully!
        </div>
      )}

      {/* Theme & Visual System Settings */}
      <div className="card-surface p-6 space-y-4">
        <h3 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
          Visual Theme & Display Preferences
        </h3>
        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
          Choose the global color mode for your dashboard and management modules. Persisted across sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setThemeMode(opt.mode)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 relative hover:-translate-y-0.5 cursor-pointer ${isSelected
                    ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] dark:border-[#4D68FF] shadow-sm ring-1 ring-[#0A24E9]/30'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[#0A24E9]/40 hover:shadow-xs'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-[#0A24E9] text-white shadow-xs' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585]" />}
                </div>
                <p className="font-bold text-xs text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={salonForm.handleSubmit} noValidate className="card-surface p-6 space-y-5 text-xs">
        <h3 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
          <Building className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
          General Salon Profile (India)
        </h3>

        {salonForm.submitError && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{salonForm.submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="salonName"
            label="Salon Name"
            required
            error={salonForm.errors.name}
            touched={salonForm.touched.name}
          >
            <input
              id="salonName"
              type="text"
              value={salonForm.values.name}
              onChange={salonForm.handleChange('name')}
              onBlur={salonForm.handleBlur('name')}
              className={`input-field ${salonForm.touched.name && salonForm.errors.name ? 'input-error' : ''}`}
            />
          </FormField>

          <div>
            <label className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC] mb-1.5">
              Public Web Slug & Online Booking URL
            </label>
            <input
              type="text"
              disabled
              value={salon?.slug || 'ruhi-beauty-salon'}
              className="input-field opacity-75 font-mono text-xs cursor-not-allowed"
            />
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
              <span>Suggested URL path:</span>
              <span className="font-mono text-[#2868ff] font-semibold">/{suggestedSlug || salon?.slug}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            id="salonEmail"
            label="Business Email"
            error={salonForm.errors.email}
            touched={salonForm.touched.email}
          >
            <input
              id="salonEmail"
              type="email"
              placeholder="e.g. contact@salon.in"
              value={salonForm.values.email}
              onChange={salonForm.handleChange('email')}
              onBlur={salonForm.handleBlur('email')}
              className={`input-field ${salonForm.touched.email && salonForm.errors.email ? 'input-error' : ''}`}
            />
          </FormField>

          <FormField
            id="salonPhone"
            label="Business Phone"
            error={salonForm.errors.phone}
            touched={salonForm.touched.phone}
          >
            <input
              id="salonPhone"
              type="tel"
              placeholder="e.g. 98250 12345"
              value={salonForm.values.phone}
              onChange={salonForm.handleChange('phone')}
              onBlur={salonForm.handleBlur('phone')}
              className={`input-field ${salonForm.touched.phone && salonForm.errors.phone ? 'input-error' : ''}`}
            />
          </FormField>

          <div>
            <label className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC] mb-1.5">
              GST Tax Rate <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={
                ['0', '0.00'].includes(String(salonForm.values.tax_rate))
                  ? '0.00'
                  : ['5', '5.00'].includes(String(salonForm.values.tax_rate))
                  ? '5.00'
                  : ['40', '40.00'].includes(String(salonForm.values.tax_rate))
                  ? '40.00'
                  : '18.00'
              }
              onChange={(val) => salonForm.setFieldValue('tax_rate', val)}
              options={[
                { value: '0.00', label: '0% (Exempt / Nil Rated)' },
                { value: '5.00', label: '5% (Essential Products)' },
                { value: '18.00', label: '18% (Standard Beauty & Hair Services)' },
                { value: '40.00', label: '40% (Luxury Cosmetics & Special Treatments)' },
              ]}
              size="sm"
            />
            {salonForm.errors.tax_rate && (
              <p className="text-[11px] text-red-500 mt-1">{salonForm.errors.tax_rate}</p>
            )}
          </div>
        </div>

        <FormField
          id="salonAddress"
          label="Primary Studio Address"
          error={salonForm.errors.address}
          touched={salonForm.touched.address}
        >
          <textarea
            id="salonAddress"
            rows={2}
            placeholder="Studio street, complex, city, pincode..."
            value={salonForm.values.address}
            onChange={salonForm.handleChange('address')}
            onBlur={salonForm.handleBlur('address')}
            className={`textarea-field ${salonForm.touched.address && salonForm.errors.address ? 'input-error' : ''}`}
          />
        </FormField>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={salonForm.isSubmitting}
            className="btn-primary btn-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{salonForm.isSubmitting ? 'Saving Changes...' : 'Save Organization Settings'}</span>
          </button>
        </div>
      </form>

      {/* Physical Branches Management (Protected / Centralized Routing) */}
      {SHOW_BRANCH_MANAGEMENT ? (
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585]" />
                Studio Branches ({branches.length})
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Configure multi-location salon operations in Gujarat</p>
            </div>
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="btn-secondary btn-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#059669]" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {branches.map((b) => (
              <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-[var(--surface-secondary)]/30 rounded-lg px-2 transition-colors">
                <div>
                  <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {b.name}
                    {b.is_primary && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-md border border-emerald-200 dark:border-emerald-800/40">
                        Primary Studio
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--text-secondary)] mt-0.5">{b.address}, {b.city}</p>
                </div>
                <div className="text-[var(--text-secondary)] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>{b.opening_time.slice(0, 5)} - {b.closing_time.slice(0, 5)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-surface p-5 border border-dashed border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2868ff]/10 text-[#2868ff] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Branch Operations</p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Operating on primary salon headquarters ({branch?.name || salon?.name || 'Main Studio'}). Multi-branch franchise routing is managed by Superadmin.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-center">
            Single Studio Active
          </span>
        </div>
      )}

      {/* Add Branch Modal */}
      {isBranchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add New Branch</h3>
              <button
                type="button"
                onClick={() => {
                  setIsBranchModalOpen(false);
                  branchForm.reset();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {branchForm.submitError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{branchForm.submitError}</span>
              </div>
            )}

            <form onSubmit={branchForm.handleSubmit} noValidate className="space-y-3 text-xs">
              <FormField
                id="bName"
                label="Branch Name"
                required
                error={branchForm.errors.name}
                touched={branchForm.touched.name}
              >
                <input
                  id="bName"
                  type="text"
                  placeholder="e.g. Ahmedabad CG Road Branch"
                  value={branchForm.values.name}
                  onChange={branchForm.handleChange('name')}
                  onBlur={branchForm.handleBlur('name')}
                  className={`input-field ${branchForm.touched.name && branchForm.errors.name ? 'input-error' : ''}`}
                />
              </FormField>

              <FormField
                id="bCity"
                label="City"
                required
                error={branchForm.errors.city}
                touched={branchForm.touched.city}
              >
                <input
                  id="bCity"
                  type="text"
                  placeholder="e.g. Himmatnagar"
                  value={branchForm.values.city}
                  onChange={branchForm.handleChange('city')}
                  onBlur={branchForm.handleBlur('city')}
                  className={`input-field ${branchForm.touched.city && branchForm.errors.city ? 'input-error' : ''}`}
                />
              </FormField>

              <FormField
                id="bAddress"
                label="Full Address"
                required
                error={branchForm.errors.address}
                touched={branchForm.touched.address}
              >
                <textarea
                  id="bAddress"
                  rows={2}
                  placeholder="e.g. Shop 4-5, Shivalik Complex, Motipura..."
                  value={branchForm.values.address}
                  onChange={branchForm.handleChange('address')}
                  onBlur={branchForm.handleBlur('address')}
                  className={`textarea-field ${branchForm.touched.address && branchForm.errors.address ? 'input-error' : ''}`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="bOpen"
                  label="Opening Time"
                  required
                  error={branchForm.errors.opening_time}
                  touched={branchForm.touched.opening_time}
                >
                  <input
                    id="bOpen"
                    type="time"
                    value={branchForm.values.opening_time}
                    onChange={branchForm.handleChange('opening_time')}
                    onBlur={branchForm.handleBlur('opening_time')}
                    className="input-field"
                  />
                </FormField>

                <FormField
                  id="bClose"
                  label="Closing Time"
                  required
                  error={branchForm.errors.closing_time}
                  touched={branchForm.touched.closing_time}
                >
                  <input
                    id="bClose"
                    type="time"
                    value={branchForm.values.closing_time}
                    onChange={branchForm.handleChange('closing_time')}
                    onBlur={branchForm.handleBlur('closing_time')}
                    className={`input-field ${branchForm.touched.closing_time && branchForm.errors.closing_time ? 'input-error' : ''}`}
                  />
                </FormField>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsBranchModalOpen(false);
                    branchForm.reset();
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={branchForm.isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {branchForm.isSubmitting ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
