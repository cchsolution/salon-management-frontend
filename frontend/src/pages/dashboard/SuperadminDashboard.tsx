import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  CheckCircle,
  ExternalLink,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Salon, Branch } from '../../types';

export const SuperadminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    setIsLoading(true);
    try {
      const [salonRes, branchRes] = await Promise.all([
        api.get<{ results?: Salon[] } | Salon[]>('/salons/'),
        api.get<{ results?: Branch[] } | Branch[]>('/branches/'),
      ]);

      const sList = Array.isArray(salonRes) ? salonRes : salonRes.results || [];
      const bList = Array.isArray(branchRes) ? branchRes : branchRes.results || [];

      setSalons(sList);
      setBranches(bList);
    } catch {
      setSalons([]);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSalonsCount = salons.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
            Platform Overview · LuxeSalon Network
          </h1>
          <p className="text-xs md:text-sm text-[#64748B] dark:text-[#C4BFD0] mt-1">
            Global tenant oversight, multi-tenant salon organizations, and subscription infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/40 px-3.5 py-1.5 rounded-full border border-purple-200 dark:border-purple-800/60 self-start sm:self-auto shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          <span>Platform Superadmin · All Systems Operational</span>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Salons */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Registered Salons
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {salons.length}
            </h3>
            <p className="text-xs text-[#059669] dark:text-[#10B981] mt-1.5 font-semibold">
              {activeSalonsCount} active organizations
            </p>
          </div>
        </div>

        {/* Total Salon Branches */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Operational Branches
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {branches.length}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5">
              Across Gujarat & platform regions
            </p>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Enterprise Plans
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              {salons.filter((s) => s.subscription_plan === 'PRO' || s.subscription_plan === 'ENTERPRISE').length}
            </h3>
            <p className="text-xs text-[#D97706] mt-1.5 font-semibold">
              PRO Tier active licenses
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="card-surface p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#C4BFD0]">
              Platform Health
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-serif font-bold text-[#059669] dark:text-[#10B981]">
              99.98%
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0] mt-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              All services online
            </p>
          </div>
        </div>
      </div>

      {/* Registered Salon Tenants Directory */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-serif font-bold text-[#1E1B2E] dark:text-[#F8FAFC]">
              Tenant Salon Organizations
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#C4BFD0]">
              Multi-tenant salon profiles, subscription tiers, and public storefront gateways
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/salons')}
            className="text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] hover:underline"
          >
            Manage Salon Accounts →
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0]">
            <div className="w-7 h-7 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading platform salons...
          </div>
        ) : salons.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B] dark:text-[#C4BFD0]">
            No registered salon organizations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] dark:border-[#332A46] text-[#64748B] dark:text-[#C4BFD0] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Salon Organization</th>
                  <th className="py-3 px-3">Slug / Domain</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#332A46]">
                {salons.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-[#211A32]/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-[#8B5CF6] font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-800 shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1B2E] dark:text-[#F8FAFC]">{s.name}</p>
                          <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0] line-clamp-1">{s.tagline}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-[#6D28D9] dark:text-[#8B5CF6]">
                      /s/{s.slug}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="text-[#1E1B2E] dark:text-[#F8FAFC]">{s.email}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#C4BFD0]">{s.phone}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800">
                        {s.subscription_plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981]'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-[#10B981]' : 'bg-red-500'}`}></span>
                        {s.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <a
                        href={`/s/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                      >
                        <span>Storefront</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
