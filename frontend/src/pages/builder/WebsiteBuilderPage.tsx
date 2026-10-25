import React, { useState, useEffect } from 'react';
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  ArrowUp,
  ArrowDown,
  Layers,
  Palette,
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Instagram,
  Facebook,
  Youtube,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Website, WebsiteSection, WebsiteTheme, Service, StaffProfile, Branch } from '../../types';
import {
  DEFAULT_ASSETS,
  DEFAULT_SECTION_DATA,
  resolveImageUrl,
  handleImageFallback,
} from '../../constants/defaultWebsiteData';

// Section Editors
import { HeroSectionEditor } from './section-editors/HeroSectionEditor';
import { AboutSectionEditor } from './section-editors/AboutSectionEditor';
import { ServicesSectionEditor } from './section-editors/ServicesSectionEditor';
import { TeamSectionEditor } from './section-editors/TeamSectionEditor';
import { GallerySectionEditor } from './section-editors/GallerySectionEditor';
import { TestimonialsSectionEditor } from './section-editors/TestimonialsSectionEditor';
import { FaqSectionEditor } from './section-editors/FaqSectionEditor';
import { ContactSectionEditor } from './section-editors/ContactSectionEditor';
import { FooterSectionEditor } from './section-editors/FooterSectionEditor';
import { BrandThemeEditor } from './section-editors/BrandThemeEditor';
import { ResetSectionModal } from './section-editors/ResetSectionModal';

export const WebsiteBuilderPage: React.FC = () => {
  const { salon } = useAuth();
  const [website, setWebsite] = useState<Website | null>(null);
  const [theme, setTheme] = useState<WebsiteTheme | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Dynamic live catalog data for preview
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Viewport switcher
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Change tracking & operational states
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [sectionToReset, setSectionToReset] = useState<WebsiteSection | null>(null);

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  const fetchWebsiteData = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Website>('/builder/site/current/');
      setWebsite(data);
      if (data.theme) {
        setTheme(data.theme);
      } else {
        setTheme({
          id: 'default',
          primary_color: '#6D28D9',
          secondary_color: '#059669',
          accent_color: '#10B981',
          background_color: '#F8FAFC',
          text_color: '#1E1B2E',
          font_heading: 'Playfair Display',
          font_body: 'Inter',
          header_style: 'sticky',
          button_border_radius: 'rounded-xl',
        });
      }

      if (data.pages && data.pages.length > 0) {
        const homeSections = data.pages[0].sections || [];
        setSections(homeSections);
        if (homeSections.length > 0 && !selectedSectionId) {
          setSelectedSectionId(homeSections[0].id);
        }
      }

      // Fetch live catalog, staff, and branches for real-time preview
      if (salon?.slug) {
        try {
          const publicData = await api.get<any>(`/builder/public/${salon.slug}/`);
          if (publicData.catalog?.services) setServices(publicData.catalog.services);
          if (publicData.team) setStaff(publicData.team);
          if (publicData.branches) setBranches(publicData.branches);
        } catch {
          // If public endpoint is not published yet, fallback gracefully
        }
      }
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err?.message || 'Failed to load website builder.' });
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  };

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Section visibility toggle
  const handleToggleSection = (secId: string, currentVal: boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, is_enabled: !currentVal } : s))
    );
    markDirty();
  };

  // Section reorder (up/down)
  const handleReorder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    newSections.forEach((s, i) => {
      s.order = i;
    });
    setSections(newSections);
    markDirty();
  };

  // Update specific field within a section's content
  const handleUpdateContent = (secId: string, field: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            content: {
              ...(s.content || {}),
              [field]: value,
            },
          };
        }
        return s;
      })
    );
    markDirty();
  };

  // Update theme settings
  const handleUpdateTheme = (updatedTheme: WebsiteTheme) => {
    setTheme(updatedTheme);
    markDirty();
  };

  // Trigger reset confirmation modal
  const handleOpenResetModal = (sec: WebsiteSection) => {
    setSectionToReset(sec);
    setResetModalOpen(true);
  };

  // Execute section reset to default
  const handleConfirmReset = async () => {
    if (!sectionToReset) return;

    try {
      // Call backend reset action if possible
      try {
        const res: any = await api.post(`/builder/sections/${sectionToReset.id}/reset_default/`);
        if (res?.section) {
          setSections((prev) =>
            prev.map((s) => (s.id === sectionToReset.id ? res.section : s))
          );
        }
      } catch {
        // Fallback to local canonical schema if offline or draft
        const defaultSchema = DEFAULT_SECTION_DATA[sectionToReset.section_type] || {};
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionToReset.id
              ? { ...s, content: JSON.parse(JSON.stringify(defaultSchema)) }
              : s
          )
        );
      }

      setBannerMessage({
        type: 'success',
        text: `${sectionToReset.section_type.replace('_', ' ')} has been restored to default settings.`,
      });
      setTimeout(() => setBannerMessage(null), 3500);
      markDirty();
    } finally {
      setResetModalOpen(false);
      setSectionToReset(null);
    }
  };

  // Save Draft (saves all sections and theme without publishing)
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setBannerMessage(null);
    try {
      if (theme && theme.id) {
        await api.patch(`/builder/theme/${theme.id}/`, theme);
      }
      for (const s of sections) {
        await api.patch(`/builder/sections/${s.id}/`, {
          order: s.order,
          is_enabled: s.is_enabled,
          content: s.content,
        });
      }
      setIsDirty(false);
      setBannerMessage({ type: 'success', text: 'All draft changes saved successfully!' });
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err?.message || 'Unable to save draft changes. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to Live (copies draft to live storefront and creates version snapshot)
  const handlePublishLive = async () => {
    setIsPublishing(true);
    setBannerMessage(null);
    try {
      // Save latest state first
      if (theme && theme.id) await api.patch(`/builder/theme/${theme.id}/`, theme);
      for (const s of sections) {
        await api.patch(`/builder/sections/${s.id}/`, {
          order: s.order,
          is_enabled: s.is_enabled,
          content: s.content,
        });
      }

      const res = await api.post<{ message: string; website: Website }>('/builder/site/publish/');
      setIsDirty(false);
      setBannerMessage({
        type: 'success',
        text: res.message || 'Website published successfully! Your live salon storefront is now updated.',
      });
      fetchWebsiteData();
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err?.message || 'Unable to publish website. Please try again.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // Theme tokens
  const primaryColor = theme?.primary_color || '#6D28D9';
  const secondaryColor = theme?.secondary_color || '#059669';
  const accentColor = theme?.accent_color || '#10B981';
  const headingFont = theme?.font_heading || 'Playfair Display';
  const bodyFont = theme?.font_body || 'Inter';

  // Categories list
  const categoryList: string[] = Array.from(
    new Set(services.map((s) => s.category_name).filter((c): c is string => Boolean(c)))
  );
  const filteredServices = selectedCategory === 'ALL'
    ? services
    : services.filter((s) => s.category_name === selectedCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 sm:-m-6 lg:-m-8 bg-[var(--color-background)] overflow-hidden transition-colors duration-200">
      {/* Top Builder Control Bar */}
      <div className="h-16 px-4 sm:px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                {salon?.name || 'Ruhi Beauty Salon'} Website Builder
              </h2>
              {/* Unsaved Changes Indicator */}
              {isDirty ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> All Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Full Section Customization · Live Instant Preview · Multi-Tenant
            </p>
          </div>
        </div>

        {/* Responsive Viewport Toggles */}
        <div className="hidden sm:flex items-center gap-1 bg-[var(--color-surface-secondary)] p-1 rounded-xl border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'desktop'
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'tablet'
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'mobile'
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {salon?.slug && (
            <a
              href={`/s/${salon.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border)] rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Live Site</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={handlePublishLive}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isPublishing ? 'Publishing...' : 'Publish to Live'}</span>
          </button>
        </div>
      </div>

      {/* Banner Alert for Feedback */}
      {bannerMessage && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Builder Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Sections & Theme Inspector */}
        <div className="w-80 sm:w-96 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0 overflow-hidden z-10 transition-colors">
          {/* Main Tabs */}
          <div className="flex border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === 'sections'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Sections ({sections.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === 'theme'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Brand Theme
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'sections' ? (
              <>
                {/* Section List with Order & Visibility */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Homepage Sections
                    </span>
                    <span className="text-[10px] text-slate-400">Click section to edit</span>
                  </div>

                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        selectedSectionId === sec.id
                          ? 'bg-purple-50/70 border-purple-600 shadow-sm dark:bg-purple-950/40 dark:border-purple-500'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSection(sec.id, sec.is_enabled);
                          }}
                          className={
                            sec.is_enabled
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-600'
                          }
                          title={sec.is_enabled ? 'Section is visible (click to hide)' : 'Section is hidden (click to show)'}
                        >
                          {sec.is_enabled ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                          {sec.section_type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleReorder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(idx, 'down')}
                          disabled={idx === sections.length - 1}
                          className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Section Customization Panel */}
                {selectedSection && (
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                      <div>
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                          Edit {selectedSection.section_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {selectedSection.is_enabled ? 'Visible on live site' : 'Currently hidden'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(selectedSection)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title="Reset this section to its default settings"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>

                    {/* Render dedicated section editor */}
                    {selectedSection.section_type === 'HERO' && (
                      <HeroSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'ABOUT_US' && (
                      <AboutSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'SERVICES_GRID' && (
                      <ServicesSectionEditor
                        content={selectedSection.content || {}}
                        serviceCount={services.length}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'STYLISTS_TEAM' && (
                      <TeamSectionEditor
                        content={selectedSection.content || {}}
                        staffList={staff}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'GALLERY' && (
                      <GallerySectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'TESTIMONIALS' && (
                      <TestimonialsSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'FAQ' && (
                      <FaqSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'CONTACT_MAP' && (
                      <ContactSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}

                    {selectedSection.section_type === 'FOOTER' && (
                      <FooterSectionEditor
                        content={selectedSection.content || {}}
                        onChange={(field, val) => handleUpdateContent(selectedSection.id, field, val)}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Brand Theme Tab */
              theme && <BrandThemeEditor theme={theme} onChange={handleUpdateTheme} />
            )}
          </div>
        </div>

        {/* Right Side: Interactive Live Preview Frame */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-background)] p-4 md:p-8 flex justify-center transition-colors">
          <div
            className={`bg-white text-slate-900 transition-all duration-300 shadow-2xl rounded-2xl overflow-y-auto border border-[var(--color-border)] flex flex-col ${
              viewport === 'mobile'
                ? 'w-[375px] min-h-[667px]'
                : viewport === 'tablet'
                ? 'w-[768px] min-h-[1024px]'
                : 'w-full max-w-5xl min-h-screen'
            }`}
            style={{ fontFamily: bodyFont }}
          >
            {/* Storefront Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-lg"
                  style={{ color: primaryColor, fontFamily: headingFont }}
                >
                  {salon?.name || 'Ruhi Beauty Salon'}
                </span>
              </div>

              <nav className="hidden sm:flex items-center gap-5 text-xs font-medium text-slate-600">
                <span className="hover:text-purple-700 cursor-pointer">Services</span>
                <span className="hover:text-purple-700 cursor-pointer">About</span>
                <span className="hover:text-purple-700 cursor-pointer">Stylists</span>
                <span className="hover:text-purple-700 cursor-pointer">Gallery</span>
                <span className="hover:text-purple-700 cursor-pointer">Reviews</span>
                <span className="hover:text-purple-700 cursor-pointer">Contact</span>
              </nav>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition rounded-xl"
                style={{ backgroundColor: secondaryColor }}
              >
                Book Appointment
              </button>
            </header>

            {/* Live Rendered Sections */}
            <div className="flex-1">
              {sections
                .filter((s) => s.is_enabled)
                .map((sec) => {
                  const content = sec.content || {};

                  // 1. HERO SECTION PREVIEW
                  if (sec.section_type === 'HERO') {
                    const bgUrl = resolveImageUrl(content.background_image, DEFAULT_ASSETS.hero);
                    const overlayOpacity = (content.overlay_opacity ?? 65) / 100;
                    const overlayColor = content.overlay_color || '#0F091E';
                    const isOverlay = content.overlay_enabled !== false;
                    const align = content.text_alignment || 'center';

                    const heightClass =
                      content.hero_height === 'full'
                        ? 'min-h-[90vh]'
                        : content.hero_height === 'medium'
                        ? 'min-h-[460px]'
                        : 'min-h-[580px]';

                    return (
                      <div
                        key={sec.id}
                        className={`relative ${heightClass} flex items-center justify-center px-6 bg-cover bg-center text-white`}
                        style={{
                          backgroundImage: `url('${bgUrl}')`,
                        }}
                      >
                        {/* Dynamic Overlay */}
                        {isOverlay && (
                          <div
                            className="absolute inset-0 transition-opacity"
                            style={{
                              backgroundColor: overlayColor,
                              opacity: overlayOpacity,
                            }}
                          />
                        )}

                        <div
                          className={`relative z-10 max-w-3xl mx-auto py-16 space-y-4 ${
                            align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
                          }`}
                        >
                          {content.badge_text && (
                            <span
                              className="inline-block px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider mb-2 shadow-sm"
                              style={{
                                backgroundColor: content.badge_color || accentColor,
                                color: '#FFFFFF',
                              }}
                            >
                              {content.badge_text}
                            </span>
                          )}

                          <h1
                            className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-md"
                            style={{
                              fontFamily: headingFont,
                              color: content.heading_color || '#FFFFFF',
                            }}
                          >
                            {content.headline || 'Luxury Hair Styling & Bridal Studio'}
                          </h1>

                          <p
                            className="text-xs md:text-sm text-slate-100 max-w-xl leading-relaxed drop-shadow"
                            style={{
                              color: content.description_color || '#F1F5F9',
                              marginLeft: align === 'center' ? 'auto' : undefined,
                              marginRight: align === 'center' ? 'auto' : undefined,
                            }}
                          >
                            {content.subheadline ||
                              'Where artistry meets luxury hair care, radiant bridal transformations, and rejuvenating spa rituals in Himmatnagar & Ahmedabad.'}
                          </p>

                          <div
                            className={`pt-3 flex flex-wrap gap-3 ${
                              align === 'left'
                                ? 'justify-start'
                                : align === 'right'
                                ? 'justify-end'
                                : 'justify-center'
                            }`}
                          >
                            <button
                              type="button"
                              className={`px-6 py-2.5 text-xs font-bold shadow-lg transition ${
                                content.primary_button_radius || 'rounded-xl'
                              }`}
                              style={{
                                backgroundColor: content.primary_button_bg || primaryColor,
                                color: content.primary_button_text || '#FFFFFF',
                                border: `1px solid ${content.primary_button_border || primaryColor}`,
                              }}
                            >
                              {content.cta_text || 'Book Your Appointment'}
                            </button>

                            {content.secondary_cta_text && (
                              <button
                                type="button"
                                className={`px-5 py-2.5 text-xs font-bold backdrop-blur transition ${
                                  content.secondary_button_radius || 'rounded-xl'
                                }`}
                                style={{
                                  backgroundColor: content.secondary_button_bg || 'transparent',
                                  color: content.secondary_button_text || '#FFFFFF',
                                  border: `1px solid ${content.secondary_button_border || '#FFFFFF'}`,
                                }}
                              >
                                {content.secondary_cta_text}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. ABOUT US SECTION PREVIEW
                  if (sec.section_type === 'ABOUT_US') {
                    const aboutImg = resolveImageUrl(
                      content.image || content.main_image,
                      DEFAULT_ASSETS.about
                    );
                    const stats = content.stats || DEFAULT_SECTION_DATA.ABOUT_US.stats;
                    const features = content.feature_points || DEFAULT_SECTION_DATA.ABOUT_US.feature_points;

                    return (
                      <div key={sec.id} className="py-16 px-6 max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                          <div className="space-y-4">
                            <span
                              className="text-xs font-bold uppercase tracking-wider block"
                              style={{ color: secondaryColor }}
                            >
                              {content.subtitle || 'Founded with Passion & Care'}
                            </span>
                            <h2
                              className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight"
                              style={{ fontFamily: headingFont }}
                            >
                              {content.title || 'The Philosophy of Ruhi Beauty Salon'}
                            </h2>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {content.story ||
                                'We believe every woman deserves personalized beauty care in a serene, hygienic, and luxurious environment.'}
                            </p>

                            {/* Feature Bullets */}
                            <div className="space-y-2 pt-2">
                              {features.map((feat: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                  <span
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] shrink-0 mt-0.5"
                                    style={{ backgroundColor: secondaryColor }}
                                  >
                                    ✓
                                  </span>
                                  <span>{feat}</span>
                                </div>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                              {stats.map((st: any, i: number) => (
                                <div key={i}>
                                  <p
                                    className="text-xl font-bold font-mono"
                                    style={{ color: primaryColor }}
                                  >
                                    {st.value}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{st.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            <img
                              src={aboutImg}
                              alt="About Studio"
                              onError={(e) => handleImageFallback(e, DEFAULT_ASSETS.about)}
                              className="w-full h-80 object-cover"
                            />
                            {content.experience_number && (
                              <div
                                className="absolute bottom-4 left-4 p-3 rounded-xl text-white shadow-lg backdrop-blur-md"
                                style={{ backgroundColor: `${primaryColor}F0` }}
                              >
                                <p className="text-2xl font-bold font-mono leading-none">
                                  {content.experience_number}
                                </p>
                                <p className="text-[10px] text-slate-200 mt-1 max-w-[120px]">
                                  {content.experience_text || 'Years of Excellence'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 3. SERVICES GRID PREVIEW
                  if (sec.section_type === 'SERVICES_GRID') {
                    const columns = content.grid_columns || 3;
                    const gridClass =
                      columns === 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : columns === 4
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

                    const maxCount = content.max_services || 12;
                    const displayServices = filteredServices.slice(0, maxCount);

                    return (
                      <div key={sec.id} className="py-16 px-6 bg-slate-50 border-y border-slate-200">
                        <div className="max-w-5xl mx-auto space-y-8">
                          <div className="text-center max-w-xl mx-auto space-y-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: secondaryColor }}
                            >
                              Treatment Menu
                            </span>
                            <h2
                              className="text-2xl md:text-3xl font-bold text-slate-900"
                              style={{ fontFamily: headingFont }}
                            >
                              {content.heading || 'Signature Treatments & Services'}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {content.subheading ||
                                'Crafted with premium dermatological and hair-nourishing botanicals in Indian Rupees.'}
                            </p>
                          </div>

                          {/* Category Tabs */}
                          {content.filter_by_category !== false && categoryList.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                                  selectedCategory === 'ALL'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                All Treatments
                              </button>
                              {categoryList.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                                    selectedCategory === cat
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Cards Grid */}
                          <div className={`grid ${gridClass} gap-4`}>
                            {displayServices.map((svc) => (
                              <div
                                key={svc.id}
                                className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-300 transition ${
                                  content.card_style === 'bordered'
                                    ? 'border-2 border-slate-300'
                                    : content.card_style === 'minimal'
                                    ? 'shadow-none bg-slate-50/50'
                                    : 'shadow-sm hover:shadow-md'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[11px] mb-2">
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[10px]">
                                      {svc.category_name}
                                    </span>
                                    {content.show_duration !== false && (
                                      <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                                        <Clock className="w-3 h-3 text-purple-600" />
                                        {svc.duration_minutes}m
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-serif font-bold text-sm text-slate-900">
                                    {svc.name}
                                  </h3>
                                  {content.show_description !== false && (
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                      {svc.description}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                  {content.show_prices !== false && (
                                    <div>
                                      <span className="text-[9px] text-slate-400 block">Price</span>
                                      <span
                                        className="text-base font-bold font-mono"
                                        style={{ color: secondaryColor }}
                                      >
                                        ₹{svc.effective_price}
                                      </span>
                                    </div>
                                  )}

                                  {content.show_booking_button !== false && (
                                    <button
                                      type="button"
                                      className="px-3 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm hover:opacity-90 transition"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      {content.booking_button_text || 'Book Service'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 4. STYLISTS TEAM SECTION PREVIEW
                  if (sec.section_type === 'STYLISTS_TEAM') {
                    const overrides = content.members_override || {};
                    const visibleStaff = staff.filter(
                      (stf) => overrides[stf.id]?.hidden !== true
                    );

                    return (
                      <div key={sec.id} className="py-16 px-6 max-w-5xl mx-auto space-y-8">
                        <div className="text-center max-w-xl mx-auto space-y-2">
                          <span
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: secondaryColor }}
                          >
                            Artisans & Specialists
                          </span>
                          <h2
                            className="text-2xl md:text-3xl font-bold text-slate-900"
                            style={{ fontFamily: headingFont }}
                          >
                            {content.heading || 'Meet Our Expert Stylists & Artists'}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {content.subheading ||
                              'Certified master hair colorists, beauticians, and bridal makeup specialists.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {visibleStaff.map((stf, idx) => {
                            const ov = overrides[stf.id] || {};
                            const defaultImg =
                              DEFAULT_ASSETS.team[idx % DEFAULT_ASSETS.team.length];
                            const memberImg = resolveImageUrl(
                              ov.image !== undefined ? ov.image : stf.avatar_url,
                              defaultImg
                            );
                            const memberBio =
                              ov.bio !== undefined ? ov.bio : stf.bio;

                            return (
                              <div
                                key={stf.id}
                                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center hover:shadow-md transition"
                              >
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-md mb-3">
                                  <img
                                    src={memberImg}
                                    alt={stf.user_details?.full_name || 'Stylist'}
                                    onError={(e) => handleImageFallback(e, defaultImg)}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <h3 className="font-serif font-bold text-sm text-slate-900">
                                  {stf.user_details?.full_name || stf.title}
                                </h3>
                                <p
                                  className="text-xs font-semibold mt-0.5"
                                  style={{ color: secondaryColor }}
                                >
                                  {stf.title}
                                </p>
                                {content.show_bio !== false && memberBio && (
                                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                                    {memberBio}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // 5. GALLERY SECTION PREVIEW
                  if (sec.section_type === 'GALLERY') {
                    const galleryImages =
                      content.images && content.images.length > 0
                        ? content.images
                        : DEFAULT_ASSETS.gallery;

                    const cols = content.grid_columns || 4;
                    const aspect = content.aspect_ratio || 'square';
                    const aspectClass =
                      aspect === 'portrait'
                        ? 'aspect-[3/4]'
                        : aspect === 'landscape'
                        ? 'aspect-[16/9]'
                        : 'aspect-square';

                    const colClass =
                      cols === 2
                        ? 'grid-cols-2'
                        : cols === 3
                        ? 'grid-cols-2 md:grid-cols-3'
                        : 'grid-cols-2 md:grid-cols-4';

                    return (
                      <div key={sec.id} className="py-16 px-6 bg-slate-50 border-y border-slate-200">
                        <div className="max-w-5xl mx-auto space-y-8">
                          <div className="text-center max-w-xl mx-auto space-y-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: secondaryColor }}
                            >
                              Portfolio
                            </span>
                            <h2
                              className="text-2xl md:text-3xl font-bold text-slate-900"
                              style={{ fontFamily: headingFont }}
                            >
                              {content.heading || 'Salon Portfolio & Bridal Transformations'}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {content.subheading ||
                                'Real client results from our Himmatnagar and Ahmedabad studios.'}
                            </p>
                          </div>

                          <div className={`grid ${colClass} gap-3`}>
                            {galleryImages.map((img: any, i: number) => {
                              const fallbackImg =
                                DEFAULT_ASSETS.gallery[i % DEFAULT_ASSETS.gallery.length].url;
                              const imgSrc = resolveImageUrl(
                                typeof img === 'string' ? img : img.url,
                                fallbackImg
                              );
                              const caption = typeof img === 'object' ? img.caption : '';

                              return (
                                <div
                                  key={i}
                                  className={`group relative ${aspectClass} rounded-xl overflow-hidden shadow-sm bg-slate-200`}
                                >
                                  <img
                                    src={imgSrc}
                                    alt={caption || `Gallery ${i + 1}`}
                                    onError={(e) => handleImageFallback(e, fallbackImg)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  {caption && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                      <p className="text-[10px] text-white font-medium line-clamp-1">
                                        {caption}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 6. TESTIMONIALS SECTION PREVIEW
                  if (sec.section_type === 'TESTIMONIALS') {
                    const reviews =
                      content.testimonials || DEFAULT_SECTION_DATA.TESTIMONIALS.testimonials;

                    return (
                      <div key={sec.id} className="py-16 px-6 bg-[#171225] text-slate-100">
                        <div className="max-w-4xl mx-auto space-y-8">
                          <div className="text-center max-w-xl mx-auto space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                              Guest Reviews
                            </span>
                            <h2
                              className="text-2xl md:text-3xl font-bold text-white"
                              style={{ fontFamily: headingFont }}
                            >
                              {content.heading || 'Loved by Our Guests'}
                            </h2>
                            <p className="text-xs text-slate-300">
                              {content.subheading ||
                                'Read verified reviews from clients who trust Ruhi Beauty Salon.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {reviews.map((t: any, i: number) => {
                              const avatarImg = resolveImageUrl(
                                t.avatar,
                                DEFAULT_ASSETS.avatar
                              );
                              const ratingCount = t.rating || 5;

                              return (
                                <div
                                  key={i}
                                  className="p-5 bg-[#211A32] rounded-2xl border border-[#332A46] space-y-3"
                                >
                                  <div className="flex gap-1 text-amber-400">
                                    {[...Array(ratingCount)].map((_, idx) => (
                                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-200 italic leading-relaxed">
                                    "{t.quote}"
                                  </p>
                                  <div className="flex items-center gap-2.5 pt-2 border-t border-[#332A46]">
                                    <img
                                      src={avatarImg}
                                      alt={t.client}
                                      onError={(e) =>
                                        handleImageFallback(e, DEFAULT_ASSETS.avatar)
                                      }
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <div>
                                      <p className="font-bold text-xs text-white">{t.client}</p>
                                      <p className="text-[10px] text-emerald-400">{t.role}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 7. FAQ ACCORDION PREVIEW
                  if (sec.section_type === 'FAQ') {
                    const faqs = content.faqs || DEFAULT_SECTION_DATA.FAQ.faqs;

                    return (
                      <div key={sec.id} className="py-16 px-6 max-w-3xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                          <span
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: secondaryColor }}
                          >
                            Help & Questions
                          </span>
                          <h2
                            className="text-2xl md:text-3xl font-bold text-slate-900"
                            style={{ fontFamily: headingFont }}
                          >
                            {content.heading || 'Frequently Asked Questions'}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {content.subheading ||
                              'Everything you need to know about booking, visits, and hygiene.'}
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          {faqs.map((f: any, idx: number) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                              <div
                                key={idx}
                                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                                >
                                  <span>{f.question}</span>
                                  {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-purple-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                                {isOpen && (
                                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                                    {f.answer}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // 8. CONTACT SECTION PREVIEW
                  if (sec.section_type === 'CONTACT_MAP') {
                    const address =
                      content.address_downtown ||
                      salon?.address ||
                      'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001';
                    const phoneNum = content.phone_downtown || salon?.phone || '+91 98250 12345';
                    const whatsappNum = content.whatsapp_number || '+91 98250 12345';
                    const hours =
                      content.hours || 'Monday – Sunday: 9:00 AM – 8:00 PM';

                    return (
                      <div key={sec.id} className="py-16 px-6 bg-slate-50 border-t border-slate-200">
                        <div className="max-w-5xl mx-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: secondaryColor }}
                              >
                                Visit Us
                              </span>
                              <h2
                                className="text-2xl md:text-3xl font-bold text-slate-900"
                                style={{ fontFamily: headingFont }}
                              >
                                {content.heading || 'Visit Our Studios'}
                              </h2>
                              <p className="text-xs text-slate-500">
                                {content.subheading ||
                                  'Conveniently located in Himmatnagar and Ahmedabad with ample customer parking.'}
                              </p>

                              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                                <p className="flex items-center gap-2 text-slate-700">
                                  <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                                  <span>{address}</span>
                                </p>
                                <p className="flex items-center gap-2 text-slate-700">
                                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>{phoneNum}</span>
                                </p>
                                <p className="flex items-center gap-2 text-slate-700">
                                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                                  <span>{hours}</span>
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2.5 pt-1">
                                {content.show_whatsapp_button !== false && (
                                  <a
                                    href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {content.whatsapp_button_text || 'Chat on WhatsApp'}
                                  </a>
                                )}
                                {content.show_booking_button !== false && (
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow transition"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    {content.booking_button_text || 'Book Studio Visit'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Studio Map Card */}
                            <div className="bg-white rounded-2xl h-64 flex flex-col items-center justify-center border border-slate-200 shadow-md text-center p-6 space-y-2">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <MapPin className="w-6 h-6" />
                              </div>
                              <p className="font-serif font-bold text-slate-900 text-base">
                                Himmatnagar Central Studio
                              </p>
                              <p className="text-xs text-slate-500 max-w-xs">{address}</p>
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                                Valet & Dedicated Parking Available
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 9. FOOTER SECTION PREVIEW
                  if (sec.section_type === 'FOOTER') {
                    const social = content.social_links || {
                      instagram: 'https://instagram.com/ruhibeautysalon',
                      facebook: 'https://facebook.com/ruhibeautysalon',
                      whatsapp: 'https://wa.me/919825012345',
                      youtube: 'https://youtube.com/@ruhibeautysalon',
                    };

                    return (
                      <footer key={sec.id} className="py-10 px-6 bg-[#171225] text-slate-300 text-xs border-t border-[#332A46]">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="text-center md:text-left space-y-1">
                            <span
                              className="font-bold text-lg text-white block"
                              style={{ fontFamily: headingFont }}
                            >
                              {content.salon_name || salon?.name || 'Ruhi Beauty Salon'}
                            </span>
                            <p className="text-slate-400 text-xs">
                              {content.tagline ||
                                'Luxury Hair Styling, Bridal Transformations & Herbal Facials in Gujarat.'}
                            </p>
                            <p className="text-slate-500 text-[11px] pt-1">
                              {content.copyright ||
                                `© ${new Date().getFullYear()} Ruhi Beauty Salon. All rights reserved.`}
                            </p>
                          </div>

                          {/* Social links */}
                          {content.show_social_links !== false && (
                            <div className="flex items-center gap-3">
                              {social.instagram && (
                                <a
                                  href={social.instagram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-[#211A32] hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                                  title="Instagram"
                                >
                                  <Instagram className="w-4 h-4" />
                                </a>
                              )}
                              {social.facebook && (
                                <a
                                  href={social.facebook}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-[#211A32] hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                                  title="Facebook"
                                >
                                  <Facebook className="w-4 h-4" />
                                </a>
                              )}
                              {social.whatsapp && (
                                <a
                                  href={social.whatsapp}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-[#211A32] hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                              )}
                              {social.youtube && (
                                <a
                                  href={social.youtube}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-[#211A32] hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                                  title="YouTube"
                                >
                                  <Youtube className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </footer>
                    );
                  }

                  return null;
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ResetSectionModal
        isOpen={resetModalOpen}
        sectionName={sectionToReset?.section_type.replace('_', ' ') || 'Section'}
        onConfirm={handleConfirmReset}
        onCancel={() => {
          setResetModalOpen(false);
          setSectionToReset(null);
        }}
      />
    </div>
  );
};
