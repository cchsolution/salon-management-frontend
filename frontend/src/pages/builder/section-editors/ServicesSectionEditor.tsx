import React from 'react';
import { Sparkles, Layers, Info } from 'lucide-react';

interface ServicesSectionEditorProps {
  content: any;
  serviceCount?: number;
  onChange: (field: string, value: any) => void;
}

export const ServicesSectionEditor: React.FC<ServicesSectionEditorProps> = ({
  content,
  serviceCount = 13,
  onChange,
}) => {
  return (
    <div className="space-y-5 text-xs">
      {/* Live sync banner */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-purple-900 dark:text-purple-200 text-xs">
            Live Synchronized Catalog
          </p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
            Connected dynamically with your Salon Management catalog ({serviceCount} verified active treatments in INR). Price or service edits made in Salon Management appear here automatically.
          </p>
        </div>
      </div>

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
            placeholder="e.g. Signature Treatments & Services"
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
            placeholder="Crafted with premium dermatological and hair-nourishing botanicals in Indian Rupees."
            className="input-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Layout & Grid Settings */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Grid Layout & Style
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Grid Columns</label>
            <select
              value={content.grid_columns || 3}
              onChange={(e) => onChange('grid_columns', Number(e.target.value))}
              className="input-field py-1 text-xs"
            >
              <option value={2}>2 Columns (Spacious)</option>
              <option value={3}>3 Columns (Standard)</option>
              <option value={4}>4 Columns (Compact)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Card Design Style</label>
            <select
              value={content.card_style || 'elevated'}
              onChange={(e) => onChange('card_style', e.target.value)}
              className="input-field py-1 text-xs"
            >
              <option value="elevated">Elevated (Shadow & Clean)</option>
              <option value="bordered">Bordered (Crisp Outline)</option>
              <option value="minimal">Minimal (Flat Minimalist)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">
            Max Services to Display ({content.max_services || 12})
          </label>
          <input
            type="range"
            min="3"
            max="24"
            step="1"
            value={content.max_services || 12}
            onChange={(e) => onChange('max_services', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Card Element Toggles */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Display Controls
        </h4>

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Category Filter Tabs</span>
          <input
            type="checkbox"
            checked={content.filter_by_category !== false}
            onChange={(e) => onChange('filter_by_category', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Price in INR (₹)</span>
          <input
            type="checkbox"
            checked={content.show_prices !== false}
            onChange={(e) => onChange('show_prices', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Service Duration</span>
          <input
            type="checkbox"
            checked={content.show_duration !== false}
            onChange={(e) => onChange('show_duration', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Service Description</span>
          <input
            type="checkbox"
            checked={content.show_description !== false}
            onChange={(e) => onChange('show_description', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Booking Button</span>
          <input
            type="checkbox"
            checked={content.show_booking_button !== false}
            onChange={(e) => onChange('show_booking_button', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        {content.show_booking_button !== false && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
            <label className="block text-[10px] text-slate-500 mb-0.5">Booking Button Label</label>
            <input
              type="text"
              value={content.booking_button_text || 'Book Service'}
              onChange={(e) => onChange('booking_button_text', e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
};
