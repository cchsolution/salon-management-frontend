import React from 'react';
import { ImageUploader } from '../../../components/ImageUploader';
import { DEFAULT_ASSETS } from '../../../constants/defaultWebsiteData';

interface HeroSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({ content, onChange }) => {
  return (
    <div className="space-y-5 text-xs">
      {/* Background Image & Fallback */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Hero Background Image
        </h4>
        <ImageUploader
          label="Hero Banner Image"
          helperText="Upload a high-resolution banner (1920x1080 recommended). Restores default image if removed."
          currentValue={content.background_image}
          defaultImage={DEFAULT_ASSETS.hero}
          sectionType="HERO"
          aspectRatio="wide"
          onChange={(url) => onChange('background_image', url)}
          onResetToDefault={() => onChange('background_image', '')}
        />
      </div>

      {/* Content */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Text Content
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Eyebrow Badge Text
          </label>
          <input
            type="text"
            value={content.badge_text || ''}
            onChange={(e) => onChange('badge_text', e.target.value)}
            placeholder="e.g. Top Rated Luxury Salon in Gujarat 2026"
            className="input-field py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Main Headline
          </label>
          <input
            type="text"
            value={content.headline || ''}
            onChange={(e) => onChange('headline', e.target.value)}
            placeholder="e.g. Your Beauty, Our Passion"
            className="input-field py-1.5 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description / Subheadline
          </label>
          <textarea
            rows={3}
            value={content.subheadline || ''}
            onChange={(e) => onChange('subheadline', e.target.value)}
            placeholder="Describe your salon's luxury experience and specialities..."
            className="textarea-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Call to Action Buttons
        </h4>

        {/* Primary CTA */}
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
            Primary Button
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Button Text</label>
              <input
                type="text"
                value={content.cta_text || ''}
                onChange={(e) => onChange('cta_text', e.target.value)}
                placeholder="Book Your Appointment"
                className="input-field py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Link / Action</label>
              <input
                type="text"
                value={content.cta_link || '#booking'}
                onChange={(e) => onChange('cta_link', e.target.value)}
                placeholder="#booking"
                className="input-field py-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Button BG</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={content.primary_button_bg || '#6D28D9'}
                  onChange={(e) => onChange('primary_button_bg', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border bg-transparent"
                />
                <span className="font-mono text-[10px]">{content.primary_button_bg || '#6D28D9'}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Text Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={content.primary_button_text || '#FFFFFF'}
                  onChange={(e) => onChange('primary_button_text', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border bg-transparent"
                />
                <span className="font-mono text-[10px]">{content.primary_button_text || '#FFFFFF'}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Shape</label>
              <select
                value={content.primary_button_radius || 'rounded-xl'}
                onChange={(e) => onChange('primary_button_radius', e.target.value)}
                className="select-field py-1 text-[11px]"
              >
                <option value="rounded-none">Square</option>
                <option value="rounded-md">Subtle (md)</option>
                <option value="rounded-xl">Smooth (xl)</option>
                <option value="rounded-full">Pill (full)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
            Secondary Button
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Button Text</label>
              <input
                type="text"
                value={content.secondary_cta_text || ''}
                onChange={(e) => onChange('secondary_cta_text', e.target.value)}
                placeholder="Explore Services"
                className="input-field py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Link / Action</label>
              <input
                type="text"
                value={content.secondary_cta_link || '#services'}
                onChange={(e) => onChange('secondary_cta_link', e.target.value)}
                placeholder="#services"
                className="input-field py-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Border Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={content.secondary_button_border || '#FFFFFF'}
                  onChange={(e) => onChange('secondary_button_border', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border bg-transparent"
                />
                <span className="font-mono text-[10px]">{content.secondary_button_border || '#FFFFFF'}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Text Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={content.secondary_button_text || '#FFFFFF'}
                  onChange={(e) => onChange('secondary_button_text', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border bg-transparent"
                />
                <span className="font-mono text-[10px]">{content.secondary_button_text || '#FFFFFF'}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Shape</label>
              <select
                value={content.secondary_button_radius || 'rounded-xl'}
                onChange={(e) => onChange('secondary_button_radius', e.target.value)}
                className="select-field py-1 text-[11px]"
              >
                <option value="rounded-none">Square</option>
                <option value="rounded-md">Subtle (md)</option>
                <option value="rounded-xl">Smooth (xl)</option>
                <option value="rounded-full">Pill (full)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay & Layout Settings */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Overlay & Layout
        </h4>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Dark Background Overlay
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={content.overlay_enabled !== false}
              onChange={(e) => onChange('overlay_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {content.overlay_enabled !== false && (
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-500">Overlay Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={content.overlay_color || '#0F091E'}
                  onChange={(e) => onChange('overlay_color', e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border bg-transparent"
                />
                <span className="font-mono text-[10px]">{content.overlay_color || '#0F091E'}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>Overlay Intensity</span>
                <span className="font-semibold">{content.overlay_opacity ?? 65}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={content.overlay_opacity ?? 65}
                onChange={(e) => onChange('overlay_opacity', Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Text Alignment</label>
            <select
              value={content.text_alignment || 'center'}
              onChange={(e) => onChange('text_alignment', e.target.value)}
              className="select-field py-1 text-xs"
            >
              <option value="left">Left Aligned</option>
              <option value="center">Centered</option>
              <option value="right">Right Aligned</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Hero Height</label>
            <select
              value={content.hero_height || 'large'}
              onChange={(e) => onChange('hero_height', e.target.value)}
              className="select-field py-1 text-xs"
            >
              <option value="medium">Medium (500px)</option>
              <option value="large">Spacious (650px)</option>
              <option value="full">Full Screen (100vh)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
