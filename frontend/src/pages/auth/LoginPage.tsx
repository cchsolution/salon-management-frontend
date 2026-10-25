import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('owner@ruhibeauty.local');
  const [password, setPassword] = useState('Owner@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#6D28D9] dark:text-[#8B5CF6] font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            R
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] pt-2">
            Ruhi Beauty Salon
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Salon SaaS Management Platform · Indian Market Edition
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Buttons */}
        <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-xs space-y-2">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            1-Click Demo Login (Gujarat Salon)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('owner@ruhibeauty.local', 'Owner@123')}
              className="px-2.5 py-2 font-semibold text-[var(--text-primary)] bg-[var(--surface)] hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg border border-[var(--border)] hover:border-[#6D28D9]/40 text-left truncate transition-colors text-xs"
            >
              👑 Salon Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ayesha@ruhibeauty.local', 'Stylist@123')}
              className="px-2.5 py-2 font-semibold text-[var(--text-primary)] bg-[var(--surface)] hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg border border-[var(--border)] hover:border-[#6D28D9]/40 text-left truncate transition-colors text-xs"
            >
              ✂️ Hair Stylist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('reception@ruhibeauty.local', 'Staff@123')}
              className="px-2.5 py-2 font-semibold text-[var(--text-primary)] bg-[var(--surface)] hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg border border-[var(--border)] hover:border-[#6D28D9]/40 text-left truncate transition-colors text-xs"
            >
              📋 Receptionist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@luxesalon.local', 'Admin@123')}
              className="px-2.5 py-2 font-semibold text-[var(--text-primary)] bg-[var(--surface)] hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg border border-[var(--border)] hover:border-[#6D28D9]/40 text-left truncate transition-colors text-xs"
            >
              🛡️ Superadmin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2.5 text-sm font-bold shadow-md"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--border)]">
          <Link to="/register" className="text-xs font-semibold text-[#6D28D9] dark:text-[#8B5CF6] hover:underline">
            Register a New Salon Organization →
          </Link>
        </div>
      </div>
    </div>
  );
};
