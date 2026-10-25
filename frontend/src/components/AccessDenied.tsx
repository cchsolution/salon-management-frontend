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
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg card-surface p-8 sm:p-10 text-center space-y-6 shadow-xl border border-red-200 dark:border-red-950/60 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>

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
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Access Denied
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            {featureName} is not accessible with your current role. This section is restricted to {requiredRole}.
          </p>
        </div>

        {/* Current Role Info Box */}
        <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">Your Signed-in Account:</span>
            <span className="font-semibold text-[var(--text-primary)]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">Assigned Role:</span>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950/50 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800">
              {userRoleLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] rounded-lg shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 bg-[var(--surface)] border border-[var(--border)] hover:border-red-300 dark:hover:border-red-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
