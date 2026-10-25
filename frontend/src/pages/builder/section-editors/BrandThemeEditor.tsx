import React from 'react';
import { Palette, Type, Check } from 'lucide-react';
import { WebsiteTheme } from '../../../types';
import { THEME_COLOR_PRESETS, TYPOGRAPHY_OPTIONS, ColorPreset } from '../../../constants/defaultWebsiteData';

interface BrandThemeEditorProps {
  theme: WebsiteTheme;
  onChange: (updatedTheme: WebsiteTheme) => void;
}

export const BrandThemeEditor: React.FC<BrandThemeEditorProps> = ({ theme, onChange }) => {
  const handleApplyPreset = (preset: ColorPreset) => {
    onChange({
      ...theme,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      background_color: preset.background,
      text_color: preset.text,
    });
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Curated Luxury Color Palettes */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
          <Palette className="w-4 h-4" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider">
            Curated Color Palettes
          </h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Select a verified Indian luxury salon palette or customize individual colors below.
        </p>

        <div className="space-y-2">
          {THEME_COLOR_PRESETS.map((preset) => {
            const isSelected =
              theme.primary_color?.toLowerCase() === preset.primary.toLowerCase() &&
              theme.secondary_color?.toLowerCase() === preset.secondary.toLowerCase();

            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: preset.primary }}
                    title={`Primary: ${preset.primary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: preset.secondary }}
                    title={`Secondary: ${preset.secondary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: preset.accent }}
                    title={`Accent: ${preset.accent}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: preset.background }}
                    title={`Background: ${preset.background}`}
                  />
                  <span className="text-[10px] text-slate-500 ml-1.5">{preset.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Custom Color Pickers */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Individual Colors
        </h4>

        {/* Primary Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Primary Color (Deep Luxury Purple)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.primary_color || '#6D28D9'}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={theme.primary_color || '#6D28D9'}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="input-field py-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Secondary Accent (Emerald Green)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.secondary_color || '#059669'}
              onChange={(e) => onChange({ ...theme, secondary_color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={theme.secondary_color || '#059669'}
              onChange={(e) => onChange({ ...theme, secondary_color: e.target.value })}
              className="input-field py-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Accent Mint Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Highlight Accent (Mint Champagne)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accent_color || '#10B981'}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={theme.accent_color || '#10B981'}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="input-field py-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Canvas Background
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.background_color || '#F8FAFC'}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={theme.background_color || '#F8FAFC'}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="input-field py-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Primary Text Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.text_color || '#1E1B2E'}
              onChange={(e) => onChange({ ...theme, text_color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={theme.text_color || '#1E1B2E'}
              onChange={(e) => onChange({ ...theme, text_color: e.target.value })}
              className="input-field py-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Typography & Buttons */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
          <Type className="w-4 h-4" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider">
            Typography & Global Corners
          </h4>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Heading Font Family
          </label>
          <select
            value={theme.font_heading || 'Playfair Display'}
            onChange={(e) => onChange({ ...theme, font_heading: e.target.value })}
            className="input-field py-1.5 text-xs font-serif"
          >
            {TYPOGRAPHY_OPTIONS.headings.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Body Font Family
          </label>
          <select
            value={theme.font_body || 'Inter'}
            onChange={(e) => onChange({ ...theme, font_body: e.target.value })}
            className="input-field py-1.5 text-xs"
          >
            {TYPOGRAPHY_OPTIONS.bodies.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Global Button Radius
          </label>
          <select
            value={theme.button_border_radius || 'rounded-xl'}
            onChange={(e) => onChange({ ...theme, button_border_radius: e.target.value })}
            className="input-field py-1.5 text-xs"
          >
            <option value="rounded-none">Sharp Corners (0px)</option>
            <option value="rounded-md">Subtle (6px)</option>
            <option value="rounded-xl">Smooth Rounded (12px)</option>
            <option value="rounded-2xl">Modern Soft (16px)</option>
            <option value="rounded-full">Pill / Capsule (9999px)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
