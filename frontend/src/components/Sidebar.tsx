import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ExternalLink,
  Shield,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Scissors
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavigationForRole } from '../constants/permissions';
import { useDashboardMetrics } from '../hooks/useQueries';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { salon, user, branch } = useAuth();
  const { data: metrics } = useDashboardMetrics(branch?.id);
  const todayApptsCount = metrics?.summary?.today_appointments ?? 0;

  const navItems = getNavigationForRole(user?.role);

  // Determine role-based header copy
  let headerTitle = salon?.name || 'Ruhi Beauty Salon';
  let headerSubtitle = 'Live Salon Studio';
  let sectionTitle = 'Salon Navigation';

  if (user?.role === 'SUPERADMIN') {
    headerTitle = 'LuxeSalon Platform';
    headerSubtitle = 'Platform Superadmin';
    sectionTitle = 'Administration';
  } else if (user?.role === 'STYLIST') {
    headerSubtitle = 'Stylist Workspace';
    sectionTitle = 'Stylist Menu';
  } else if (user?.role === 'RECEPTIONIST') {
    headerSubtitle = 'Front Desk Desk';
    sectionTitle = 'Front Desk';
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#141A2E] text-[var(--text-primary)] border-r border-[#CACED6] dark:border-[#252F4E] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Salon / Brand Header */}
        <div
          className={`flex items-center justify-between px-4 h-20 border-b border-[#CACED6]/70 dark:border-[#252F4E] bg-white/80 dark:bg-[#141A2E]/90 backdrop-blur-sm shrink-0 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Fixed Professional Salon Theme Logo (Phase 1) */}
            <div className="w-10 h-10 rounded-xl bg-[#2868ff] text-white flex items-center justify-center shadow-sm font-bold text-lg shrink-0">
              {user?.role === 'SUPERADMIN' ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <Scissors className="w-5 h-5 text-white" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-[#0B0D17] dark:text-white truncate tracking-tight">
                  {headerTitle}
                </h1>
                <p className="text-[11px] text-[#5C9764] dark:text-[#7DB585] truncate flex items-center gap-1.5 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5C9764] animate-pulse"></span>
                  {headerSubtitle}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-[#6B7280] hover:text-[#0B0D17] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] transition-colors"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0B0D17] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <nav
          className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none"
          aria-label="Primary Navigation"
        >
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#A9B6C0] dark:text-slate-500">
              {sectionTitle}
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ease-out ${
                    isCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-[#EFF4FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#60A5FA] font-semibold shadow-2xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F5FF] dark:hover:bg-[#1A233D] hover:text-[#0A24E9] dark:hover:text-[#60A5FA]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Shopeers active vertical indicator bar on left edge */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#0A24E9] dark:bg-[#60A5FA]" />
                    )}

                    {/* Lucide Icon with smooth blue transition on hover and active */}
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                        isActive
                          ? 'text-[#0A24E9] dark:text-[#60A5FA]'
                          : 'text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0A24E9] dark:group-hover:text-[#60A5FA]'
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />

                    {/* Nav Item Label */}
                    {!isCollapsed ? (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    ) : (
                      /* Floating Tooltip in Collapsed Mode */
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#0B0D17] dark:bg-slate-100 text-white dark:text-[#0B0D17] text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.label}
                      </div>
                    )}

                    {/* Dynamic Pill Counter Badge (e.g. for Appointments/Calendar) */}
                    {!isCollapsed && item.to === '/dashboard/calendar' && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#ECFDF5] dark:bg-[#142A1D] text-[#059669] dark:text-[#34D399] border border-[#A7F3D0]/60 tabular-nums shrink-0">
                        {todayApptsCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* View Public Storefront Link (Only for Salon Roles with an active salon) */}
        {salon && user?.role !== 'SUPERADMIN' && (
          <div className="p-3 border-t border-[#CACED6]/70 dark:border-[#252F4E] bg-white dark:bg-[#141A2E]">
            <a
              href={`/s/${salon.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-semibold text-[#5C9764] dark:text-[#7DB585] bg-[#F0FDF4] dark:bg-[#17261F] hover:bg-[#DCFCE7] dark:hover:bg-[#1F372A] border border-[#5C9764]/30 transition-colors ${
                isCollapsed ? 'justify-center p-2' : ''
              }`}
              title={isCollapsed ? 'Public Storefront' : undefined}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Store className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585] shrink-0" strokeWidth={1.8} />
                {!isCollapsed && (
                  <div className="truncate text-left">
                    <p className="truncate font-bold leading-tight">Public Storefront</p>
                    <p className="text-[10px] text-[#5C9764]/80 dark:text-[#7DB585]/80 font-normal truncate">
                      Client Booking View
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#5C9764]/70 dark:text-[#7DB585]/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </a>
          </div>
        )}

        {/* Superadmin Platform Link */}
        {user?.role === 'SUPERADMIN' && (
          <div className="p-3 border-t border-[#CACED6]/70 dark:border-[#252F4E] bg-white dark:bg-[#141A2E]">
            <div
              className={`flex items-center gap-2.5 p-2.5 text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] rounded-xl border border-[#0A24E9]/20 ${
                isCollapsed ? 'justify-center p-2' : ''
              }`}
              title={isCollapsed ? 'Platform Scope' : undefined}
            >
              <Shield className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              {!isCollapsed && <span className="truncate">Global Platform Scope</span>}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
