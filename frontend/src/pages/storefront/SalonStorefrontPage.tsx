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
import { api, clearApiCache } from '../../services/api';
import { Service, ServiceCategory, StaffProfile, Branch, Salon, WebsiteTheme } from '../../types';
import {
  DEFAULT_ASSETS,
  DEFAULT_SECTION_DATA,
  DEFAULT_STOREFRONT_SECTIONS,
  DEFAULT_SERVICES,
  DEFAULT_STAFF,
  DEFAULT_BRANCHES,
  resolveImageUrl,
  handleImageFallback,
} from '../../constants/defaultWebsiteData';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatINR } from '../../utils/currency';
import { FormField } from '../../components/ui/FormField';
import { Validation, extractBackendErrors } from '../../utils/validation';

// Helper to pre-hydrate storefront data from local preview cache, auth state, or canonical defaults
const getInitialStorefrontData = (slug?: string) => {
  let cachedPayload: any = null;
  if (slug && typeof window !== 'undefined') {
    try {
      const rawPreview = localStorage.getItem(`luxe_storefront_preview_${slug}`);
      if (rawPreview) {
        cachedPayload = JSON.parse(rawPreview);
      }
    } catch {}

    if (!cachedPayload) {
      try {
        const rawSalon = localStorage.getItem('luxe_salon');
        if (rawSalon) {
          const parsedSalon = JSON.parse(rawSalon);
          if (parsedSalon?.slug === slug) {
            cachedPayload = { salon: parsedSalon };
          }
        }
      } catch {}
    }
  }

  const defaultSalon: Salon = {
    id: cachedPayload?.salon?.id || '41706c8a-6d1d-45df-86e9-b3ee7cae3584',
    name: cachedPayload?.salon?.name || 'Ruhi Beauty Salon',
    slug: slug || 'ruhi-beauty-salon',
    tagline: cachedPayload?.salon?.tagline || 'Your Beauty, Our Passion',
    email: cachedPayload?.salon?.email || 'hello@ruhibeauty.local',
    phone: cachedPayload?.salon?.phone || '+91 98250 12345',
    address: cachedPayload?.salon?.address || 'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    tax_rate: '18.00',
    logo: cachedPayload?.salon?.logo || null,
    is_active: true,
    subscription_plan: 'PRO',
  };

  const defaultTheme: WebsiteTheme = cachedPayload?.theme || {
    id: 'theme-default',
    primary_color: '#6D28D9',
    secondary_color: '#059669',
    accent_color: '#10B981',
    background_color: '#F8FAFC',
    text_color: '#1E1B2E',
    font_heading: 'Playfair Display',
    font_body: 'Inter',
    header_style: 'sticky',
    button_border_radius: 'rounded-xl',
  };

  const initialSections = (cachedPayload?.sections && Array.isArray(cachedPayload.sections) && cachedPayload.sections.length > 0)
    ? cachedPayload.sections
    : DEFAULT_STOREFRONT_SECTIONS;

  const initialServices = (cachedPayload?.services && Array.isArray(cachedPayload.services) && cachedPayload.services.length > 0)
    ? cachedPayload.services
    : (DEFAULT_SERVICES as unknown as Service[]);

  const initialTeam = (cachedPayload?.team && Array.isArray(cachedPayload.team) && cachedPayload.team.length > 0)
    ? cachedPayload.team
    : (DEFAULT_STAFF as unknown as StaffProfile[]);

  const initialBranches = (cachedPayload?.branches && Array.isArray(cachedPayload.branches) && cachedPayload.branches.length > 0)
    ? cachedPayload.branches
    : (DEFAULT_BRANCHES as unknown as Branch[]);

  return {
    salon: defaultSalon,
    theme: defaultTheme,
    sections: initialSections,
    services: initialServices,
    team: initialTeam,
    branches: initialBranches,
  };
};

const SalonStorefrontContent: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();

  // Instant hydration: initialize with cached or canonical data so the page renders in 0ms without blank screen
  const [initialData] = useState(() => getInitialStorefrontData(salonSlug));
  const [salon, setSalon] = useState<Salon>(initialData.salon);
  const [theme, setTheme] = useState<WebsiteTheme>(initialData.theme);
  const [sections, setSections] = useState<any[]>(initialData.sections);
  const [services, setServices] = useState<Service[]>(initialData.services);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [team, setTeam] = useState<StaffProfile[]>(initialData.team);
  const [branches, setBranches] = useState<Branch[]>(initialData.branches);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery & FAQ interactive state
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('ALL');

  // Self-Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(() => initialData.services[0] || null);
  const [selectedStaff, setSelectedStaff] = useState<string>(() => initialData.team[0]?.id || '');
  const [selectedBranch, setSelectedBranch] = useState<string>(() => initialData.branches[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [bookingErrors, setBookingErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    date?: string;
    slot?: string;
  }>({});
  const [bookingTouched, setBookingTouched] = useState<{
    name?: boolean;
    phone?: boolean;
    email?: boolean;
    date?: boolean;
    slot?: boolean;
  }>({});
  const [bookingSubmitError, setBookingSubmitError] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    fetchStorefront();
  }, [salonSlug]);

  const fetchStorefront = async () => {
    try {
      const data = await api.get<any>(`/builder/public/${salonSlug}/`, { timeoutMs: 12000 });
      if (data?.salon) {
        setSalon(data.salon);
      }
      if (data?.website?.theme) {
        setTheme(data.website.theme);
      }
      if (data?.website?.pages && Array.isArray(data.website.pages) && data.website.pages.length > 0) {
        const rawSecs = data.website.pages[0].sections || [];
        if (rawSecs.length > 0) {
          // Merge each section with default canonical template so no field is ever undefined
          const merged = rawSecs.map((sec: any) => {
            const defContent = DEFAULT_SECTION_DATA[sec.section_type as keyof typeof DEFAULT_SECTION_DATA] || {};
            return {
              ...sec,
              content: {
                ...defContent,
                ...(sec.content || {}),
              },
            };
          });
          setSections(merged);
        }
      }
      if (Array.isArray(data?.catalog?.services) && data.catalog.services.length > 0) {
        setServices(data.catalog.services);
        setSelectedService((prev) => prev || data.catalog.services[0]);
      }
      if (Array.isArray(data?.catalog?.categories) && data.catalog.categories.length > 0) {
        setCategories(data.catalog.categories);
      }
      if (Array.isArray(data?.team) && data.team.length > 0) {
        setTeam(data.team);
        setSelectedStaff((prev) => prev || data.team[0].id);
      }
      if (Array.isArray(data?.branches) && data.branches.length > 0) {
        setBranches(data.branches);
        setSelectedBranch((prev) => prev || data.branches[0].id);
      }
    } catch {
      // Background sync timed out or offline; keep gracefully showing local/cached data!
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
          `/appointments/bookings/available_slots/?salon_slug=${salonSlug}&date=${bookingDate}&staff_id=${selectedStaff}&branch_id=${selectedBranch}&duration=${selectedService.duration_minutes || 60}`
        );
        const slots = Array.isArray(res?.slots) ? res.slots : [];
        setAvailableSlots(slots);
        if (slots.length > 0) {
          setSelectedSlot(slots[0]);
        } else {
          setSelectedSlot('');
        }
      } catch {
        setAvailableSlots(['10:00', '11:30', '14:00', '16:00', '17:30']);
        setSelectedSlot('10:00');
      }
    };

    fetchSlots();
  }, [isBookModalOpen, selectedStaff, bookingDate, selectedService, selectedBranch]);

  const handleSelfBook = async (e: React.FormEvent) => {
    e.preventDefault();

    setBookingTouched({ name: true, phone: true, email: true, date: true, slot: true });
    setBookingSubmitError(null);

    const nameErr = Validation.name('Your full name', 2, 80, true)(clientName);
    const phoneErr = Validation.phone(true, 'IN')(clientPhone);
    const emailErr = Validation.email(false)(clientEmail);
    const dateErr = Validation.date('Booking date', true, { notPast: true })(bookingDate);
    const slotErr = !selectedSlot ? 'Please select an appointment time slot.' : null;

    const errs: typeof bookingErrors = {};
    if (nameErr) errs.name = nameErr;
    if (phoneErr) errs.phone = phoneErr;
    if (emailErr) errs.email = emailErr;
    if (dateErr) errs.date = dateErr;
    if (slotErr) errs.slot = slotErr;

    setBookingErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!selectedService) {
      setBookingSubmitError('Please select a treatment service.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const createdAppt = await api.post('/appointments/bookings/', {
        salon_id: salon?.id,
        branch_id: selectedBranch,
        staff_id: selectedStaff,
        service_ids: [selectedService.id],
        date: bookingDate,
        start_time: selectedSlot,
        customer_first_name: clientName.trim(),
        customer_phone: clientPhone.trim(),
        customer_email: clientEmail.trim() || undefined,
        notes: clientNotes.trim(),
        booking_source: 'ONLINE',
      });
      clearApiCache('/appointments/');
      clearApiCache('/analytics/metrics/');
      window.dispatchEvent(new CustomEvent('appointment:created', { detail: createdAppt }));
      setBookingConfirmed(true);
    } catch (err: any) {
      const { fieldErrors, generalError } = extractBackendErrors(err);
      if (fieldErrors.phone || fieldErrors.first_name || fieldErrors.email || fieldErrors.date) {
        setBookingErrors((prev) => ({
          ...prev,
          phone: fieldErrors.phone,
          name: fieldErrors.first_name,
          email: fieldErrors.email,
          date: fieldErrors.date,
        }));
      }
      setBookingSubmitError(generalError || 'Failed to complete booking. Please choose another slot.');
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

  // Theme tokens
  const primaryColor = theme?.primary_color || '#6D28D9';
  const secondaryColor = theme?.secondary_color || '#059669';
  const accentColor = theme?.accent_color || '#10B981';
  const headingFont = theme?.font_heading || 'Playfair Display';
  const bodyFont = theme?.font_body || 'Inter';

  // Categories list for services
  const serviceCategories: string[] = Array.from(
    new Set((services || []).map((s) => s.category_name).filter((c): c is string => Boolean(c)))
  );
  const filteredServices = selectedServiceCategory === 'ALL'
    ? (services || [])
    : (services || []).filter((s) => s.category_name === selectedServiceCategory);

  // Fallback to default storefront sections if sections is empty
  const activeSections = (sections && sections.length > 0)
    ? sections.filter((s) => s.is_enabled !== false)
    : DEFAULT_STOREFRONT_SECTIONS;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#0B0D17] font-sans selection:bg-purple-500/20" style={{ fontFamily: bodyFont }}>
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#CACED6] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white font-bold text-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {salon?.name ? salon.name[0] : 'R'}
            </div>
            <div>
              <span className="font-bold text-base md:text-lg tracking-wide block" style={{ color: primaryColor, fontFamily: headingFont }}>
                {salon?.name || 'Ruhi Beauty Salon'}
              </span>
              <span className="text-[10px] text-[#A9B6C0] uppercase tracking-widest hidden sm:block">
                {salon?.tagline || 'Your Beauty, Our Passion'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#29315D]">
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
              className="text-xs font-medium text-[#29315D] hover:text-purple-600 border border-[#CACED6] px-3 py-2 rounded-full hidden sm:block transition"
            >
              Owner Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Render Dynamic Published Sections (in exact salon owner order) */}
      {activeSections.map((sec) => {
        const defaultTemplate = DEFAULT_SECTION_DATA[sec.section_type as keyof typeof DEFAULT_SECTION_DATA] || {};
        const content = {
          ...defaultTemplate,
          ...(sec.content || {}),
        };

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
              key={sec.id || 'hero'}
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
          const stats = Array.isArray(content.stats) && content.stats.length > 0 ? content.stats : DEFAULT_SECTION_DATA.ABOUT_US.stats;
          const features = Array.isArray(content.feature_points) && content.feature_points.length > 0 ? content.feature_points : DEFAULT_SECTION_DATA.ABOUT_US.feature_points;

          return (
            <section key={sec.id || 'about'} id="about" className="py-24 px-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: secondaryColor }}>
                    {content.subtitle || 'Founded with Passion & Care'}
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[#0B0D17] leading-tight"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.title || 'The Philosophy of Ruhi Beauty Salon'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                    {content.story ||
                      'We believe every woman deserves personalized beauty care in a serene, hygienic, and luxurious environment.'}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
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

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#CACED6]">
                    {stats.map((st: any, i: number) => (
                      <div key={i}>
                        <p className="text-2xl font-bold font-mono" style={{ color: primaryColor }}>
                          {st.value}
                        </p>
                        <p className="text-[11px] text-[#718096] mt-0.5">{st.label}</p>
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

          const maxCount = Number(content.max_services) || 12;
          const displayServices = (filteredServices.length > 0 ? filteredServices : (DEFAULT_SERVICES as unknown as Service[])).slice(0, maxCount);

          return (
            <section
              key={sec.id || 'services'}
              id="services"
              className="py-24 px-6 bg-white border-y border-[#CACED6]"
            >
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Treatment Menu
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[#0B0D17]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Signature Treatments & Services'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5568]">
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
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#CACED6]'
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
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#CACED6]'
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
                      className="p-6 bg-[#F8FAFC] hover:bg-white rounded-2xl border border-[#CACED6] hover:border-purple-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="px-2.5 py-0.5 font-semibold bg-purple-50 text-purple-700 rounded-md text-[10px]">
                            {svc.category_name || 'Treatment'}
                          </span>
                          {content.show_duration !== false && (
                            <span className="flex items-center gap-1 text-[#718096] text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              {svc.duration_minutes || 60}m
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[#0B0D17] mt-1" style={{ fontFamily: headingFont }}>
                          {svc.name}
                        </h3>
                        {content.show_description !== false && (
                          <p className="text-xs text-[#4A5568] mt-2 line-clamp-3">
                            {svc.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#CACED6] flex items-center justify-between">
                        {content.show_prices !== false && (
                          <div>
                            <span className="text-[10px] text-[#718096] block">Price</span>
                            <span className="text-xl font-bold font-sans tabular-nums" style={{ color: secondaryColor }}>
                              {formatINR(svc.effective_price ?? svc.price ?? 0)}
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
          const staffList = (team && team.length > 0 ? team : (DEFAULT_STAFF as unknown as StaffProfile[]));
          const visibleStaff = staffList.filter((stf) => overrides[stf.id]?.hidden !== true);

          return (
            <section key={sec.id || 'team'} id="team" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                  Artisans & Specialists
                </span>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[#0B0D17]"
                  style={{ fontFamily: headingFont }}
                >
                  {content.heading || 'Meet Our Expert Stylists & Artists'}
                </h2>
                <p className="text-xs sm:text-sm text-[#4A5568]">
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
                      className="p-6 bg-white rounded-2xl border border-[#CACED6] shadow-sm text-center flex flex-col items-center hover:shadow-lg transition"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-md mb-4">
                        <img
                          src={memberImg}
                          alt={stf.user_details?.full_name || (stf as any).name || 'Stylist'}
                          onError={(e) => handleImageFallback(e, defaultImg)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-base font-bold text-[#0B0D17]" style={{ fontFamily: headingFont }}>
                        {stf.user_details?.full_name || (stf as any).name || stf.title}
                      </h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: secondaryColor }}>
                        {stf.title}
                      </p>
                      {content.show_bio !== false && memberBio && (
                        <p className="text-xs text-[#4A5568] mt-3 line-clamp-3">
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
                        Book with {stf.user_details?.first_name || (stf as any).name?.split(' ')[0] || 'Stylist'}
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
            Array.isArray(content.images) && content.images.length > 0
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
            <section key={sec.id || 'gallery'} id="gallery" className="py-24 px-6 bg-white border-y border-[#CACED6]">
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Portfolio
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[#0B0D17]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Salon Portfolio & Bridal Transformations'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5568]">
                    {content.subheading ||
                      'Real client results from our Himmatnagar and Ahmedabad studios.'}
                  </p>
                </div>

                <div className={`grid ${colClass} gap-4`}>
                  {galleryImages.map((img: any, i: number) => {
                    const fallbackImg = DEFAULT_ASSETS.gallery[i % DEFAULT_ASSETS.gallery.length]?.url || DEFAULT_ASSETS.hero;
                    const imgSrc = resolveImageUrl(typeof img === 'string' ? img : img?.url, fallbackImg);
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
          const reviews = Array.isArray(content.testimonials) && content.testimonials.length > 0
            ? content.testimonials
            : DEFAULT_SECTION_DATA.TESTIMONIALS.testimonials;

          return (
            <section key={sec.id || 'reviews'} id="reviews" className="py-24 px-6 bg-[#171225] text-slate-100">
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
                    const ratingCount = Math.max(1, Math.min(5, Math.round(Number(t.rating) || 5)));

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
                            alt={t.client || 'Guest'}
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
          const faqs = Array.isArray(content.faqs) && content.faqs.length > 0
            ? content.faqs
            : DEFAULT_SECTION_DATA.FAQ.faqs;

          return (
            <section key={sec.id || 'faq'} id="faq" className="py-24 px-6 max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                  Questions & Support
                </span>
                <h2
                  className="text-3xl md:text-4xl font-bold text-[#0B0D17]"
                  style={{ fontFamily: headingFont }}
                >
                  {content.heading || 'Frequently Asked Questions'}
                </h2>
                <p className="text-xs sm:text-sm text-[#4A5568]">
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
                      className="border border-[#CACED6] rounded-2xl overflow-hidden bg-white shadow-sm"
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
            salon?.address ||
            'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001';
          const phoneNum = content.phone_downtown || salon?.phone || '+91 98250 12345';
          const hours = content.hours || 'Monday – Sunday: 9:00 AM – 8:00 PM';
          const branchList = branches && branches.length > 0 ? branches : (DEFAULT_BRANCHES as unknown as Branch[]);

          return (
            <section key={sec.id || 'contact'} id="contact" className="py-24 px-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                    Visit Us
                  </span>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-[#0B0D17]"
                    style={{ fontFamily: headingFont }}
                  >
                    {content.heading || 'Visit Our Studios'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5568]">
                    {content.subheading ||
                      'Conveniently located in Himmatnagar and Ahmedabad with ample customer parking.'}
                  </p>

                  <div className="space-y-4 pt-2">
                    {branchList.length > 0 ? (
                      branchList.map((b) => (
                        <div
                          key={b.id}
                          className="p-5 bg-white rounded-2xl border border-[#CACED6] shadow-sm space-y-2"
                        >
                          <p className="font-bold text-[#0B0D17] text-base" style={{ fontFamily: headingFont }}>
                            {b.name}
                          </p>
                          <p className="text-xs text-[#4A5568] flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            {b.address}, {b.city}
                          </p>
                          <p className="text-xs text-[#4A5568] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                            Hours: {b.opening_time ? String(b.opening_time).slice(0, 5) : '09:00'} – {b.closing_time ? String(b.closing_time).slice(0, 5) : '20:00'}
                          </p>
                          <p className="text-xs text-[#4A5568] flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                            {b.phone || salon?.phone || phoneNum}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 bg-white rounded-2xl border border-[#CACED6] shadow-sm space-y-2">
                        <p className="font-bold text-[#0B0D17] text-base">{salon?.name || 'Ruhi Beauty Salon'}</p>
                        <p className="text-xs text-[#4A5568] flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          {address}
                        </p>
                        <p className="text-xs text-[#4A5568] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                          Hours: {hours}
                        </p>
                        <p className="text-xs text-[#4A5568] flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                          {phoneNum}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white h-80 lg:h-[400px] bg-slate-100 flex items-center justify-center relative">
                  <iframe
                    title="Salon Studio Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117079.80556276229!2d72.90906236688179!3d23.597968989502015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395db8c9df17bcff%3A0xc3191d4e7f3dc5f5!2sHimmatnagar%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </section>
          );
        }

        // 9. FOOTER SECTION
        if (sec.section_type === 'FOOTER') {
          const social = content.social_links || DEFAULT_SECTION_DATA.FOOTER.social_links;

          return (
            <footer key={sec.id || 'footer'} className="py-12 px-6 bg-[#171225] text-slate-300 border-t border-[#332A46] text-xs">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="font-bold text-lg text-white block mb-1" style={{ fontFamily: headingFont }}>
                    {content.salon_name || salon?.name || 'Ruhi Beauty Salon'}
                  </span>
                  <p className="text-slate-400 text-xs">
                    {content.tagline || salon?.tagline || 'Your Beauty, Our Passion'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-2">
                    {content.copyright || `© ${new Date().getFullYear()} ${salon?.name || 'Ruhi Beauty Salon'}. All rights reserved.`}
                  </p>
                </div>

                {content.show_social_links !== false && (
                  <div className="flex items-center gap-3">
                    {social?.instagram && (
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
                    {social?.facebook && (
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
                    {social?.whatsapp && (
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
                    {social?.youtube && (
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
                <h3 className="text-xl font-bold text-[#0B0D17]" style={{ fontFamily: headingFont }}>
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-[#4A5568] max-w-sm mx-auto leading-relaxed">
                  Thank you, {clientName}! We have reserved your appointment on {bookingDate} at {selectedSlot}. A confirmation has been registered with {salon?.name || 'Ruhi Beauty Salon'}.
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
                <div className="flex items-center justify-between pb-3 border-b border-[#CACED6]">
                  <h3 className="text-base font-bold text-[#0B0D17]" style={{ fontFamily: headingFont }}>
                    Book Treatment Online
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="text-[#718096] hover:text-[#0B0D17] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {bookingSubmitError && (
                  <div className="flex items-center gap-1.5 p-2.5 text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingSubmitError}</span>
                  </div>
                )}

                <form onSubmit={handleSelfBook} className="space-y-4 text-xs" noValidate>
                  <div>
                    <label className="block text-[#0B0D17] font-semibold mb-1">
                      Selected Treatment *
                    </label>
                    <CustomSelect
                      value={selectedService?.id || ''}
                      onChange={(val) => {
                        const found = services.find((s) => s.id === val);
                        if (found) setSelectedService(found);
                      }}
                      options={(services || []).map((s) => ({
                        value: s.id,
                        label: s.name,
                        sublabel: `${formatINR(s.effective_price ?? s.price ?? 0)} · ${s.duration_minutes || 60} mins`,
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#0B0D17] font-semibold mb-1">Branch</label>
                      <CustomSelect
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                        options={(branches || []).map((b) => ({
                          value: b.id,
                          label: b.name,
                        }))}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[#0B0D17] font-semibold mb-1">Stylist</label>
                      <CustomSelect
                        value={selectedStaff}
                        onChange={setSelectedStaff}
                        options={(team || []).map((stf) => ({
                          value: stf.id,
                          label: stf.user_details?.full_name || (stf as any).name || stf.title,
                        }))}
                        size="sm"
                      />
                    </div>
                  </div>

                  <FormField
                    label="Appointment Date"
                    required
                    error={bookingErrors.date}
                    touched={bookingTouched.date}
                  >
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        if (bookingTouched.date) {
                          setBookingErrors((prev) => ({
                            ...prev,
                            date: Validation.date('Appointment date', true, { notPast: true })(e.target.value) || undefined,
                          }));
                        }
                      }}
                      onBlur={() => {
                        setBookingTouched((prev) => ({ ...prev, date: true }));
                        setBookingErrors((prev) => ({
                          ...prev,
                          date: Validation.date('Appointment date', true, { notPast: true })(bookingDate) || undefined,
                        }));
                      }}
                      className={`input-field ${bookingTouched.date && bookingErrors.date ? 'input-error' : ''}`}
                    />
                  </FormField>

                  <FormField
                    label="Available Time Slot"
                    required
                    error={bookingErrors.slot}
                    touched={bookingTouched.slot}
                  >
                    {availableSlots.length === 0 ? (
                      <p className="text-xs text-[#718096] italic p-2.5 bg-[#F0F2F5] rounded-xl">
                        No open time slots on this date.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setBookingErrors((prev) => ({ ...prev, slot: undefined }));
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-95 ${
                              selectedSlot === slot
                                ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm'
                                : 'bg-white text-[#0B0D17] border-[#CACED6] hover:border-[#6D28D9]/40'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </FormField>

                  <div className="space-y-3 pt-2 border-t border-[#CACED6]">
                    <span className="block text-xs font-bold text-[#0B0D17] uppercase tracking-wider">
                      Client Contact Details
                    </span>

                    <FormField
                      label="Your Full Name"
                      required
                      error={bookingErrors.name}
                      touched={bookingTouched.name}
                    >
                      <input
                        type="text"
                        placeholder="e.g. Ayesha Patel"
                        value={clientName}
                        onChange={(e) => {
                          setClientName(e.target.value);
                          if (bookingTouched.name) {
                            setBookingErrors((prev) => ({
                              ...prev,
                              name: Validation.name('Your full name', 2, 80, true)(e.target.value) || undefined,
                            }));
                          }
                        }}
                        onBlur={() => {
                          setBookingTouched((prev) => ({ ...prev, name: true }));
                          setBookingErrors((prev) => ({
                            ...prev,
                            name: Validation.name('Your full name', 2, 80, true)(clientName) || undefined,
                          }));
                        }}
                        className={`input-field ${bookingTouched.name && bookingErrors.name ? 'input-error' : ''}`}
                      />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        label="Mobile Number"
                        required
                        error={bookingErrors.phone}
                        touched={bookingTouched.phone}
                      >
                        <input
                          type="tel"
                          placeholder="e.g. 98250 12345"
                          value={clientPhone}
                          onChange={(e) => {
                            setClientPhone(e.target.value);
                            if (bookingTouched.phone) {
                              setBookingErrors((prev) => ({
                                ...prev,
                                phone: Validation.phone(true, 'IN')(e.target.value) || undefined,
                              }));
                            }
                          }}
                          onBlur={() => {
                            setBookingTouched((prev) => ({ ...prev, phone: true }));
                            setBookingErrors((prev) => ({
                              ...prev,
                              phone: Validation.phone(true, 'IN')(clientPhone) || undefined,
                            }));
                          }}
                          className={`input-field ${bookingTouched.phone && bookingErrors.phone ? 'input-error' : ''}`}
                        />
                      </FormField>

                      <FormField
                        label="Email Address"
                        error={bookingErrors.email}
                        touched={bookingTouched.email}
                        helperText="Optional for confirmations"
                      >
                        <input
                          type="email"
                          placeholder="client@example.com"
                          value={clientEmail}
                          onChange={(e) => {
                            setClientEmail(e.target.value);
                            if (bookingTouched.email) {
                              setBookingErrors((prev) => ({
                                ...prev,
                                email: Validation.email(false)(e.target.value) || undefined,
                              }));
                            }
                          }}
                          onBlur={() => {
                            setBookingTouched((prev) => ({ ...prev, email: true }));
                            setBookingErrors((prev) => ({
                              ...prev,
                              email: Validation.email(false)(clientEmail) || undefined,
                            }));
                          }}
                          className={`input-field ${bookingTouched.email && bookingErrors.email ? 'input-error' : ''}`}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="btn-primary w-full py-3 text-xs font-bold shadow-md"
                    >
                      {isSubmittingBooking ? 'Confirming Appointment...' : 'Confirm Appointment'}
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

// Error Boundary wrapper to ensure the page NEVER crashes into a blank white screen
class StorefrontErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Storefront rendering handled by error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#CACED6]">
            <h2 className="text-xl font-bold text-[#0B0D17]">Welcome to Our Salon</h2>
            <p className="text-xs text-[#718096] mt-2">
              The live storefront is refreshing with the latest salon updates. Click below to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-4 px-6 py-2.5 text-xs font-bold rounded-xl shadow transition"
            >
              Load Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SalonStorefrontPage: React.FC = () => {
  return (
    <StorefrontErrorBoundary>
      <SalonStorefrontContent />
    </StorefrontErrorBoundary>
  );
};
