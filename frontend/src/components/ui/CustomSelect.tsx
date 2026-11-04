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
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs min-h-[34px]',
    md: 'py-2 px-3.5 text-xs sm:text-sm min-h-[40px]',
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full font-sans ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-[var(--surface)] text-[var(--text-primary)] transition-all duration-150 select-none text-left focus:outline-none focus:ring-2 focus:ring-[#0A24E9]/20 focus:border-[#0A24E9] ${
          sizeClasses[size]
        } ${
          isOpen
            ? 'border-[#0A24E9] ring-2 ring-[#0A24E9]/20 shadow-xs'
            : error
            ? 'border-red-500 ring-1 ring-red-500/20'
            : 'border-[#CACED6] dark:border-[#252F4E] hover:border-[#0A24E9]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--surface-secondary)]' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {LeadingIcon && (
            <LeadingIcon className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF] shrink-0" />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF] shrink-0" />
          )}
          <span className={`truncate ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#4D68FF] border border-[#0A24E9]/20 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0A24E9] dark:text-[#4D68FF]' : ''
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
          className="absolute left-0 right-0 mt-1.5 min-w-[200px] max-h-60 bg-white dark:bg-[#141A2E] rounded-2xl border border-[#CACED6] dark:border-[#252F4E] shadow-dropdown dark:shadow-dropdown-dark py-1.5 z-50 overflow-hidden flex flex-col animate-scaleIn"
        >
          {/* Search box if enabled */}
          {searchable && (
            <div className="p-2 border-b border-[#CACED6]/70 dark:border-[#252F4E] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] absolute left-2.5 top-2.5" />
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
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F0F2F5] dark:bg-[#1C2542] text-[var(--text-primary)] rounded-lg border border-[#CACED6]/70 dark:border-[#252F4E] focus:outline-none focus:border-[#0A24E9]"
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
          <div className="overflow-y-auto flex-1 divide-y divide-[#CACED6]/30 dark:divide-[#252F4E]/40 p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-3 text-xs text-center text-[#6B7280] dark:text-[#94A3B8] italic">
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
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#EEF2FF] dark:bg-[#1E294B] text-[#0A24E9] dark:text-[#60A5FA] font-semibold'
                        : isHighlighted
                        ? 'bg-[#EFF4FF] dark:bg-[#1A233D] text-[#0A24E9] dark:text-[#60A5FA]'
                        : 'text-[var(--text-primary)] hover:bg-[#EFF4FF] hover:text-[#0A24E9] dark:hover:bg-[#1A233D] dark:hover:text-[#60A5FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {OptionIcon && (
                        <OptionIcon className="w-4 h-4 text-[#0A24E9] dark:text-[#4D68FF] shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-normal truncate">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#F0F2F5] dark:bg-[#1C2542] text-[#6B7280] dark:text-[#94A3B8]">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5C9764] dark:text-[#7DB585]" />
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
