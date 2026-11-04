import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
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
    setFieldValue,
    setSubmitError,
    handleSubmit,
  } = useFormValidation({
    initialValues: {
      email: 'owner@ruhibeauty.local',
      password: 'Owner@123',
    },
    validationSchema: {
      email: [Validation.required('Email address'), Validation.email(true)],
      password: [Validation.required('Password'), Validation.password(4)],
    },
    onSubmit: async (formValues) => {
      await login(formValues.email.trim(), formValues.password.trim());
      navigate('/dashboard');
    },
  });

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setFieldValue('email', demoEmail.trim());
    setFieldValue('password', demoPass.trim());
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-200 font-sans">
      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#141A2E] rounded-2xl shadow-card dark:shadow-card-dark border border-[#CACED6] dark:border-[#252F4E] p-6 sm:p-8 space-y-6 animate-scaleIn">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-[#2868ff] text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-sm ring-4 ring-[#2868ff]/15">
            R
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight pt-2">
            Ruhi Beauty Salon
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            Salon SaaS Management Platform · Indian Market Edition
          </p>
        </div>

        {submitError && (
          <div className="flex items-start gap-2.5 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed break-words">{submitError}</span>
          </div>
        )}

        {/* Demo Fast Login Buttons */}
        <div className="p-3 bg-[#F0F2F5] dark:bg-[#1C2542] rounded-xl border border-[#CACED6]/70 dark:border-[#252F4E] text-xs space-y-2">
          <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider block">
            1-Click Demo Login (Gujarat Salon)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('owner@ruhibeauty.local', 'Owner@123')}
              className="px-2 py-2 font-semibold text-[#0B0D17] dark:text-white bg-white dark:bg-[#141A2E] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] rounded-lg border border-[#CACED6] dark:border-[#252F4E] hover:border-[#0A24E9]/50 text-center truncate transition-all duration-150 active:scale-95 text-xs shadow-xs"
            >
              👑 Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ayesha@ruhibeauty.local', 'Stylist@123')}
              className="px-2 py-2 font-semibold text-[#0B0D17] dark:text-white bg-white dark:bg-[#141A2E] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] rounded-lg border border-[#CACED6] dark:border-[#252F4E] hover:border-[#0A24E9]/50 text-center truncate transition-all duration-150 active:scale-95 text-xs shadow-xs"
            >
              ✂️ Stylist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('reception@ruhibeauty.local', 'Staff@123')}
              className="px-2 py-2 font-semibold text-[#0B0D17] dark:text-white bg-white dark:bg-[#141A2E] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] rounded-lg border border-[#CACED6] dark:border-[#252F4E] hover:border-[#0A24E9]/50 text-center truncate transition-all duration-150 active:scale-95 text-xs shadow-xs"
            >
              📋 Reception
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@luxesalon.local', 'Admin@123')}
              className="px-2 py-2 font-semibold text-[#0B0D17] dark:text-white bg-white dark:bg-[#141A2E] hover:bg-[#EEF2FF] dark:hover:bg-[#1E294B] rounded-lg border border-[#CACED6] dark:border-[#252F4E] hover:border-[#0A24E9]/50 text-center truncate transition-all duration-150 active:scale-95 text-xs shadow-xs"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit()} className="space-y-4 text-xs" noValidate>
          <FormField
            label="Email Address"
            required
            error={errors.email}
            touched={touched.email}
          >
            <input
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              className={`input-field ${touched.email && errors.email ? 'input-error' : ''}`}
              placeholder="e.g. owner@ruhibeauty.local"
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Password"
            required
            error={errors.password}
            touched={touched.password}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                className={`input-field pr-10 ${touched.password && errors.password ? 'input-error' : ''}`}
                placeholder="Enter password"
                autoComplete="current-password"
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
            <span>{isSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#CACED6]/70 dark:border-[#252F4E]">
          <Link to="/register" className="text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] hover:underline">
            Register a New Salon Organization →
          </Link>
        </div>
      </div>
    </div>
  );
};
