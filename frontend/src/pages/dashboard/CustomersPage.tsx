import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Award,
  Calendar,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const c = api.getCached<{ results?: Customer[] } | Customer[]>('/crm/clients/');
    return Array.isArray(c) ? c : c?.results || [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(() => customers.length === 0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Client Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    if (customers.length === 0) {
      setIsLoading(true);
    }
    try {
      const data = await api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/');
      const list = Array.isArray(data) ? data : data.results || [];
      setCustomers(list);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/crm/clients/', {
        first_name: fName,
        last_name: lName,
        phone,
        email,
        notes,
      });
      setIsModalOpen(false);
      setFName('');
      setLName('');
      setPhone('');
      setEmail('');
      setNotes('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer.');
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? c.tags && c.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Client Directory & CRM
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage salon customer profiles, visit history, preferences, and loyalty points.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary btn-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['', 'VIP', 'Frequent', 'New Client'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 active:scale-95 ${
                selectedTag === tag
                  ? 'bg-[#6D28D9] dark:bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
              }`}
            >
              {tag ? `#${tag}` : 'All Clients'}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="card-surface overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
            No customers match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Client Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Tags & Segment</th>
                  <th className="py-3.5 px-4">Visits</th>
                  <th className="py-3.5 px-4">Total Spend</th>
                  <th className="py-3.5 px-4">Loyalty Points</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-[var(--surface-secondary)]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6D28D9] dark:bg-purple-950/60 dark:text-[#8B5CF6] font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-800">
                          {c.first_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{c.full_name}</p>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {c.city ? `${c.city}` : 'Gujarat'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                          <Phone className="w-3 h-3 text-[var(--text-secondary)]" /> {c.phone}
                        </p>
                        {c.email && (
                          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <Mail className="w-3 h-3 text-[var(--text-secondary)]" /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                t === 'VIP'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800/40'
                                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                              }`}
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--text-secondary)] text-[11px]">Regular</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-[var(--text-primary)]">
                      {c.visit_count} visits
                    </td>
                    <td className="py-4 px-4 font-bold text-[#059669] dark:text-[#10B981]">
                      ₹{Number(c.total_spend || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-[#6D28D9] dark:text-[#8B5CF6] font-bold">
                        <Award className="w-3.5 h-3.5" />
                        {c.loyalty_points} pts
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-[#059669] dark:text-[#10B981] font-semibold hover:underline inline-flex items-center gap-1">
                        View Profile <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Slide-Over */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-[var(--border)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-[#6D28D9] dark:bg-purple-950/60 dark:text-[#8B5CF6] font-bold flex items-center justify-center text-base border border-purple-200 dark:border-purple-800">
                  {selectedCustomer.first_name[0]}
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                    {selectedCustomer.full_name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close"
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--surface-secondary)]"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-xs">
              <div>
                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase">Total Spend</p>
                <p className="font-bold text-[#059669] dark:text-[#10B981] mt-0.5">₹{Number(selectedCustomer.total_spend || 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase">Visits</p>
                <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedCustomer.visit_count}</p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase">Points</p>
                <p className="font-bold text-[#6D28D9] dark:text-[#8B5CF6] mt-0.5">{selectedCustomer.loyalty_points}</p>
              </div>
            </div>

            {/* Confidential Notes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Stylist & Service Notes
              </h4>
              <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]">
                {selectedCustomer.notes || 'No special notes recorded.'}
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Recent Activity Timeline
              </h4>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[var(--border)]">
                {selectedCustomer.recent_activities && selectedCustomer.recent_activities.length > 0 ? (
                  selectedCustomer.recent_activities.map((act) => (
                    <div key={act.id} className="relative flex items-start gap-3 pl-6 text-xs">
                      <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#059669] border-2 border-[var(--surface)] shadow-sm"></span>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{act.title}</p>
                        <p className="text-[var(--text-secondary)] text-[11px] mt-0.5">{act.description}</p>
                        <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
                          {new Date(act.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] pl-6">No recorded activity yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-modal border border-[var(--border)] p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">New Client Profile</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={fName}
                    placeholder="e.g. Ayesha"
                    onChange={(e) => setFName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lName}
                    placeholder="e.g. Sheikh"
                    onChange={(e) => setLName(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98250 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">Stylist Notes</label>
                <textarea
                  rows={2}
                  placeholder="Allergies, beverage preferences, favorite formulas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
