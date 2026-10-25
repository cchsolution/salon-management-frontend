import React from 'react';

interface FooterSectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const FooterSectionEditor: React.FC<FooterSectionEditorProps> = ({ content, onChange }) => {
  const socialLinks = content.social_links || {
    instagram: 'https://instagram.com/ruhibeautysalon',
    facebook: 'https://facebook.com/ruhibeautysalon',
    whatsapp: 'https://wa.me/919825012345',
    youtube: 'https://youtube.com/@ruhibeautysalon',
  };

  const handleUpdateSocial = (network: string, val: string) => {
    onChange('social_links', {
      ...socialLinks,
      [network]: val,
    });
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Brand & Tagline */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Footer Branding
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Salon Display Name
          </label>
          <input
            type="text"
            value={content.salon_name || ''}
            onChange={(e) => onChange('salon_name', e.target.value)}
            placeholder="Ruhi Beauty Salon"
            className="input-field py-1.5 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tagline / Bio
          </label>
          <input
            type="text"
            value={content.tagline || ''}
            onChange={(e) => onChange('tagline', e.target.value)}
            placeholder="Luxury Hair Styling, Bridal Transformations & Herbal Facials in Gujarat."
            className="input-field py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Copyright Notice
          </label>
          <input
            type="text"
            value={content.copyright || ''}
            onChange={(e) => onChange('copyright', e.target.value)}
            placeholder="© 2026 Ruhi Beauty Salon. All rights reserved."
            className="input-field py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Social Media Links */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Social Media Handles
          </h4>
          <input
            type="checkbox"
            checked={content.show_social_links !== false}
            onChange={(e) => onChange('show_social_links', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>

        {content.show_social_links !== false && (
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Instagram URL</label>
              <input
                type="text"
                value={socialLinks.instagram || ''}
                onChange={(e) => handleUpdateSocial('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="input-field py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Facebook URL</label>
              <input
                type="text"
                value={socialLinks.facebook || ''}
                onChange={(e) => handleUpdateSocial('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="input-field py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">WhatsApp Direct URL</label>
              <input
                type="text"
                value={socialLinks.whatsapp || ''}
                onChange={(e) => handleUpdateSocial('whatsapp', e.target.value)}
                placeholder="https://wa.me/919825012345"
                className="input-field py-1 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">YouTube Channel</label>
              <input
                type="text"
                value={socialLinks.youtube || ''}
                onChange={(e) => handleUpdateSocial('youtube', e.target.value)}
                placeholder="https://youtube.com/@..."
                className="input-field py-1 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Options */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Navigation Elements
        </h4>

        <div className="flex items-center justify-between py-1">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Quick Navigation Links</span>
          <input
            type="checkbox"
            checked={content.show_quick_links !== false}
            onChange={(e) => onChange('show_quick_links', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );
};
