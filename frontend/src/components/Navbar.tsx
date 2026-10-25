import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Plus,
  MapPin,
  LogOut,
  ChevronDown,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  Sparkles,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InAppNotification } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ROLE_LABELS } from '../constants/permissions';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQuickBooking?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenQuickBooking }) => {
  const { user, branch, branches, setBranch, logout } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const lastFetchTimeRef = useRef<number>(0);

  const fetchNotifications = async (signal?: AbortSignal) => {
    // Avoid re-fetching if fetched less than 60s ago
    if (Date.now() - lastFetchTimeRef.current < 60000 && notifications.length > 0) {
      return;
    }
    // Superadmin has no salon alerts
    if (user?.role === 'SUPERADMIN') {
      return;
    }

    try {
      const data = await api.get<{ results?: InAppNotification[] } | InAppNotification[]>('/notifications/alerts/', {
        signal,
      });
      lastFetchTimeRef.current = Date.now();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    } catch {
      // Gracefully ignore alerts failures (non-critical)
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(controller.signal);
    return () => controller.abort();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.post('/notifications/alerts/mark_all_read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const getRoleBadgeClasses = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800';
      case 'STYLIST':
        return 'bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-800';
      case 'RECEPTIONIST':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] border border-emerald-200 dark:border-emerald-800';
      case 'SALON_OWNER':
      default:
        return 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 bg-white dark:bg-[#171225] border-b border-[#E2E8F0] dark:border-[#332A46] shadow-subtle transition-colors duration-200">
      {/* Left section: mobile hamburger & branch switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 text-[#64748B] dark:text-[#C4BFD0] hover:text-[#1E1B2E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#211A32] rounded-lg lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branch Selector for Salon Roles */}
        {branches.length > 0 && user?.role !== 'SUPERADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#211A32] rounded-lg border border-[#E2E8F0] dark:border-[#332A46] text-xs sm:text-sm">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669] dark:text-[#10B981] shrink-0" />
            <select
              value={branch?.id || ''}
              onChange={(e) => {
                const found = branches.find((b) => b.id === e.target.value);
                if (found) setBranch(found);
              }}
              className="bg-transparent font-medium text-[#1E1B2E] dark:text-[#F8FAFC] focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-white dark:bg-[#171225] text-[#1E1B2E] dark:text-[#F8FAFC]">
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Superadmin Platform Indicator */}
        {user?.role === 'SUPERADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800/60 text-xs text-[#6D28D9] dark:text-[#8B5CF6] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Platform Superadmin</span>
          </div>
        )}
      </div>

      {/* Right section: Quick actions, Theme switcher, notifications, user profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenQuickBooking && user?.role !== 'SUPERADMIN' && (
          <button
            onClick={onOpenQuickBooking}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] rounded-lg shadow-sm transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        )}

        {/* Theme Switcher (Light / Dark / System) */}
        <ThemeSwitcher />

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="View notifications"
            className="relative p-2 text-[#64748B] dark:text-[#C4BFD0] hover:text-[#1E1B2E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#211A32] rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#DC2626] rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-[#171225] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#332A46] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0] dark:border-[#332A46]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E1B2E] dark:text-[#F8FAFC]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#059669] dark:text-[#10B981] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-center text-[#64748B] dark:text-[#C4BFD0]">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs flex gap-3 transition-colors ${
                        !n.is_read
                          ? 'bg-purple-50/50 dark:bg-purple-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-[#211A32]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.notification_type === 'LOW_STOCK' ? (
                          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                        ) : (
                          <Calendar className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC] truncate">{n.title}</p>
                        <p className="text-[#64748B] dark:text-[#C4BFD0] mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-[#64748B] dark:text-[#C4BFD0] mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-[#211A32] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-[#8B5CF6] font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-800">
              {user?.first_name?.[0] || user?.email?.[0] || 'R'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC] truncate max-w-[120px]">
                {user?.full_name || user?.username}
              </p>
              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${getRoleBadgeClasses(user?.role)}`}>
                {user?.role ? (ROLE_LABELS[user.role] || user.role.replace('_', ' ')) : 'User'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-[#C4BFD0]" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#171225] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#332A46] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#332A46]">
                <p className="text-xs font-semibold text-[#1E1B2E] dark:text-[#F8FAFC] truncate">{user?.full_name}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0] truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
