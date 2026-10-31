import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Star, RotateCcw } from 'lucide-react';
import { ImageUploader } from '../../../components/ImageUploader';
import { DEFAULT_ASSETS, DEFAULT_SECTION_DATA } from '../../../constants/defaultWebsiteData';

interface TestimonialsSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const TestimonialsSectionEditor: React.FC<TestimonialsSectionEditorProps> = ({
  content,
  onChange,
}) => {
  const testimonials = (content.testimonials && content.testimonials.length > 0)
    ? content.testimonials
    : DEFAULT_SECTION_DATA.TESTIMONIALS.testimonials;

  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleAddTestimonial = () => {
    const newT = {
      id: `t_${Date.now()}`,
      client: 'Priya Mehta',
      role: 'Regular Guest, Himmatnagar',
      quote: 'Exceptional hospitality and wonderful results every single visit.',
      rating: 5,
      avatar: '',
    };
    const updated = [...testimonials, newT];
    onChange('testimonials', updated);
    setActiveIndex(updated.length - 1);
  };

  const handleUpdate = (index: number, field: string, val: any) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: val };
    onChange('testimonials', updated);
  };

  const handleRemove = (index: number) => {
    const updated = testimonials.filter((_: any, i: number) => i !== index);
    onChange('testimonials', updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleReorder = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= testimonials.length) return;
    const updated = [...testimonials];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange('testimonials', updated);
    setActiveIndex(target);
  };

  const currentT = testimonials[activeIndex] || testimonials[0];

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
            placeholder="e.g. Loved by Our Guests"
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
            placeholder="Read verified reviews from clients who trust Ruhi Beauty Salon."
            className="textarea-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Testimonials List */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Reviews ({testimonials.length})
          </h4>
          <button
            type="button"
            onClick={handleAddTestimonial}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="w-3.5 h-3.5" /> Add Review
          </button>
        </div>

        {/* List tabs */}
        <div className="space-y-1.5">
          {testimonials.map((t: any, idx: number) => {
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
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">
                      {t.client || 'Anonymous Client'}
                    </p>
                    <p className="text-[10px] text-slate-500">{t.role || 'Guest'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                    disabled={idx === testimonials.length - 1}
                    onClick={() => handleReorder(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={testimonials.length <= 1}
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

        {/* Selected Review Editor */}
        {currentT && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
            <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300 block">
              Editing Review: {currentT.client}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Client Name (Indian)</label>
                <input
                  type="text"
                  value={currentT.client || ''}
                  onChange={(e) => handleUpdate(activeIndex, 'client', e.target.value)}
                  placeholder="e.g. Ayesha Sheikh"
                  className="input-field py-1 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Role / Location</label>
                <input
                  type="text"
                  value={currentT.role || ''}
                  onChange={(e) => handleUpdate(activeIndex, 'role', e.target.value)}
                  placeholder="Bridal Client, Ahmedabad"
                  className="input-field py-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Review Quote</label>
              <textarea
                rows={3}
                value={currentT.quote || ''}
                onChange={(e) => handleUpdate(activeIndex, 'quote', e.target.value)}
                placeholder="What did the client say about their hair, makeup, or spa experience?"
                className="textarea-field py-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Star Rating (1 - 5)</label>
                <select
                  value={currentT.rating || 5}
                  onChange={(e) => handleUpdate(activeIndex, 'rating', Number(e.target.value))}
                  className="select-field py-1 text-xs font-semibold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>
            </div>

            <ImageUploader
              label="Client Avatar Photo (Optional)"
              helperText="Optional client portrait or default verified avatar"
              currentValue={currentT.avatar}
              defaultImage={DEFAULT_ASSETS.avatar}
              sectionType="TESTIMONIALS"
              aspectRatio="square"
              onChange={(url) => handleUpdate(activeIndex, 'avatar', url)}
              onResetToDefault={() => handleUpdate(activeIndex, 'avatar', '')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
