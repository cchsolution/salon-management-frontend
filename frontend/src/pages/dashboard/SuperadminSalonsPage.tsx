import React, { useState, useMemo } from 'react';
import { ExternalLink, Search, Mail, Phone } from 'lucide-react';
import { Salon, Branch } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import { useSalons, useBranches } from '../../hooks/useQueries';
import { useDebounce } from '../../hooks/useDebounce';

export const SuperadminSalonsPage: React.FC = () => {
  const { data: salons = [], isLoading: isSalonsLoading } = useSalons();
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches();
  const isLoading = isSalonsLoading && isBranchesLoading && salons.length === 0;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  const filteredSalons = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return salons.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [salons, debouncedSearch]);

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0D17] dark:text-[#F8FAFC] tracking-tight">
            Salon Organizations Directory
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Platform-wide salon organizations, tenant domains, and regional branch infrastructure.
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="input-field pl-9 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} columns="3" />
      ) : filteredSalons.length === 0 ? (
        <div className="card-surface p-12 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
          No salon organizations matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSalons.map((salon) => {
            const salonBranches = branches.filter((b) => b.salon === salon.id);
            return (
              <div
                key={salon.id}
                className="card-surface p-6 flex flex-col justify-between hover:border-[#0A24E9]/40 hover:-translate-y-1 transition-all duration-200 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] font-bold text-lg flex items-center justify-center border border-[#0A24E9]/20 shrink-0">
                        {salon.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#0B0D17] dark:text-[#F8FAFC]">
                          {salon.name}
                        </h3>
                        <span className="font-mono text-[11px] text-[#0A24E9] dark:text-[#4D68FF]">
                          /s/{salon.slug}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        salon.is_active
                          ? 'bg-[#F0FDF4] dark:bg-[#142A1D] text-[#5C9764] dark:text-[#7DB585] border border-[#5C9764]/30'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200'
                      }`}
                    >
                      {salon.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-3 line-clamp-2">
                    {salon.tagline || salon.address}
                  </p>

                  <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl space-y-2 text-xs text-[var(--text-primary)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <Mail className="w-3.5 h-3.5 text-[#0A24E9] shrink-0" />
                      <span className="truncate">{salon.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <Phone className="w-3.5 h-3.5 text-[#5C9764] shrink-0" />
                      <span>{salon.phone}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[var(--border)] text-[11px]">
                      <span className="text-[var(--text-secondary)]">Subscription:</span>
                      <span className="font-bold text-[#0A24E9] dark:text-[#4D68FF]">{salon.subscription_plan}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">Tax Rate:</span>
                      <span className="font-semibold">{salon.tax_rate}% (GST)</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">Branches:</span>
                      <span className="font-semibold">{salonBranches.length || 1} active location(s)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Currency: {salon.currency}
                  </span>
                  <a
                    href={`/s/${salon.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5C9764] dark:text-[#7DB585] bg-[#F0FDF4] dark:bg-[#142A1D] hover:bg-[#DCFCE7] dark:hover:bg-[#1F372A] rounded-xl border border-[#5C9764]/30 transition-colors"
                  >
                    <span>Storefront</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
