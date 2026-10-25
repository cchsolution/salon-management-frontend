import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { DEFAULT_SECTION_DATA } from '../../../constants/defaultWebsiteData';

interface FaqSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const FaqSectionEditor: React.FC<FaqSectionEditorProps> = ({ content, onChange }) => {
  const faqs = (content.faqs && content.faqs.length > 0)
    ? content.faqs
    : DEFAULT_SECTION_DATA.FAQ.faqs;

  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleAddFaq = () => {
    const newF = {
      id: `faq_${Date.now()}`,
      question: 'Do you offer home bridal dressing service?',
      answer: 'Yes, our bridal artistic team travels for destination weddings and on-site dressing across Gujarat upon prior booking.',
    };
    const updated = [...faqs, newF];
    onChange('faqs', updated);
    setActiveIndex(updated.length - 1);
  };

  const handleUpdate = (index: number, field: 'question' | 'answer', val: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: val };
    onChange('faqs', updated);
  };

  const handleRemove = (index: number) => {
    const updated = faqs.filter((_: any, i: number) => i !== index);
    onChange('faqs', updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleReorder = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= faqs.length) return;
    const updated = [...faqs];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange('faqs', updated);
    setActiveIndex(target);
  };

  const currentFaq = faqs[activeIndex] || faqs[0];

  return (
    <div className="space-y-5 text-xs">
      {/* Headings */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Section Headings
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={content.heading || ''}
            onChange={(e) => onChange('heading', e.target.value)}
            placeholder="e.g. Frequently Asked Questions"
            className="input-field py-1.5 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subtitle / Description
          </label>
          <textarea
            rows={2}
            value={content.subheading || ''}
            onChange={(e) => onChange('subheading', e.target.value)}
            placeholder="Everything you need to know about booking, visits, and hygiene."
            className="input-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* FAQs List */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            FAQ Accordion Items ({faqs.length})
          </h4>
          <button
            type="button"
            onClick={handleAddFaq}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="w-3.5 h-3.5" /> Add Question
          </button>
        </div>

        {/* List */}
        <div className="space-y-1.5">
          {faqs.map((f: any, idx: number) => {
            const isSelected = idx === activeIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 pr-2 overflow-hidden">
                  <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <p className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                    {f.question || 'Untitled Question'}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorder(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === faqs.length - 1}
                    onClick={() => handleReorder(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={faqs.length <= 1}
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected FAQ Item */}
        {currentFaq && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
            <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300 block">
              Editing Question #{activeIndex + 1}
            </span>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Question</label>
              <input
                type="text"
                value={currentFaq.question || ''}
                onChange={(e) => handleUpdate(activeIndex, 'question', e.target.value)}
                placeholder="e.g. Can I choose my preferred stylist?"
                className="input-field py-1 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Answer</label>
              <textarea
                rows={3}
                value={currentFaq.answer || ''}
                onChange={(e) => handleUpdate(activeIndex, 'answer', e.target.value)}
                placeholder="Detailed answer explaining your salon policy or service details..."
                className="input-field py-1 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
