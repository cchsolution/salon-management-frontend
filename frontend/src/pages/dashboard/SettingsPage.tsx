import React, { useState, useEffect } from 'react';
import {
  Building,
  Save,
  MapPin,
  Clock,
  Plus,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Branch, Salon } from '../../types';

export const SettingsPage: React.FC = () => {
  const { salon, branches, setSalon, branch, setBranch } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [salonName, setSalonName] = useState(salon?.name || '');
  const [salonEmail, setSalonEmail] = useState(salon?.email || '');
  const [salonPhone, setSalonPhone] = useState(salon?.phone || '');
  const [salonAddress, setSalonAddress] = useState(salon?.address || '');
  const [taxRate, setTaxRate] = useState(salon?.tax_rate?.toString() || '18.00');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Branch creation modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [bName, setBName] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bCity, setBCity] = useState('Himmatnagar');
  const [bOpen, setBOpen] = useState('09:00');
  const [bClose, setBClose] = useState('20:00');

  useEffect(() => {
    if (salon) {
      setSalonName(salon.name);
      setSalonEmail(salon.email);
      setSalonPhone(salon.phone);
      setSalonAddress(salon.address);
      setTaxRate(salon.tax_rate?.toString() || '18.00');
    }
  }, [salon]);

  const handleSaveSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.patch<Salon>(`/salons/${salon.slug}/`, {
        name: salonName,
        email: salonEmail,
        phone: salonPhone,
        address: salonAddress,
        tax_rate: parseFloat(taxRate),
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      });
      setSalon(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update salon profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/branches/', {
        name: bName,
        address: bAddress,
        city: bCity,
        opening_time: `${bOpen}:00`,
        closing_time: `${bClose}:00`,
      });
      setIsBranchModalOpen(false);
      setBName('');
      setBAddress('');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to create branch.');
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; desc: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Light Mode (Default)', desc: 'Crisp #F8FAFC canvas with White cards & Deep Purple brand accents', icon: Sun },
    { mode: 'dark', label: 'Dark Mode (Engineered)', desc: 'Sophisticated #0F0B1A backdrop with #171225 surfaces and soft purple', icon: Moon },
    { mode: 'system', label: 'System Sync', desc: 'Dynamically aligns with your operating system preference', icon: Laptop },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
          Salon Organization Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Manage brand configuration, physical studio branches in Gujarat, operating hours, and appearance.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 text-xs text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg font-semibold">
          Salon settings saved successfully!
        </div>
      )}

      {/* Theme & Visual System Settings */}
      <div className="card-surface p-6 space-y-4">
        <h3 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
          Visual Theme & Display Preferences
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Choose the global color mode for your dashboard and management modules. Persisted across sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setThemeMode(opt.mode)}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-purple-50/60 dark:bg-purple-950/40 border-[#6D28D9] dark:border-[#8B5CF6] shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[#6D28D9]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#6D28D9] text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />}
                </div>
                <p className="font-bold text-xs text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSalon} className="card-surface p-6 space-y-5 text-xs">
        <h3 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Building className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6]" />
          General Salon Profile (India)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Salon Name</label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Public Web Slug</label>
            <input
              type="text"
              disabled
              value={salon?.slug || 'ruhi-beauty-salon'}
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Business Email</label>
            <input
              type="email"
              value={salonEmail}
              onChange={(e) => setSalonEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Business Phone</label>
            <input
              type="text"
              value={salonPhone}
              onChange={(e) => setSalonPhone(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">GST Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] font-semibold mb-1">Primary Studio Address</label>
          <textarea
            rows={2}
            value={salonAddress}
            onChange={(e) => setSalonAddress(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Organization Settings'}</span>
          </button>
        </div>
      </form>

      {/* Physical Branches Management */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
              Studio Branches ({branches.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Configure multi-location salon operations in Gujarat</p>
          </div>
          <button
            onClick={() => setIsBranchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#059669] dark:text-[#10B981] bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 rounded-lg border border-emerald-200 dark:border-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {branches.map((b) => (
            <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  {b.name}
                  {b.is_primary && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#10B981] rounded-md border border-emerald-200 dark:border-emerald-800/40">
                      Primary Studio
                    </span>
                  )}
                </p>
                <p className="text-[var(--text-secondary)] mt-0.5">{b.address}, {b.city}</p>
              </div>
              <div className="text-[var(--text-secondary)] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{b.opening_time.slice(0, 5)} - {b.closing_time.slice(0, 5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">Add New Branch</h3>
            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Branch Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad CG Road Branch"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Himmatnagar"
                  value={bCity}
                  onChange={(e) => setBCity(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Full Address *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shop 4-5, Shivalik Complex, Motipura..."
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={bOpen}
                    onChange={(e) => setBOpen(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={bClose}
                    onChange={(e) => setBClose(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
