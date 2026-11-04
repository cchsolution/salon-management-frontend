import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full m-4',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = '',
  footer,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (contentRef.current && contentRef.current.contains(e.target as Node)) {
      return;
    }
    if (closeOnOutsideClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthMap[maxWidth]} max-h-[92vh] bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-scaleIn ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
            <div className="min-w-0 pr-3">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors active:scale-95 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

