import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '../../../components/ImageUploader';
import { DEFAULT_ASSETS } from '../../../constants/defaultWebsiteData';

interface AboutSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const AboutSectionEditor: React.FC<AboutSectionEditorProps> = ({ content, onChange }) => {
  const featurePoints: string[] = content.feature_points || [
    'Certified Master Stylists & International Colorists',
    'Medical-grade sanitization for all scissors, brushes & tools',
    'Exclusive private bridal dressing suite with dedicated lounge',
    '100% genuine dermatological & organic herbal blends',
  ];

  const stats: Array<{ label: string; value: string }> = content.stats || [
    { label: 'Delighted Guests', value: '15,000+' },
    { label: 'Expert Specialists', value: '6 Artists' },
    { label: 'Five-Star Reviews', value: '99%' },
  ];

  const handleAddFeature = () => {
    onChange('feature_points', [...featurePoints, 'New Studio Amenity or Specialist Certification']);
  };

  const handleUpdateFeature = (index: number, val: string) => {
    const updated = [...featurePoints];
    updated[index] = val;
    onChange('feature_points', updated);
  };

  const handleRemoveFeature = (index: number) => {
    onChange('feature_points', featurePoints.filter((_, i) => i !== index));
  };

  const handleAddStat = () => {
    onChange('stats', [...stats, { label: 'New Metric', value: '100+' }]);
  };

  const handleUpdateStat = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: val };
    onChange('stats', updated);
  };

  const handleRemoveStat = (index: number) => {
    onChange('stats', stats.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Studio Photo & Fallback */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Main Studio Image
        </h4>
        <ImageUploader
          label="Studio Main Photo"
          helperText="Upload an elegant photo of your salon interior or team in action."
          currentValue={content.image || content.main_image}
          defaultImage={DEFAULT_ASSETS.about}
          sectionType="ABOUT_US"
          aspectRatio="square"
          onChange={(url) => {
            onChange('image', url);
            onChange('main_image', url);
          }}
          onResetToDefault={() => {
            onChange('image', '');
            onChange('main_image', '');
          }}
        />
      </div>

      {/* Story & Content */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Story & Headings
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Section Subtitle / Eyebrow
          </label>
          <input
            type="text"
            value={content.subtitle || ''}
            onChange={(e) => onChange('subtitle', e.target.value)}
            placeholder="e.g. Founded with Passion & Care"
            className="input-field py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="e.g. The Philosophy of Ruhi Beauty Salon"
            className="input-field py-1.5 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Brand Story / Philosophy
          </label>
          <textarea
            rows={4}
            value={content.story || ''}
            onChange={(e) => onChange('story', e.target.value)}
            placeholder="Tell your clients what makes your treatments and salon unique..."
            className="input-field py-1.5 text-xs"
          />
        </div>

        {/* Experience Counter */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Experience Counter</label>
            <input
              type="text"
              value={content.experience_number || '12+'}
              onChange={(e) => onChange('experience_number', e.target.value)}
              placeholder="e.g. 12+"
              className="input-field py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Experience Label</label>
            <input
              type="text"
              value={content.experience_text || 'Years of Excellence'}
              onChange={(e) => onChange('experience_text', e.target.value)}
              placeholder="Years of Excellence"
              className="input-field py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Feature Bullet Points */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Key Feature Highlights
          </h4>
          <button
            type="button"
            onClick={handleAddFeature}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="w-3.5 h-3.5" /> Add Point
          </button>
        </div>

        <div className="space-y-1.5">
          {featurePoints.map((pt, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={pt}
                onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                className="input-field py-1 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                title="Remove bullet"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Counters */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Key Metrics & Stats
          </h4>
          <button
            type="button"
            onClick={handleAddStat}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stat
          </button>
        </div>

        <div className="space-y-2">
          {stats.map((st, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
              <input
                type="text"
                value={st.value}
                onChange={(e) => handleUpdateStat(idx, 'value', e.target.value)}
                placeholder="Value (15k+)"
                className="input-field py-1 text-xs font-bold font-mono"
              />
              <input
                type="text"
                value={st.label}
                onChange={(e) => handleUpdateStat(idx, 'label', e.target.value)}
                placeholder="Label"
                className="input-field py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => handleRemoveStat(idx)}
                className="p-1 text-rose-500 hover:text-rose-700"
                title="Delete stat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Button */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          About Section Button
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Button Text</label>
            <input
              type="text"
              value={content.cta_text || 'Discover Our Story & Team'}
              onChange={(e) => onChange('cta_text', e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Button Link</label>
            <input
              type="text"
              value={content.cta_link || '#team'}
              onChange={(e) => onChange('cta_link', e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
