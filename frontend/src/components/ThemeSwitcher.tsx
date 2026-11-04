import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Laptop },
  ];

  const CurrentIcon =
    themeMode === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative inline-block text-left font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme mode"
        className="p-2 rounded-xl text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0B0D17] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A24E9]/30 active:scale-95 cursor-pointer"
      >
        <CurrentIcon className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF]" />
        {!compact && (
          <span className="text-xs font-semibold capitalize hidden sm:inline text-[#0B0D17] dark:text-[#F8FAFC]">
            {themeMode}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-2xl bg-white dark:bg-[#141A2E] border border-[#CACED6] dark:border-[#252F4E] shadow-dropdown dark:shadow-dropdown-dark py-1.5 z-50 animate-scaleIn">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A9B6C0] dark:text-[#94A3B8]">
            Appearance
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setThemeMode(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#0A24E9] dark:text-[#4D68FF] bg-[#EEF2FF] dark:bg-[#1E294B] font-semibold'
                    : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#1C2542] hover:text-[#0B0D17] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#5C9764] dark:text-[#7DB585]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
