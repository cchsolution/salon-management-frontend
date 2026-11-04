import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation({
    initialValues: {
      salon_name: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
    },
    validationSchema: {
      salon_name: [Validation.required('Salon name'), Validation.name('Salon name', 2, 100, true)],
      first_name: [Validation.required('Owner first name'), Validation.name('First name', 2, 50, true)],
      last_name: [Validation.name('Last name', 1, 50, false)],
      email: [Validation.required('Business email'), Validation.email(true)],
      phone: [Validation.phone(false, 'IN')],
      password: [Validation.required('Password'), Validation.password(6)],
    },
    onSubmit: async (formValues) => {
      await register({
        role: 'SALON_OWNER',
        salon_name: formValues.salon_name.trim(),
        first_name: formValues.first_name.trim(),
        last_name: formValues.last_name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        password: formValues.password.trim(),
      });
      navigate('/dashboard');
    },
  });

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-200 font-sans">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-[#141A2E] rounded-2xl shadow-card dark:shadow-card-dark border border-[#CACED6] dark:border-[#252F4E] p-6 sm:p-8 space-y-6 animate-scaleIn">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0B0D17] dark:hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div>
          <h2 className="text-2xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Create Your Salon Organization
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Launch your multi-tenant salon SaaS workspace, website, booking calendar, and CRM in minutes.
          </p>
        </div>

        {submitError && (
          <div className="flex items-start gap-2.5 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed break-words">{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit()} className="space-y-4 text-xs" noValidate>
          <FormField
            label="Salon Organization Name"
            required
            error={errors.salon_name}
            touched={touched.salon_name}
          >
            <input
              type="text"
              placeholder="e.g. Maison de Beauté Paris"
              value={values.salon_name}
              onChange={handleChange('salon_name')}
              onBlur={handleBlur('salon_name')}
              className={`input-field ${touched.salon_name && errors.salon_name ? 'input-error' : ''}`}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Owner First Name"
              required
              error={errors.first_name}
              touched={touched.first_name}
            >
              <input
                type="text"
                placeholder="e.g. Ruhi"
                value={values.first_name}
                onChange={handleChange('first_name')}
                onBlur={handleBlur('first_name')}
                className={`input-field ${touched.first_name && errors.first_name ? 'input-error' : ''}`}
              />
            </FormField>

            <FormField
              label="Last Name"
              error={errors.last_name}
              touched={touched.last_name}
            >
              <input
                type="text"
                placeholder="e.g. Shaikh"
                value={values.last_name}
                onChange={handleChange('last_name')}
                onBlur={handleBlur('last_name')}
                className={`input-field ${touched.last_name && errors.last_name ? 'input-error' : ''}`}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Business Email"
              required
              error={errors.email}
              touched={touched.email}
            >
              <input
                type="email"
                placeholder="owner@salon.com"
                value={values.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                className={`input-field ${touched.email && errors.email ? 'input-error' : ''}`}
              />
            </FormField>

            <FormField
              label="Phone Number"
              error={errors.phone}
              touched={touched.phone}
              helperText="Optional for registration"
            >
              <input
                type="tel"
                placeholder="e.g. 98250 12345"
                value={values.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
                className={`input-field ${touched.phone && errors.phone ? 'input-error' : ''}`}
              />
            </FormField>
          </div>

          <FormField
            label="Password"
            required
            error={errors.password}
            touched={touched.password}
            helperText="Minimum 6 characters with mixed security"
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                className={`input-field pr-10 ${touched.password && errors.password ? 'input-error' : ''}`}
                placeholder="Choose password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#0B0D17] dark:hover:text-white transition-colors focus:outline-none rounded"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 text-sm font-semibold shadow-sm"
          >
            <span>{isSubmitting ? 'Registering Organization...' : 'Create Salon Organization'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#CACED6]/70 dark:border-[#252F4E]">
          <Link to="/login" className="text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] hover:underline">
            Already have an account? Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
};
