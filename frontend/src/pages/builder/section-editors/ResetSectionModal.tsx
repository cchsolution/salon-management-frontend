import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetSectionModalProps {
  isOpen: boolean;
  sectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetSectionModal: React.FC<ResetSectionModalProps> = ({
  isOpen,
  sectionName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Reset {sectionName}?
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Resetting will restore the default Indian salon template text, images, buttons, and layout for <strong className="text-[#6D28D9] dark:text-[#8B5CF6] font-semibold">{sectionName}</strong>. Any custom modifications will be replaced with official system defaults.
        </p>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> You can preview the reset immediately and click <em>Save Draft</em> or <em>Publish to Live</em> when satisfied.
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Section</span>
          </button>
        </div>
      </div>
    </div>
  );
};
