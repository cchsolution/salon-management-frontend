import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../constants/permissions';

interface AccessDeniedProps {
  featureName?: string;
  requiredRole?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  featureName = 'This feature',
  requiredRole = 'Salon Owner or Administrator',
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRoleLabel = user?.role ? (ROLE_LABELS[user.role] || user.role) : 'User';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg card-surface p-8 sm:p-10 text-center space-y-6 shadow-xl border border-red-200 dark:border-red-950/60 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#0A24E9]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100/70 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <Lock className="w-3 h-3" />
            Access Restricted
          </span>
          <h2 className="text-2xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Access Denied
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] max-w-md mx-auto">
            {featureName} is not accessible with your current role. This section is restricted to {requiredRole}.
          </p>
        </div>

        {/* Current Role Info Box */}
        <div className="p-4 rounded-xl bg-[#F0F2F5] dark:bg-[#1C2542] border border-[#CACED6]/70 dark:border-[#252F4E] text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280] dark:text-[#94A3B8] font-medium">Your Signed-in Account:</span>
            <span className="font-semibold text-[#0B0D17] dark:text-white">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280] dark:text-[#94A3B8] font-medium">Assigned Role:</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20">
              {userRoleLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex-1 py-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>
          <button
            onClick={logout}
            className="btn-secondary flex-1 py-2.5 text-red-600 dark:text-red-400 hover:text-red-700 border-red-200 dark:border-red-900/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
