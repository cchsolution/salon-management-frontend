import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  User,
  AlertCircle,
  MessageSquare,
  Instagram,
  Facebook,
  Youtube,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import { Service, ServiceCategory, StaffProfile, Branch, Salon, WebsiteTheme } from '../../types';
import {
  DEFAULT_ASSETS,
  DEFAULT_SECTION_DATA,
  resolveImageUrl,
  handleImageFallback,
} from '../../constants/defaultWebsiteData';
import { Skeleton } from '../../components/ui/Skeleton';

export const SalonStorefrontPage: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [theme, setTheme] = useState<WebsiteTheme | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [team, setTeam] = useState<StaffProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery & FAQ interactive state
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('ALL');

  // Self-Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    fetchStorefront();
  }, [salonSlug]);

  const fetchStorefront = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<any>(`/builder/public/${salonSlug}/`);
      setSalon(data.salon);
      setTheme(data.website?.theme || null);
      if (data.website?.pages && data.website.pages.length > 0) {
        setSections(data.website.pages[0].sections || []);
      }
      setServices(data.catalog?.services || []);
      setCategories(data.catalog?.categories || []);
      setTeam(data.team || []);
      setBranches(data.branches || []);

      if (data.branches?.length > 0) setSelectedBranch(data.branches[0].id);
      if (data.team?.length > 0) setSelectedStaff(data.team[0].id);
    } catch (err: any) {
      setError(err.message || 'Salon website not found or unpublished.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available slots when booking modal parameters change
  useEffect(() => {
    if (!isBookModalOpen || !selectedStaff || !bookingDate || !selectedService) return;

    const fetchSlots = async () => {
      try {
        const res = await api.get<{ slots: string[] }>(
          `/appointments/bookings/available_slots/?salon_slug=${salonSlug}&date=${bookingDate}&staff_id=${selectedStaff}&branch_id=${selectedBranch}&duration=${selectedService.duration_minutes}`
        );
        setAvailableSlots(res.slots || []);
        if (res.slots && res.slots.length > 0) {
          setSelectedSlot(res.slots[0]);
        } else {
          setSelectedSlot('');
        }
      } catch {
        setAvailableSlots([]);
      }
    };

    fetchSlots();
  }, [isBookModalOpen, selectedStaff, bookingDate, selectedService, selectedBranch]);

  const handleSelfBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    setIsSubmittingBooking(true);
    try {
      await api.post('/appointments/bookings/', {
        salon_id: salon?.id,
        branch_id: selectedBranch,
        staff_id: selectedStaff,
        service_ids: [selectedService.id],
        date: bookingDate,
        start_time: selectedSlot,
        customer_first_name: clientName,
        customer_phone: clientPhone,
        customer_email: clientEmail,
        notes: clientNotes,
        booking_source: 'ONLINE',
      });
      setBookingConfirmed(true);
    } catch (err: any) {
      alert(err.message || 'Failed to complete booking. Please choose another slot.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const openBookingModalWithService = (svc?: Service) => {
    if (svc) {
      setSelectedService(svc);
    } else if (services.length > 0) {
      setSelectedService(services[0]);
    }
    setBookingConfirmed(false);
    setIsBookModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] animate-fade-in">
        {/* Header Skeleton */}
        <div className="h-20 border-b border-[var(--border)] px-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="w-36 h-5 rounded" />
              <Skeleton className="w-24 h-3 rounded" />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-32 h-9 rounded-xl" />
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="h-96 rounded-3xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-12 w-2/3 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded" />
            <div className="flex gap-3 pt-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Services Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <div className="pt-2 flex justify-between items-center">
                  <Skeleton className="h-6 w-20 rounded" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[var(--color-border)]">
          <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">Salon Not Found</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            {error || 'This salon website does not exist or has not been published.'}
          </p>
          <Link
            to="/login"
            className="inline-block mt-4 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition"
          >
            Go to Platform Portal
          </Link>
        </div>
      </div>
    );
  }

  // Theme tokens
  const primaryColor = theme?.primary_color || '#6D28D9';
  const secondaryColor = theme?.secondary_color || '#059669';
  const accentColor = theme?.accent_color || '#10B981';
  const headingFont = theme?.font_heading || 'Playfair Display';
  const bodyFont = theme?.font_body || 'Inter';

  // Categories list for services
  const serviceCategories: string[] = Array.from(
    new Set(services.map((s) => s.category_name).filter((c): c is string => Boolean(c)))
  );
  const filteredServices = selectedServiceCategory === 'ALL'
    ? services
    : services.filter((s) => s.category_name === selectedServiceCategory);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans selection:bg-purple-500/20" style={{ fontFamily: bodyFont }}>
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white font-bold text-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {salon.name[0]}
            </div>
            <div>
              <span className="font-bold text-base md:text-lg tracking-wide block" style={{ color: primaryColor, fontFamily: headingFont }}>
                {salon.name}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest hidden sm:block">
                {salon.tagline || 'Your Beauty, Our Passion'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--color-text-secondary)]">
            <a href="#services" className="hover:text-purple-600 transition">Services</a>
            <a href="#about" className="hover:text-purple-600 transition">About</a>
            <a href="#team" className="hover:text-purple-600 transition">Stylists</a>
            <a href="#gallery" className="hover:text-purple-600 transition">Gallery</a>
            <a href="#reviews" className="hover:text-purple-600 transition">Reviews</a>
            <a href="#contact" className="hover:text-purple-600 transition">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openBookingModalWithService()}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-full shadow-md hover:opacity-95 transition"
              style={{ backgroundColor: secondaryColor }}
            >
              Book Appointment
            </button>
            <Link
              to="/login"
              className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-purple-600 border border-[var(--color-border)] px-3 py-2 rounded-full hidden sm:block transition"
            >
              Owner Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Render Dynamic Published Sections (in exact salon owner order) */}
      {sections.map((sec) => {
        const content = sec.content || {};

        // 1. HERO SECTION
        if (sec.section_type === 'HERO') {
          const bgUrl = resolveImageUrl(content.background_image, DEFAULT_ASSETS.hero);
          const overlayOpacity = (content.overlay_opacity ?? 65) / 100;
          const overlayColor = content.overlay_color || '#0F091E';
          const isOverlay = content.overlay_enabled !== false;
          const align = content.text_alignment || 'center';

          const heightClass =
            content.hero_height === 'full'
              ? 'min-h-screen'
              : content.hero_height === 'medium'
              ? 'min-h-[500px]'
              : 'min-h-[640px]';

          return (
            <section
              key={sec.id}
              className={`relative ${heightClass} flex items-center justify-center text-white px-6 bg-cover bg-center`}
              style={{ backgroundImage: `url('${bgUrl}')` }}
            >
              {isOverlay && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
                />
              )}

              <div
                className={`relative z-10 max-w-4xl mx-auto py-20 space-y-4 ${
                  align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
                }`}
              >
                {content.badge_text && (
                  <span
                    className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-md mb-2"
                    style={{ backgroundColor: content.badge_color || accentColor, color: '#FFFFFF' }}
                  >
                    {content.badge_text}
                  </span>
                )}

                <h1
                  className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight drop-shadow-md"
                  style={{ fontFamily: headingFont, color: content.heading_color || '#FFFFFF' }}
                >
                  {content.headline || 'Luxury Hair Styling & Bridal Studio'}
                </h1>

                <p
                  className="text-sm md:text-base text-slate-100 max-w-2xl leading-relaxed drop-shadow"
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
                  className={`pt-4 flex flex-wrap gap-3 ${
                    align === 'left'
                      ? 'justify-start'
                      : align === 'right'
                      ? 'justify-end'
                      : 'justify-center'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openBookingModalWithService()}
                    className={`px-8 py-3.5 text-sm font-bold shadow-xl hover:scale-105 transition-all ${
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
                    <a
                      href={content.secondary_cta_link || '#services'}
                      className={`px-7 py-3.5 text-sm font-bold backdrop-blur hover:bg-white/20 transition ${
                        content.secondary_button_radius || 'rounded-xl'
                      }`}
                      style={{
                        backgroundColor: content.secondary_button_bg || 'transparent',
                        color: content.secondary_button_text || '#FFFFFF',
                        border: `1px solid ${content.secondary_button_border || '#FFFFFF'}`,
                      }}
                    >
                      {content.secondary_cta_text}
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        }

        // 2. ABOUT US SECTION
        if (sec.section_type === 'ABOUT_US') {
          const aboutImg = resolveImageUrl(
            content.image || content.main_image,
            DEFAULT_ASSETS.about
          );
          const stats = content.stats || DEFAULT_SECTION_DATA.ABOUT_US.stats;
          const features = content.feature_points || DEFAULT_SECTION_DATA.ABOUT_US.feature_points;

          return (
            <section key={sec.id} id="about" className="py-24 px-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: secondaryColor }}>
                    {content.subtitle || 'Founded with Passion & Care'}
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] leading-tight"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.title || 'The Philosophy of Ruhi Beauty Salon'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {content.story ||
                      'We believe every woman deserves personalized beauty care in a serene, hygienic, and luxurious environment.'}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          ✓
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--color-border)]">
                    {stats.map((st: any, i: number) => (
                      <div key={i}>
                        <p className="text-2xl font-bold font-mono" style={{ color: primaryColor }}>
                          {st.value}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{st.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src={aboutImg}
                    alt="Salon Studio"
                    onError={(e) => handleImageFallback(e, DEFAULT_ASSETS.about)}
                    className="w-full h-96 lg:h-[450px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {content.experience_number && (
                    <div
                      className="absolute bottom-6 left-6 p-4 rounded-2xl text-white shadow-xl backdrop-blur-md"
                      style={{ backgroundColor: `${primaryColor}F0` }}
                    >
                      <p className="text-3xl font-bold font-mono leading-none">
                        {content.experience_number}
                      </p>
                      <p className="text-xs text-slate-100 mt-1 max-w-[140px]">
                        {content.experience_text || 'Years of Excellence'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        // 3. SERVICES GRID
        if (sec.section_type === 'SERVICES_GRID') {
          const columns = content.grid_columns || 3;
          const gridClass =
            columns === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : columns === 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

          const maxCount = content.max_services || 12;
          const displayServices = filteredServices.slice(0, maxCount);

          return (
            <section
              key={sec.id}
              id="services"
              className="py-24 px-6 bg-[var(--color-surface)] border-y border-[var(--color-border)]"
            >
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Treatment Menu
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Signature Treatments & Services'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    {content.subheading ||
                      'Crafted with premium dermatological and hair-nourishing botanicals in Indian Rupees.'}
                  </p>
                </div>

                {content.filter_by_category !== false && serviceCategories.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategory('ALL')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                        selectedServiceCategory === 'ALL'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-[var(--color-border)]'
                      }`}
                    >
                      All Treatments
                    </button>
                    {serviceCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedServiceCategory(cat)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                          selectedServiceCategory === cat
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-[var(--color-border)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`grid ${gridClass} gap-6`}>
                  {displayServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-6 bg-[var(--color-background)] hover:bg-white rounded-2xl border border-[var(--color-border)] hover:border-purple-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="px-2.5 py-0.5 font-semibold bg-purple-50 text-purple-700 rounded-md text-[10px]">
                            {svc.category_name}
                          </span>
                          {content.show_duration !== false && (
                            <span className="flex items-center gap-1 text-[var(--color-text-secondary)] text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              {svc.duration_minutes}m
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[var(--color-text-primary)] mt-1" style={{ fontFamily: headingFont }}>
                          {svc.name}
                        </h3>
                        {content.show_description !== false && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-3">
                            {svc.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                        {content.show_prices !== false && (
                          <div>
                            <span className="text-[10px] text-[var(--color-text-secondary)] block">Price</span>
                            <span className="text-xl font-bold font-mono" style={{ color: secondaryColor }}>
                              ₹{svc.effective_price}
                            </span>
                          </div>
                        )}

                        {content.show_booking_button !== false && (
                          <button
                            type="button"
                            onClick={() => openBookingModalWithService(svc)}
                            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow hover:opacity-90 transition"
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
            </section>
          );
        }

        // 4. STYLISTS TEAM
        if (sec.section_type === 'STYLISTS_TEAM') {
          const overrides = content.members_override || {};
          const visibleStaff = team.filter((stf) => overrides[stf.id]?.hidden !== true);

          return (
            <section key={sec.id} id="team" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                  Artisans & Specialists
                </span>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]"
                  style={{ fontFamily: headingFont }}
                >
                  {content.heading || 'Meet Our Expert Stylists & Artists'}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  {content.subheading ||
                    'Certified master hair colorists, beauticians, and bridal makeup specialists.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleStaff.map((stf, idx) => {
                  const ov = overrides[stf.id] || {};
                  const defaultImg = DEFAULT_ASSETS.team[idx % DEFAULT_ASSETS.team.length];
                  const memberImg = resolveImageUrl(
                    ov.image !== undefined ? ov.image : stf.avatar_url,
                    defaultImg
                  );
                  const memberBio = ov.bio !== undefined ? ov.bio : stf.bio;

                  return (
                    <div
                      key={stf.id}
                      className="p-6 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm text-center flex flex-col items-center hover:shadow-lg transition"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-md mb-4">
                        <img
                          src={memberImg}
                          alt={stf.user_details?.full_name || 'Stylist'}
                          onError={(e) => handleImageFallback(e, defaultImg)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]" style={{ fontFamily: headingFont }}>
                        {stf.user_details?.full_name || stf.title}
                      </h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: secondaryColor }}>
                        {stf.title}
                      </p>
                      {content.show_bio !== false && memberBio && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-3 line-clamp-3">
                          {memberBio}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(stf.id);
                          openBookingModalWithService();
                        }}
                        className="mt-5 px-4 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition"
                      >
                        Book with {stf.user_details?.first_name || 'Stylist'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        // 5. GALLERY SECTION
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
              ? 'grid-cols-1 sm:grid-cols-2'
              : cols === 3
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

          return (
            <section key={sec.id} id="gallery" className="py-24 px-6 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Portfolio
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Salon Portfolio & Bridal Transformations'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    {content.subheading ||
                      'Real client results from our Himmatnagar and Ahmedabad studios.'}
                  </p>
                </div>

                <div className={`grid ${colClass} gap-4`}>
                  {galleryImages.map((img: any, i: number) => {
                    const fallbackImg = DEFAULT_ASSETS.gallery[i % DEFAULT_ASSETS.gallery.length].url;
                    const imgSrc = resolveImageUrl(typeof img === 'string' ? img : img.url, fallbackImg);
                    const caption = typeof img === 'object' ? img.caption : '';

                    return (
                      <div
                        key={i}
                        className={`group relative ${aspectClass} rounded-2xl overflow-hidden shadow-sm bg-slate-200 cursor-pointer`}
                      >
                        <img
                          src={imgSrc}
                          alt={caption || `Gallery ${i + 1}`}
                          onError={(e) => handleImageFallback(e, fallbackImg)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-xs text-white font-medium line-clamp-2">
                              {caption}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // 6. TESTIMONIALS SECTION
        if (sec.section_type === 'TESTIMONIALS') {
          const reviews = content.testimonials || DEFAULT_SECTION_DATA.TESTIMONIALS.testimonials;

          return (
            <section key={sec.id} id="reviews" className="py-24 px-6 bg-[#171225] text-slate-100">
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Guest Reviews
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-white"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Loved by Our Guests'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {content.subheading ||
                      'Read verified reviews from clients who trust Ruhi Beauty Salon.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {reviews.map((t: any, i: number) => {
                    const avatarImg = resolveImageUrl(t.avatar, DEFAULT_ASSETS.avatar);
                    const ratingCount = t.rating || 5;

                    return (
                      <div
                        key={i}
                        className="p-6 bg-[#211A32] rounded-3xl border border-[#332A46] space-y-4 shadow-lg"
                      >
                        <div className="flex gap-1 text-amber-400">
                          {[...Array(ratingCount)].map((_, idx) => (
                            <Star key={idx} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                          "{t.quote}"
                        </p>
                        <div className="flex items-center gap-3 pt-3 border-t border-[#332A46]">
                          <img
                            src={avatarImg}
                            alt={t.client}
                            onError={(e) => handleImageFallback(e, DEFAULT_ASSETS.avatar)}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-sm text-white">{t.client}</p>
                            <p className="text-xs text-emerald-400">{t.role}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // 7. FAQ ACCORDION
        if (sec.section_type === 'FAQ') {
          const faqs = content.faqs || DEFAULT_SECTION_DATA.FAQ.faqs;

          return (
            <section key={sec.id} id="faq" className="py-24 px-6 max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                  Questions & Support
                </span>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]"
                  style={{ fontFamily: headingFont }}
                >
                  {content.heading || 'Frequently Asked Questions'}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  {content.subheading ||
                    'Everything you need to know about booking, visits, and hygiene.'}
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((f: any, idx: number) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                      >
                        <span>{f.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                          {f.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        // 8. CONTACT & STUDIOS SECTION
        if (sec.section_type === 'CONTACT_MAP') {
          const address =
            content.address_downtown ||
            salon.address ||
            'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001';
          const phoneNum = content.phone_downtown || salon.phone || '+91 98250 12345';
          const whatsappNum = content.whatsapp_number || '+91 98250 12345';
          const hours = content.hours || 'Monday – Sunday: 9:00 AM – 8:00 PM';

          return (
            <section key={sec.id} id="contact" className="py-24 px-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Visit Us
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Visit Our Studios'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    {content.subheading ||
                      'Conveniently located in Himmatnagar and Ahmedabad with ample customer parking.'}
                  </p>

                  <div className="space-y-4 pt-2">
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <div
                          key={b.id}
                          className="p-5 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm space-y-2"
                        >
                          <p className="font-bold text-[var(--color-text-primary)] text-base" style={{ fontFamily: headingFont }}>
                            {b.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            {b.address}, {b.city}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            Hours: {b.opening_time.slice(0, 5)} - {b.closing_time.slice(0, 5)}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            {b.phone || salon.phone}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm space-y-2">
                        <p className="font-bold text-[var(--color-text-primary)] text-base">{salon.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          {address}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          Hours: {hours}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500" />
                          {phoneNum}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-3">
                    {content.show_whatsapp_button !== false && (
                      <a
                        href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {content.whatsapp_button_text || 'Chat on WhatsApp'}
                      </a>
                    )}
                    {content.show_booking_button !== false && (
                      <button
                        type="button"
                        onClick={() => openBookingModalWithService()}
                        className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {content.booking_button_text || 'Book Studio Visit'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--color-background)] rounded-3xl h-80 flex items-center justify-center border-4 border-white shadow-xl text-center p-6">
                  <div>
                    <MapPin className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                    <p className="font-serif font-bold text-[var(--color-text-primary)] text-lg">
                      Central Studio Location
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto mt-1">
                      {address}
                    </p>
                    <span className="inline-block text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-3 py-1 rounded-full mt-3">
                      Valet & Dedicated Customer Parking
                    </span>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 9. FOOTER SECTION
        if (sec.section_type === 'FOOTER') {
          const social = content.social_links || {
            instagram: 'https://instagram.com/ruhibeautysalon',
            facebook: 'https://facebook.com/ruhibeautysalon',
            whatsapp: 'https://wa.me/919825012345',
            youtube: 'https://youtube.com/@ruhibeautysalon',
          };

          return (
            <footer key={sec.id} className="py-12 px-6 bg-[#171225] text-slate-300 border-t border-[#332A46] text-xs">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="font-bold text-lg text-white block mb-1" style={{ fontFamily: headingFont }}>
                    {content.salon_name || salon.name}
                  </span>
                  <p className="text-slate-400 text-xs">
                    {content.tagline || salon.tagline || 'Your Beauty, Our Passion'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-2">
                    {content.copyright || `© ${new Date().getFullYear()} ${salon.name}. All rights reserved.`}
                  </p>
                </div>

                {content.show_social_links !== false && (
                  <div className="flex items-center gap-3">
                    {social.instagram && (
                      <a
                        href={social.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-full bg-[#211A32] hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition"
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
                        className="w-9 h-9 rounded-full bg-[#211A32] hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition"
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
                        className="w-9 h-9 rounded-full bg-[#211A32] hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition"
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
                        className="w-9 h-9 rounded-full bg-[#211A32] hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition"
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

      {/* Interactive Self-Booking Modal */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {bookingConfirmed ? (
              <div className="text-center py-8 space-y-3 animate-scale-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: headingFont }}>
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                  Thank you, {clientName}! We have reserved your appointment on {bookingDate} at {selectedSlot}. A confirmation has been registered with {salon.name}.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="btn-primary mt-4 px-6 py-2.5 text-xs font-bold rounded-full shadow"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: headingFont }}>
                    Book Treatment Online
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSelfBook} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-primary)] font-semibold mb-1">
                      Selected Treatment
                    </label>
                    <select
                      value={selectedService?.id || ''}
                      onChange={(e) => {
                        const found = services.find((s) => s.id === e.target.value);
                        if (found) setSelectedService(found);
                      }}
                      className="select-field text-sm font-medium"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (₹{s.effective_price} · {s.duration_minutes}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-1">Branch</label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="select-field text-xs"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-1">Stylist</label>
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="select-field text-xs"
                      >
                        {team.map((stf) => (
                          <option key={stf.id} value={stf.id}>
                            {stf.user_details?.full_name || stf.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] font-semibold mb-1">Available Time Slot</label>
                    {availableSlots.length === 0 ? (
                      <p className="text-xs text-[var(--text-secondary)] italic p-2.5 bg-[var(--surface-secondary)] rounded-xl">
                        No open time slots on this date.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-95 ${
                              selectedSlot === slot
                                ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm'
                                : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#6D28D9]/40'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <label className="block text-[var(--text-primary)] font-semibold">Your Contact Details</label>
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="input-field"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Phone Number (+91 98...) *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="input-field"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingBooking || !selectedSlot}
                      className="btn-primary w-full py-3 text-xs font-bold shadow-md"
                    >
                      {isSubmittingBooking ? 'Confirming...' : 'Confirm Appointment'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
