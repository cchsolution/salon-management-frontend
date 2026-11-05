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
  Shield,
  Check
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
  const { salon, user, branch, branches, setBranch, logout } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

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
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
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
    } catch { }
  };

  const getRoleBadgeClasses = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20';
      case 'STYLIST':
        return 'bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-800';
      case 'RECEPTIONIST':
        return 'bg-[#F0FDF4] dark:bg-[#17261F] text-[#5C9764] dark:text-[#7DB585] border border-[#5C9764]/30';
      case 'SALON_OWNER':
      default:
        return 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 bg-white/95 dark:bg-[#141A2E]/95 backdrop-blur-md border-b border-[#CACED6] dark:border-[#252F4E] shadow-subtle transition-colors duration-200">
      {/* Left section: mobile hamburger & branch switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#29315D] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] rounded-xl lg:hidden transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Custom Branch Selector for Salon Roles */}
        {branches.length > 0 && user?.role !== 'SUPERADMIN' && (
          <div className="relative shrink-0" ref={branchRef}>
            <button
              type="button"
              onClick={() => setIsBranchOpen(!isBranchOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F0F2F5] dark:bg-[#1C2542] rounded-xl border border-[#CACED6] dark:border-[#252F4E] text-xs hover:border-[#0A24E9]/50 transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-[#5C9764] dark:text-[#7DB585] shrink-0" />
              <span className="font-semibold text-[#29315D] dark:text-[#F8FAFC] max-w-[110px] sm:max-w-[160px] truncate">
                {branch?.name || 'Select Branch'}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#6B7280] dark:text-[#94A3B8] transition-transform duration-200 shrink-0 ${isBranchOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBranchOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-[#141A2E] rounded-2xl border border-[#CACED6] dark:border-[#252F4E] shadow-dropdown dark:shadow-dropdown-dark py-1.5 z-50 animate-scaleIn">
                <div className="px-3.5 py-1.5 border-b border-[#CACED6]/70 dark:border-[#252F4E] text-[10px] font-bold uppercase tracking-wider text-[#A9B6C0] dark:text-[#94A3B8]">
                  Select Salon Branch
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/40 p-1">
                  {branches.map((b) => {
                    const isSelected = b.id === branch?.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBranch(b);
                          setIsBranchOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors text-left ${isSelected
                          ? 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] font-semibold'
                          : 'text-[#29315D] dark:text-[#F8FAFC] hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542]'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-medium">{b.name}</p>
                          <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                            {b.city ? `${b.city} · ` : ''}{b.address}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5C9764] dark:text-[#7DB585] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Superadmin Platform Indicator */}
        {user?.role === 'SUPERADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] dark:bg-[#1E294B] rounded-xl border border-[#0A24E9]/20 text-xs text-[#0A24E9] dark:text-[#4D68FF] font-semibold">
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
            className="btn-primary btn-sm hidden sm:inline-flex items-center gap-1.5 shadow-sm font-semibold"
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
            className="relative p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#29315D] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] rounded-xl transition-colors active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#EF4444] rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-[#141A2E] rounded-2xl shadow-dropdown dark:shadow-dropdown-dark border border-[#CACED6] dark:border-[#252F4E] py-2 z-50 animate-scaleIn">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#CACED6]/70 dark:border-[#252F4E]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#29315D] dark:text-[#F8FAFC]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#5C9764] dark:text-[#7DB585] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/40">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-center text-[#6B7280] dark:text-[#94A3B8]">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs flex gap-3 transition-colors ${!n.is_read
                        ? 'bg-[#EEF2FF]/60 dark:bg-[#1E294B]/30'
                        : 'hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542]'
                        }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.notification_type === 'LOW_STOCK' ? (
                          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                        ) : (
                          <Calendar className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#29315D] dark:text-[#F8FAFC] truncate">{n.title}</p>
                        <p className="text-[#6B7280] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-[#A9B6C0] dark:text-[#94A3B8] mt-1 block">
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
            className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] rounded-xl transition-colors active:scale-98 border border-transparent hover:border-[#CACED6] dark:hover:border-[#252F4E]"
            aria-label="User profile menu"
            aria-expanded={isProfileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] font-bold flex items-center justify-center text-xs border border-[#0A24E9]/20 shrink-0 shadow-xs">
              {user?.first_name?.[0] || user?.email?.[0] || 'R'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs ml-1.5 font-bold text-[#29315D] dark:text-[#F8FAFC] truncate max-w-[130px] leading-tight">
                {user?.full_name || user?.username}
              </span>
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider leading-none w-fit ${getRoleBadgeClasses(user?.role)}`}>
                {user?.role ? (ROLE_LABELS[user.role] || user.role.replace('_', ' ')) : 'User'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] ml-0.5 transition-transform duration-200 shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#141A2E] rounded-2xl shadow-dropdown dark:shadow-dropdown-dark border border-[#CACED6] dark:border-[#252F4E] py-1.5 z-50 animate-scaleIn">
              <div className="px-4 py-2.5 border-b border-[#CACED6]/70 dark:border-[#252F4E]">
                <p className="text-xs font-bold text-[#29315D] dark:text-[#F8FAFC] truncate">{user?.full_name || user?.username}</p>
                <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
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
