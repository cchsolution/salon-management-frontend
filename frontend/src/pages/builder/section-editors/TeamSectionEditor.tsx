import React from 'react';
import { Users, Info } from 'lucide-react';
import { StaffProfile } from '../../../types';
import { ImageUploader } from '../../../components/ImageUploader';
import { DEFAULT_ASSETS } from '../../../constants/defaultWebsiteData';

interface TeamSectionEditorProps {
  content: any;
  staffList?: StaffProfile[];
  onChange: (field: string, value: any) => void;
}

export const TeamSectionEditor: React.FC<TeamSectionEditorProps> = ({
  content,
  staffList = [],
  onChange,
}) => {
  const overrides = content.members_override || {};

  const handleUpdateMember = (staffId: string, field: string, val: any) => {
    const updated = {
      ...overrides,
      [staffId]: {
        ...(overrides[staffId] || {}),
        [field]: val,
      },
    };
    onChange('members_override', updated);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Live sync banner */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-start gap-2.5">
        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-purple-900 dark:text-purple-200 text-xs">
            Staff Team Sync
          </p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
            Team members are automatically synchronized from your active Staff Profiles ({staffList.length} bookable specialists). You can customize photos, roles, or display preferences below.
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
            placeholder="e.g. Meet Our Expert Stylists & Artists"
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
            placeholder="Certified master hair colorists, beauticians, and bridal makeup specialists."
            className="textarea-field py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Show Stylist Bio</span>
          <input
            type="checkbox"
            checked={content.show_bio !== false}
            onChange={(e) => onChange('show_bio', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Team Member Cards Customization */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Stylist Profiles & Photos
        </h4>

        <div className="space-y-4">
          {staffList.map((stf, idx) => {
            const memberOverride = overrides[stf.id] || {};
            const defaultImg = DEFAULT_ASSETS.team[idx % DEFAULT_ASSETS.team.length];
            const currentImg = memberOverride.image !== undefined ? memberOverride.image : (stf.avatar_url || '');

            return (
              <div
                key={stf.id}
                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center"
                      style={{ backgroundColor: stf.color_code || '#6D28D9' }}
                    >
                      {stf.user_details?.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">
                        {stf.user_details?.full_name || stf.title}
                      </p>
                      <p className="text-[10px] text-slate-500">{stf.title}</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={memberOverride.hidden !== true}
                      onChange={(e) => handleUpdateMember(stf.id, 'hidden', !e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-purple-600"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {memberOverride.hidden !== true && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <ImageUploader
                      label={`${stf.user_details?.first_name || 'Stylist'} Portrait`}
                      helperText="Professional headshot or default portrait"
                      currentValue={currentImg}
                      defaultImage={defaultImg}
                      sectionType="STYLISTS_TEAM"
                      aspectRatio="square"
                      onChange={(url) => handleUpdateMember(stf.id, 'image', url)}
                      onResetToDefault={() => handleUpdateMember(stf.id, 'image', '')}
                    />

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Custom Bio / Speciality</label>
                      <input
                        type="text"
                        value={memberOverride.bio !== undefined ? memberOverride.bio : (stf.bio || '')}
                        onChange={(e) => handleUpdateMember(stf.id, 'bio', e.target.value)}
                        placeholder="e.g. 8+ years experience in bridal styling & balayage"
                        className="input-field py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
