import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ElementType;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  icon?: React.ElementType;
  size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  disabled = false,
  className = '',
  label,
  error,
  icon: LeadingIcon,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options if searchable
  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const pyClass = size === 'sm' ? 'py-1.5' : 'py-2';
  const textClass = size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full flex items-center justify-between gap-2 px-3.5 ${pyClass} ${textClass} rounded-xl border transition-all duration-150 text-left bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none ${
          isOpen
            ? 'border-[#6D28D9] dark:border-[#8B5CF6] ring-2 ring-[#6D28D9]/20 dark:ring-[#8B5CF6]/30'
            : error
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--surface-secondary)]' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {LeadingIcon && (
            <LeadingIcon className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6] shrink-0" />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6] shrink-0" />
          )}
          <span className={`truncate ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] border border-purple-200 dark:border-purple-800/40 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#6D28D9] dark:text-[#8B5CF6]' : ''
          }`}
        />
      </button>

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 mt-1.5 min-w-[200px] max-h-60 bg-white dark:bg-[#171225] rounded-2xl border border-[#E2E8F0] dark:border-[#332A46] shadow-dropdown dark:shadow-dropdown-dark py-1.5 z-50 overflow-hidden flex flex-col animate-scaleIn"
        >
          {/* Search box if enabled */}
          {searchable && (
            <div className="p-2 border-b border-[var(--border)] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Filter options..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[#6D28D9]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[var(--border)]/40 p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-3 text-xs text-center text-[var(--text-secondary)] italic">
                No matching options
              </p>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                const OptionIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-[#8B5CF6] font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100/80 dark:bg-[#211A32] text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-[#211A32]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {OptionIcon && (
                        <OptionIcon className="w-4 h-4 text-[#6D28D9] dark:text-[#8B5CF6] shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-[var(--text-secondary)] font-normal truncate">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)]">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

