import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, Mail } from 'lucide-react';

interface ContactSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const ContactSectionEditor: React.FC<ContactSectionEditorProps> = ({ content, onChange }) => {
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
            placeholder="e.g. Visit Our Studios"
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
            placeholder="Conveniently located in Himmatnagar and Ahmedabad with ample customer parking."
            className="input-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Indian Contact Details */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Studio Contact Details (India)
        </h4>

        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Central Studio Address</label>
          <input
            type="text"
            value={content.address_downtown || ''}
            onChange={(e) => onChange('address_downtown', e.target.value)}
            placeholder="Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001"
            className="input-field py-1 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Phone (Calling)</label>
            <input
              type="text"
              value={content.phone_downtown || ''}
              onChange={(e) => onChange('phone_downtown', e.target.value)}
              placeholder="+91 98250 12345"
              className="input-field py-1 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">WhatsApp Number</label>
            <input
              type="text"
              value={content.whatsapp_number || ''}
              onChange={(e) => onChange('whatsapp_number', e.target.value)}
              placeholder="+91 98250 12345"
              className="input-field py-1 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Studio Email</label>
            <input
              type="email"
              value={content.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="care@ruhibeauty.com"
              className="input-field py-1 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Opening Hours</label>
            <input
              type="text"
              value={content.hours || ''}
              onChange={(e) => onChange('hours', e.target.value)}
              placeholder="Monday – Sunday: 9:00 AM – 8:00 PM"
              className="input-field py-1 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Google Maps Embed / Link</label>
          <input
            type="text"
            value={content.map_embed_url || ''}
            onChange={(e) => onChange('map_embed_url', e.target.value)}
            placeholder="https://maps.google.com/..."
            className="input-field py-1 text-xs"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Interactive Contact CTAs
        </h4>

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show WhatsApp Chat Button</span>
          <input
            type="checkbox"
            checked={content.show_whatsapp_button !== false}
            onChange={(e) => onChange('show_whatsapp_button', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        {content.show_whatsapp_button !== false && (
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">WhatsApp Button Label</label>
            <input
              type="text"
              value={content.whatsapp_button_text || 'Chat on WhatsApp'}
              onChange={(e) => onChange('whatsapp_button_text', e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Book Visit Button</span>
          <input
            type="checkbox"
            checked={content.show_booking_button !== false}
            onChange={(e) => onChange('show_booking_button', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        {content.show_booking_button !== false && (
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Booking Button Label</label>
            <input
              type="text"
              value={content.booking_button_text || 'Book Studio Visit'}
              onChange={(e) => onChange('booking_button_text', e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
};
