import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [salonName, setSalonName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register({
        role: 'SALON_OWNER',
        salon_name: salonName,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] p-6 sm:p-8 space-y-6 animate-scale-in">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
            Create Your Salon Organization
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Launch your multi-tenant salon SaaS workspace, website, booking calendar, and CRM in minutes.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-md animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Salon Name *</label>
            <input
              type="text"
              placeholder="e.g. Maison de Beauté Paris"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Owner First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Business Email *</label>
              <input
                type="email"
                placeholder="owner@salon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">Password (min 6 characters) *</label>
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
            {isLoading ? 'Creating Your Workspace...' : 'Launch Salon Organization'}
          </button>
        </form>
      </div>
    </div>
  );
};
