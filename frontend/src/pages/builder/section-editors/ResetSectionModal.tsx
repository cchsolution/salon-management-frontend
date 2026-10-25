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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset {sectionName}?
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Resetting will restore the default Indian salon template text, images, buttons, and layout for <strong className="text-purple-600 dark:text-purple-400 font-semibold">{sectionName}</strong>. Any custom modifications will be replaced with official system defaults.
        </p>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> You can preview the reset immediately and click <em>Save Draft</em> or <em>Publish to Live</em> when satisfied.
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Section
          </button>
        </div>
      </div>
    </div>
  );
};
