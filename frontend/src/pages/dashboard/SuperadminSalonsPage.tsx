import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Salon, Branch } from '../../types';
import { CardGridSkeleton } from '../../components/ui/Skeleton';

export const SuperadminSalonsPage: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSalonsData();
  }, []);

  const fetchSalonsData = async () => {
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

  const filteredSalons = salons.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase()?.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Salon Organizations Directory
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
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
        <div className="card-surface p-12 text-center text-xs text-[var(--text-secondary)]">
          No salon organizations matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSalons.map((salon) => {
            const salonBranches = branches.filter((b) => b.salon === salon.id);
            return (
              <div
                key={salon.id}
                className="card-surface p-6 flex flex-col justify-between hover:border-[#6D28D9]/40 hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1 transition-all duration-200 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#6D28D9] dark:text-[#8B5CF6] font-bold text-lg flex items-center justify-center border border-purple-200 dark:border-purple-800 shrink-0">
                        {salon.name[0]}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                          {salon.name}
                        </h3>
                        <span className="font-mono text-[11px] text-[#6D28D9] dark:text-[#8B5CF6]">
                          /s/{salon.slug}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        salon.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {salon.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-3 line-clamp-2">
                    {salon.tagline || salon.address}
                  </p>

                  <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl space-y-2 text-xs text-[var(--text-primary)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{salon.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{salon.phone}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[var(--border)] text-[11px]">
                      <span className="text-[var(--text-secondary)]">Subscription:</span>
                      <span className="font-bold text-[#6D28D9] dark:text-[#8B5CF6]">{salon.subscription_plan}</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/80 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
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
