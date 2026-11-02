import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ExternalLink,
  Shield,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavigationForRole } from '../constants/permissions';

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
  const { salon, user } = useAuth();

  const navItems = getNavigationForRole(user?.role);

  // Determine role-based header copy
  let headerTitle = salon?.name || 'Ruhi Beauty Salon';
  let headerSubtitle = 'Live Salon Studio';
  let headerInitial = salon?.name ? salon.name[0] : 'R';
  let sectionTitle = 'Salon Navigation';

  if (user?.role === 'SUPERADMIN') {
    headerTitle = 'LuxeSalon Platform';
    headerSubtitle = 'Platform Superadmin';
    headerInitial = '🛡️';
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#171225] text-[var(--text-primary)] border-r border-[#E2E8F0] dark:border-[#332A46] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Salon / Brand Header */}
        <div
          className={`flex items-center justify-between px-4 h-20 border-b border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/60 dark:bg-[#171225]/90 backdrop-blur-sm shrink-0 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shadow-xs text-[#6D28D9] dark:text-[#8B5CF6] font-bold text-lg shrink-0">
              {headerInitial}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
                  {headerTitle}
                </h1>
                <p className="text-[11px] text-[#059669] dark:text-[#10B981] truncate flex items-center gap-1.5 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
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
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#211A32] transition-colors"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none"
          aria-label="Primary Navigation"
        >
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 ${
                    isCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#A78BFA] font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#211A32]/70 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Left Indicator Pill */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 bg-[#6D28D9] dark:bg-[#8B5CF6] rounded-r-full"
                        aria-hidden="true"
                      />
                    )}

                    {/* Lucide Icon with consistent stroke */}
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#6D28D9] dark:text-[#8B5CF6]'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                      strokeWidth={1.8}
                    />

                    {/* Nav Item Label */}
                    {!isCollapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      /* Floating Tooltip in Collapsed Mode */
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* View Public Storefront Link (Only for Salon Roles with an active salon) */}
        {salon && user?.role !== 'SUPERADMIN' && (
          <div className="p-3 border-t border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/40 dark:bg-[#171225]">
            <a
              href={`/s/${salon.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors ${
                isCollapsed ? 'justify-center p-2' : ''
              }`}
              title={isCollapsed ? 'Public Storefront' : undefined}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Store className="w-4 h-4 text-[#059669] dark:text-[#10B981] shrink-0" strokeWidth={1.8} />
                {!isCollapsed && (
                  <div className="truncate text-left">
                    <p className="truncate font-bold leading-tight">Public Storefront</p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal truncate">
                      Client Booking View
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#059669]/70 dark:text-[#10B981]/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </a>
          </div>
        )}

        {/* Superadmin Platform Link */}
        {user?.role === 'SUPERADMIN' && (
          <div className="p-3 border-t border-[#E2E8F0] dark:border-[#332A46] bg-slate-50/40 dark:bg-[#171225]">
            <div
              className={`flex items-center gap-2.5 p-2.5 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-800/40 ${
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
