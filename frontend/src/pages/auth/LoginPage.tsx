import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  CalendarCheck,
  Users,
  TrendingUp,
  ShieldCheck,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Validation } from '../../utils/validation';
import { FormField } from '../../components/ui/FormField';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'OWNER' | 'RECEPTIONIST' | 'ADMIN' | null>('OWNER');

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

  const handleQuickDemo = (demoEmail: string, demoPass: string, role: 'OWNER' | 'RECEPTIONIST' | 'ADMIN') => {
    setActiveDemo(role);
    setFieldValue('email', demoEmail.trim());
    setFieldValue('password', demoPass.trim());
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#070A14] flex flex-col lg:flex-row font-sans transition-colors duration-200 relative selection:bg-[#0A24E9] selection:text-white">
      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeSwitcher />
      </div>

      {/* ==================== LEFT SECTION: BRANDING & HIGHLIGHTS ==================== */}
      <div className="lg:w-[46%] xl:w-[42%] bg-[#0B1021] text-white relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#0A24E9]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#152EAE]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 bg-[#5C9764]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 space-y-6 sm:space-y-8 my-auto py-4 lg:py-8 max-w-lg mx-auto lg:mx-0 w-full">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0A24E9] to-[#2868ff] text-white font-extrabold text-2xl flex items-center justify-center shadow-md ring-4 ring-white/10">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white tracking-tight">Ruhi Beauty Salon</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0A24E9]/30 text-[#818CF8] rounded-full border border-[#0A24E9]/40 tracking-wider">
                  SAAS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise Salon & Spa Management</p>
            </div>
          </div>

          {/* Hero Copy */}
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.15]">
              Manage Your Salon{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#60A5FA] to-white">
                Smarter.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Everything you need to manage appointments, customers, staff and business operations in one place.
            </p>
          </div>

          {/* 3 Small Feature Highlights */}
          <div className="space-y-3 pt-1">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#0A24E9]/20 border border-[#0A24E9]/40 text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Smart Appointment Management</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Real-time multi-stylist calendar, schedule timeline, and automated booking reminders.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#5C9764]/20 border border-[#5C9764]/40 text-[#73B880] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Customer & Staff Management</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Complete client CRM, treatment history, stylist commissions, and shift assignments.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#2868ff]/20 border border-[#2868ff]/40 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Business Analytics & Reports</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Live INR revenue charts, GST invoicing, retail inventory tracking, and top services.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Metric Badge */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#5C9764]" />
              <span>Multi-branch Gujarat cloud studio platform</span>
            </div>
            <span className="font-semibold text-slate-300">99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* ==================== RIGHT SECTION: CENTERED LOGIN CARD ==================== */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative min-h-[calc(100vh-140px)] lg:min-h-screen">
        <div className="w-full max-w-[430px] bg-white dark:bg-[#141A2E] rounded-3xl shadow-card hover:shadow-card-hover dark:shadow-card-dark border border-[#CACED6] dark:border-[#252F4E] p-6 sm:p-9 space-y-5 animate-scaleIn transition-all">
          {/* Centered Logo & Header */}
          <div className="text-center space-y-1.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0A24E9] text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md ring-4 ring-[#0A24E9]/15">
              R
            </div>
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#29315D] dark:text-[#F8FAFC] tracking-tight pt-1">
              Welcome Back
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Sign in to continue to your salon dashboard.
            </p>
          </div>

          {/* Quick Demo Access (3 equal buttons: Owner, Receptionist, Admin) */}
          <div className="p-3 bg-[#F0F2F5] dark:bg-[#1C2542] rounded-2xl border border-[#CACED6]/80 dark:border-[#252F4E] space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider block">
                Quick Demo Access
              </span>
              <span className="text-[10px] text-[#0A24E9] dark:text-[#818CF8] font-bold">1-Click Sign In</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* 👑 Owner */}
              <button
                type="button"
                onClick={() => handleQuickDemo('owner@ruhibeauty.local', 'Owner@123', 'OWNER')}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all duration-150 active:scale-95 text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeDemo === 'OWNER'
                    ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] text-[#0A24E9] dark:text-[#818CF8] shadow-xs ring-1 ring-[#0A24E9]/30'
                    : 'bg-white dark:bg-[#141A2E] text-[#29315D] dark:text-white border-[#CACED6] dark:border-[#252F4E] hover:bg-[#EEF2FF]/60 hover:border-[#0A24E9]/50'
                }`}
                title="Login as Salon Owner"
              >
                <span className="text-sm">👑</span>
                <span className="truncate w-full font-bold">Owner</span>
              </button>

              {/* 📋 Receptionist */}
              <button
                type="button"
                onClick={() => handleQuickDemo('reception@ruhibeauty.local', 'Staff@123', 'RECEPTIONIST')}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all duration-150 active:scale-95 text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeDemo === 'RECEPTIONIST'
                    ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] text-[#0A24E9] dark:text-[#818CF8] shadow-xs ring-1 ring-[#0A24E9]/30'
                    : 'bg-white dark:bg-[#141A2E] text-[#29315D] dark:text-white border-[#CACED6] dark:border-[#252F4E] hover:bg-[#EEF2FF]/60 hover:border-[#0A24E9]/50'
                }`}
                title="Login as Salon Receptionist"
              >
                <span className="text-sm">📋</span>
                <span className="truncate w-full font-bold">Receptionist</span>
              </button>

              {/* 🛡️ Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@luxesalon.local', 'Admin@123', 'ADMIN')}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all duration-150 active:scale-95 text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeDemo === 'ADMIN'
                    ? 'bg-[#EEF2FF] dark:bg-[#1E294B] border-[#0A24E9] text-[#0A24E9] dark:text-[#818CF8] shadow-xs ring-1 ring-[#0A24E9]/30'
                    : 'bg-white dark:bg-[#141A2E] text-[#29315D] dark:text-white border-[#CACED6] dark:border-[#252F4E] hover:bg-[#EEF2FF]/60 hover:border-[#0A24E9]/50'
                }`}
                title="Login as Superadmin"
              >
                <span className="text-sm">🛡️</span>
                <span className="truncate w-full font-bold">Admin</span>
              </button>
            </div>
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="flex items-start gap-2.5 p-3.5 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span className="leading-relaxed break-words">{submitError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit()} className="space-y-4 text-xs" noValidate>
            <FormField
              id="loginEmail"
              label="Email Address"
              required
              error={errors.email}
              touched={touched.email}
            >
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A9B6C0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="loginEmail"
                  type="email"
                  value={values.email}
                  onChange={(e) => {
                    setActiveDemo(null);
                    handleChange('email')(e);
                  }}
                  onBlur={handleBlur('email')}
                  className={`input-field pl-10 text-xs ${touched.email && errors.email ? 'input-error' : ''}`}
                  placeholder="e.g. owner@ruhibeauty.local"
                  autoComplete="email"
                />
              </div>
            </FormField>

            <FormField
              id="loginPassword"
              label="Password"
              required
              error={errors.password}
              touched={touched.password}
            >
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A9B6C0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={(e) => {
                    setActiveDemo(null);
                    handleChange('password')(e);
                  }}
                  onBlur={handleBlur('password')}
                  className={`input-field pl-10 pr-10 text-xs ${touched.password && errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#29315D] dark:hover:text-white transition-colors focus:outline-none rounded cursor-pointer"
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
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#0A24E9] hover:bg-[#152EAE] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="text-center pt-3 border-t border-[#CACED6]/70 dark:border-[#252F4E] space-y-1.5">
            <Link
              to="/register"
              className="text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] hover:underline inline-flex items-center gap-1"
            >
              <span>Register a New Salon Organization</span>
              <span>→</span>
            </Link>
            <p className="text-[11px] text-[#A9B6C0]">
              Secured with 256-bit SSL encrypted authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
