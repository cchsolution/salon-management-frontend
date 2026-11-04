import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  CheckCircle,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Salon, Branch } from '../../types';
import { TableSkeleton, MetricCardSkeleton } from '../../components/ui/Skeleton';

import { useSalons, useBranches } from '../../hooks/useQueries';

export const SuperadminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: salons = [], isLoading: isSalonsLoading } = useSalons();
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches();
  const isLoading = isSalonsLoading && isBranchesLoading && salons.length === 0;

  const activeSalonsCount = salons.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6 sm:space-y-8 page-enter font-sans">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Platform Overview · LuxeSalon Network
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Global tenant oversight, multi-tenant salon organizations, and subscription infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] px-3.5 py-1.5 rounded-full border border-[#0A24E9]/20 self-start sm:self-auto shadow-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>Platform Superadmin · All Systems Operational</span>
        </div>
      </div>

      {/* Platform KPIs */}
      {isLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Registered Salons */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Registered Salons
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {salons.length}
              </h3>
              <p className="text-xs text-[#5C9764] dark:text-[#7DB585] mt-2 font-semibold">
                {activeSalonsCount} active organizations
              </p>
            </div>
          </div>

          {/* Total Salon Branches */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Operational Branches
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {branches.length}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-2">
                Across Gujarat & platform regions
              </p>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Enterprise Plans
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D97706] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tabular-nums tracking-tight">
                {salons.filter((s) => s.subscription_plan === 'PRO' || s.subscription_plan === 'ENTERPRISE').length}
              </h3>
              <p className="text-xs text-[#D97706] mt-2 font-semibold">
                PRO Tier active licenses
              </p>
            </div>
          </div>

          {/* System Health */}
          <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                Platform Health
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-[#5C9764] dark:text-[#7DB585] tabular-nums tracking-tight">
                99.98%
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5C9764] animate-pulse"></span>
                All services online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registered Salon Tenants Directory */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#0B0D17] dark:text-[#F8FAFC]">
              Tenant Salon Organizations
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Multi-tenant salon profiles, subscription tiers, and public storefront gateways
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/salons')}
            className="text-xs font-semibold text-[#0A24E9] dark:text-[#4D68FF] hover:underline cursor-pointer"
          >
            Manage Salon Accounts →
          </button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : salons.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
            No registered salon organizations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#CACED6]/70 dark:border-[#252F4E] text-[#A9B6C0] dark:text-[#94A3B8] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Salon Organization</th>
                  <th className="py-3 px-3">Slug / Domain</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CACED6]/40 dark:divide-[#252F4E]/60">
                {salons.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F0F2F5]/60 dark:hover:bg-[#1C2542]/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] font-bold flex items-center justify-center text-xs border border-[#0A24E9]/20 shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0B0D17] dark:text-[#F8FAFC]">{s.name}</p>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] line-clamp-1">{s.tagline}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-[#0A24E9] dark:text-[#4D68FF]">
                      /s/{s.slug}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="text-[#0B0D17] dark:text-[#F8FAFC] font-medium">{s.email}</p>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">{s.phone}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20">
                        {s.subscription_plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active
                            ? 'bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] border border-[#5C9764]/30'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-[#5C9764]' : 'bg-red-500'}`}></span>
                        {s.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <a
                        href={`/s/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-[#5C9764] dark:text-[#7DB585] bg-[#F0FDF4] dark:bg-[#142A1D] hover:bg-[#DCFCE7] dark:hover:bg-[#1F372A] rounded-xl border border-[#5C9764]/30 transition-colors"
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
