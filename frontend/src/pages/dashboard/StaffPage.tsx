import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Users,
  Plus,
  X,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  Percent,
  CheckCircle2,
  Building,
  CalendarCheck
} from 'lucide-react';
import { api, clearApiCache } from '../../services/api';
import { StaffProfile } from '../../types';
import { StaffCardSkeleton } from '../../components/ui/Skeleton';
import { useStaff, useInvalidateQueries } from '../../hooks/useQueries';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../../components/ui/FormField';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { StatusLabel } from '../../components/ui/StatusLabel';
import { Validation, extractBackendErrors } from '../../utils/validation';
import { useFormValidation } from '../../hooks/useFormValidation';

export const StaffPage: React.FC = () => {
  const { branch, branches } = useAuth();
  const { data: staffList = [], isLoading } = useStaff(branch?.id);
  const { invalidateStaff } = useInvalidateQueries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addBackendErrors, setAddBackendErrors] = useState<Record<string, string>>({});

  const addStaffForm = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'STYLIST',
      title: 'Senior Hair Stylist',
      bio: '',
      commission_rate: '15',
      branch: branch?.id || (branches?.[0]?.id ?? ''),
      is_bookable: true,
    },
    validationSchema: {
      first_name: Validation.name('First name', 2, 50, true),
      last_name: Validation.name('Last name', 1, 50, false),
      email: Validation.email(true),
      phone: Validation.phone(true, 'IN'),
      title: Validation.required('Job title / designation'),
      commission_rate: Validation.percentage('Commission rate', true),
    },
    onSubmit: async (values) => {
      setAddBackendErrors({});
      try {
        await api.post('/catalog/staff/', {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          role: values.role,
          title: values.title.trim(),
          bio: values.bio.trim() || undefined,
          commission_rate: parseFloat(values.commission_rate) || 0,
          branch: values.branch || branch?.id || null,
          is_bookable: values.is_bookable,
        });
        clearApiCache('/catalog/staff/');
        invalidateStaff();
        setIsAddModalOpen(false);
        addStaffForm.reset();
      } catch (err: any) {
        const { fieldErrors, generalError } = extractBackendErrors(err);
        setAddBackendErrors({
          ...fieldErrors,
          ...(generalError ? { general: generalError } : {}),
        });
        throw err;
      }
    },
  });

  // Modal scroll lock and Escape key listener
  useEffect(() => {
    if (!isAddModalOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        addStaffForm.reset();
        setAddBackendErrors({});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddModalOpen, addStaffForm]);

  return (
    <div className="space-y-6 page-enter font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight">
            Salon Stylists & Staff
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Manage your team of certified hair stylists, beauticians, shifts, and commission rates.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setAddBackendErrors({});
          }}
          className="btn-primary btn-md shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {isLoading ? (
        <StaffCardSkeleton count={6} />
      ) : staffList.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
          No staff members found. Click "Add Staff Member" to add your salon team.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((stf) => (
            <div
              key={stf.id}
              className="card-surface p-6 hover:border-[#2868ff]/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#2868ff] text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                    {stf.user_details?.first_name?.[0] || stf.title?.[0] || 'S'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#29315D] dark:text-[#F8FAFC] truncate">
                      {stf.user_details?.full_name || stf.title}
                    </h3>
                    <p className="text-xs text-[#2868ff] dark:text-[#4D68FF] font-semibold truncate">
                      {stf.title}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-3 line-clamp-3 leading-relaxed">
                  {stf.bio || 'Professional salon team member providing bespoke treatments.'}
                </p>

                <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl space-y-2 text-xs text-[var(--text-primary)] border border-[var(--border)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Commission Rate:</span>
                    <span className="font-bold text-[#059669] dark:text-[#10B981] tabular-nums">
                      {stf.commission_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Branch Assignment:</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
                      {stf.branch_name || branch?.name || 'Main Salon'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Online Bookable:</span>
                    <StatusLabel status={stf.is_bookable ? 'ACTIVE' : 'INACTIVE'} size="xs" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal using createPortal with z-[100] */}
      {isAddModalOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !addStaffForm.isSubmitting) {
                setIsAddModalOpen(false);
                addStaffForm.reset();
                setAddBackendErrors({});
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
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Add Salon Staff Member</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Register a stylist or receptionist with shift access</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    addStaffForm.reset();
                    setAddBackendErrors({});
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(addStaffForm.submitError || addBackendErrors.general) && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addBackendErrors.general || addStaffForm.submitError}</span>
                </div>
              )}

              <form onSubmit={addStaffForm.handleSubmit} noValidate className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="sFirstName"
                    label="First Name"
                    required
                    error={addStaffForm.errors.first_name || addBackendErrors.first_name}
                    touched={addStaffForm.touched.first_name}
                  >
                    <input
                      id="sFirstName"
                      type="text"
                      placeholder="e.g. Priya"
                      value={addStaffForm.values.first_name}
                      onChange={addStaffForm.handleChange('first_name')}
                      onBlur={addStaffForm.handleBlur('first_name')}
                      className={`input-field ${
                        (addStaffForm.touched.first_name && addStaffForm.errors.first_name) || addBackendErrors.first_name
                          ? 'input-error'
                          : ''
                      }`}
                    />
                  </FormField>

                  <FormField
                    id="sLastName"
                    label="Last Name"
                    error={addStaffForm.errors.last_name || addBackendErrors.last_name}
                    touched={addStaffForm.touched.last_name}
                  >
                    <input
                      id="sLastName"
                      type="text"
                      placeholder="e.g. Patel"
                      value={addStaffForm.values.last_name}
                      onChange={addStaffForm.handleChange('last_name')}
                      onBlur={addStaffForm.handleBlur('last_name')}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="sEmail"
                    label="Email Address"
                    required
                    error={addStaffForm.errors.email || addBackendErrors.email}
                    touched={addStaffForm.touched.email}
                  >
                    <input
                      id="sEmail"
                      type="email"
                      placeholder="priya@salon.in"
                      value={addStaffForm.values.email}
                      onChange={addStaffForm.handleChange('email')}
                      onBlur={addStaffForm.handleBlur('email')}
                      className={`input-field ${
                        (addStaffForm.touched.email && addStaffForm.errors.email) || addBackendErrors.email
                          ? 'input-error'
                          : ''
                      }`}
                    />
                  </FormField>

                  <FormField
                    id="sPhone"
                    label="Mobile Number"
                    required
                    error={addStaffForm.errors.phone || addBackendErrors.phone}
                    touched={addStaffForm.touched.phone}
                  >
                    <input
                      id="sPhone"
                      type="tel"
                      placeholder="98250 12345"
                      value={addStaffForm.values.phone}
                      onChange={addStaffForm.handleChange('phone')}
                      onBlur={addStaffForm.handleBlur('phone')}
                      className={`input-field ${
                        (addStaffForm.touched.phone && addStaffForm.errors.phone) || addBackendErrors.phone
                          ? 'input-error'
                          : ''
                      }`}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Staff Role <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={addStaffForm.values.role}
                      onChange={(val) => addStaffForm.setFieldValue('role', val)}
                      options={[
                        { value: 'STYLIST', label: 'Hair & Beauty Stylist' },
                        { value: 'RECEPTIONIST', label: 'Front Desk / Receptionist' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <FormField
                    id="sTitle"
                    label="Designation / Title"
                    required
                    error={addStaffForm.errors.title || addBackendErrors.title}
                    touched={addStaffForm.touched.title}
                  >
                    <input
                      id="sTitle"
                      type="text"
                      placeholder="e.g. Master Stylist"
                      value={addStaffForm.values.title}
                      onChange={addStaffForm.handleChange('title')}
                      onBlur={addStaffForm.handleBlur('title')}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="sCommission"
                    label="Commission Rate (%)"
                    required
                    error={addStaffForm.errors.commission_rate || addBackendErrors.commission_rate}
                    touched={addStaffForm.touched.commission_rate}
                  >
                    <input
                      id="sCommission"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="15"
                      value={addStaffForm.values.commission_rate}
                      onChange={addStaffForm.handleChange('commission_rate')}
                      onBlur={addStaffForm.handleBlur('commission_rate')}
                      className="input-field"
                    />
                  </FormField>

                  {branches && branches.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                        Assigned Branch
                      </label>
                      <CustomSelect
                        value={addStaffForm.values.branch}
                        onChange={(val) => addStaffForm.setFieldValue('branch', val)}
                        options={branches.map((b) => ({
                          value: b.id,
                          label: b.name,
                          sublabel: b.city,
                        }))}
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Staff Bio & Specializations (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Certified in Balayage, L’Oréal Color Expert..."
                    value={addStaffForm.values.bio}
                    onChange={addStaffForm.handleChange('bio')}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bookableCheck"
                    checked={addStaffForm.values.is_bookable}
                    onChange={addStaffForm.handleChange('is_bookable')}
                    className="w-4 h-4 rounded text-[#2868ff] focus:ring-[#2868ff] cursor-pointer"
                  />
                  <label htmlFor="bookableCheck" className="text-[var(--text-primary)] font-medium cursor-pointer">
                    Enable for Customer Online Booking
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      addStaffForm.reset();
                      setAddBackendErrors({});
                    }}
                    className="btn-ghost btn-sm"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={addStaffForm.isSubmitting}
                    className="btn-primary btn-sm"
                  >
                    <span>{addStaffForm.isSubmitting ? 'Registering...' : 'Register Staff'}</span>
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
