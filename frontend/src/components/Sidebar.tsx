import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  ExternalLink,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavigationForRole } from '../constants/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { salon, user } = useAuth();

  const navItems = getNavigationForRole(user?.role);

  // Determine role-based header copy
  let headerTitle = salon?.name || 'Ruhi Beauty Salon';
  let headerSubtitle = 'Salon SaaS Suite';
  let headerInitial = salon?.name ? salon.name[0] : 'R';
  let sectionTitle = 'Salon Management';

  if (user?.role === 'SUPERADMIN') {
    headerTitle = 'LuxeSalon Platform';
    headerSubtitle = 'Superadmin Suite';
    headerInitial = '🛡️';
    sectionTitle = 'Platform Administration';
  } else if (user?.role === 'STYLIST') {
    headerSubtitle = 'Stylist Workspace';
    sectionTitle = 'Stylist Portal';
  } else if (user?.role === 'RECEPTIONIST') {
    headerSubtitle = 'Front Desk & Reception';
    sectionTitle = 'Front Desk Operations';
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-[#171225] text-[var(--text-primary)] border-r border-[#E2E8F0] dark:border-[#332A46] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Salon / Platform Brand Header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/70 dark:bg-[#171225]/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center shadow-sm text-[#6D28D9] dark:text-[#8B5CF6] font-bold text-lg shrink-0 transition-transform hover:scale-105">
              {headerInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold truncate text-[#1E1B2E] dark:text-[#F8FAFC]">
                {headerTitle}
              </h1>
              <p className="text-[11px] text-[#059669] dark:text-[#10B981] truncate flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                {headerSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
            {sectionTitle}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-[#8B5CF6] font-semibold border-l-4 border-[#6D28D9] dark:border-[#8B5CF6] shadow-sm translate-x-0.5'
                      : 'text-[#64748B] dark:text-[#C4BFD0] hover:bg-slate-100/80 dark:hover:bg-[#211A32] hover:text-[#1E1B2E] dark:hover:text-white hover:translate-x-0.5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#6D28D9] dark:text-[#8B5CF6]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* View Public Storefront Link (Only for Salon Roles with an active salon) */}
        {salon && user?.role !== 'SUPERADMIN' && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/50 dark:bg-[#171225]">
            <a
              href={`/s/${salon.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/60"
            >
              <span className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981] shrink-0" />
                <span className="truncate">Public Storefront</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#059669] dark:text-[#10B981]" />
            </a>
          </div>
        )}

        {/* Superadmin Platform Link */}
        {user?.role === 'SUPERADMIN' && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/50 dark:bg-[#171225]">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/60">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Global Platform Scope</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
