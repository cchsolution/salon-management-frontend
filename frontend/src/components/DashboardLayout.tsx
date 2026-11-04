import React, { useState, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { QuickBookingModal } from './QuickBookingModal';

const DashboardLoadingFallback: React.FC = () => (
  <div className="space-y-6 animate-pulse font-sans">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-[#CACED6]/40 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-[#CACED6]/30 dark:bg-slate-800/60 rounded" />
      </div>
      <div className="h-8 w-32 bg-[#CACED6]/30 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-[#FFFFFF] dark:bg-[#141A2E] rounded-xl border border-[#CACED6]/40 dark:border-slate-800" />
      ))}
    </div>
    <div className="h-80 bg-[#FFFFFF] dark:bg-[#141A2E] rounded-xl border border-[#CACED6]/40 dark:border-slate-800" />
  </div>
);

export const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('luxe_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('luxe_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0A24E9] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Loading LuxeSalon Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenQuickBooking={() => setIsQuickBookingOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<DashboardLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Quick Booking Modal */}
      {isQuickBookingOpen && (
        <QuickBookingModal
          isOpen={isQuickBookingOpen}
          onClose={() => setIsQuickBookingOpen(false)}
        />
      )}
    </div>
  );
};
