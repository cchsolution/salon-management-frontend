import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  touched = true,
  helperText,
  className = '',
  children,
}) => {
  const showError = Boolean(touched && error);

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#0B0D17] dark:text-[#F8FAFC]"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1 font-bold" title="Required field">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {children}
      </div>

      {/* Stable layout for errors with smooth transition */}
      {showError ? (
        <div
          role="alert"
          className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium animate-fadeIn pt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] pt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

