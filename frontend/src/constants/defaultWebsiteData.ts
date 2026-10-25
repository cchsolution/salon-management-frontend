// Canonical default configurations and assets for Salon SaaS Website Builder
// Tailored for the Indian salon market with Purple + Green branding and verified INR pricing

export const DEFAULT_ASSETS = {
  hero: '/assets/defaults/hero-default.jpg',
  about: '/assets/defaults/about-default.jpg',
  service: '/assets/defaults/service-default.jpg',
  team: [
    '/assets/defaults/team-default-1.jpg',
    '/assets/defaults/team-default-2.jpg',
    '/assets/defaults/team-default-3.jpg',
  ],
  gallery: [
    {
      id: 'g1',
      url: '/assets/defaults/gallery-1.jpg',
      category: 'Bridal & Makeup',
      caption: 'Signature Royal Gujarati Bridal Transformation with traditional jewellery',
    },
    {
      id: 'g2',
      url: '/assets/defaults/gallery-2.jpg',
      category: 'Hair Styling',
      caption: 'Balayage & Brazilian Keratin Smoothing Treatment',
    },
    {
      id: 'g3',
      url: '/assets/defaults/gallery-3.jpg',
      category: 'Skin & Facial',
      caption: 'Gold Radiance Facial & Deep Hydration Treatment',
    },
    {
      id: 'g4',
      url: '/assets/defaults/gallery-4.jpg',
      category: 'Mehendi & Art',
      caption: 'Intricate Bridal Organic Henna Design',
    },
    {
      id: 'g5',
      url: '/assets/defaults/gallery-5.jpg',
      category: 'Nails & Care',
      caption: 'Custom Acrylic Extensions & Chrome Gel Polish',
    },
    {
      id: 'g6',
      url: '/assets/defaults/gallery-6.jpg',
      category: 'Studio Ambience',
      caption: 'Private VIP Bridal Suite at our Himmatnagar Studio',
    },
  ],
  avatar: '/assets/defaults/avatar-default.jpg',
};

// Image fallback resolver
export function resolveImageUrl(customUrl?: string | null, fallbackUrl: string = DEFAULT_ASSETS.hero): string {
  if (!customUrl || customUrl.trim() === '') {
    return fallbackUrl;
  }
  return customUrl;
}

// Global Image Error Handler - silently and reliably swaps broken URLs with default image
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_ASSETS.hero
) {
  const target = event.currentTarget;
  if (target.src !== fallbackUrl && !target.src.endsWith(fallbackUrl)) {
    target.src = fallbackUrl;
  }
}

// Brand color presets
export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const THEME_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'default-purple-green',
    name: 'Ruhi Signature (Purple & Emerald)',
    description: 'Official deep luxury purple with rich emerald green accents',
    primary: '#6D28D9',
    secondary: '#059669',
    accent: '#10B981',
    background: '#F8FAFC',
    text: '#1E1B2E',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst & Gold',
    description: 'High-end bridal glamour with royal purple and gold shimmer',
    primary: '#581C87',
    secondary: '#D97706',
    accent: '#F59E0B',
    background: '#FAFAF9',
    text: '#1C1917',
  },
  {
    id: 'soft-lavender',
    name: 'Soft Lavender & Mint',
    description: 'Calming, gentle pastel aesthetic for wellness spas and skincare',
    primary: '#7C3AED',
    secondary: '#0D9488',
    accent: '#2DD4BF',
    background: '#F5F3FF',
    text: '#2E1065',
  },
  {
    id: 'modern-emerald',
    name: 'Modern Ayurvedic Emerald',
    description: 'Fresh organic greens celebrating pure botanical and herbal care',
    primary: '#047857',
    secondary: '#7C3AED',
    accent: '#34D399',
    background: '#F0FDF4',
    text: '#064E3B',
  },
  {
    id: 'minimal-luxe',
    name: 'Minimalist Charcoal & Violet',
    description: 'Sleek metropolitan aesthetic with high contrast and clean lines',
    primary: '#4C1D95',
    secondary: '#374151',
    accent: '#8B5CF6',
    background: '#FFFFFF',
    text: '#111827',
  },
  {
    id: 'premium-rose',
    name: 'Rose Quartz & Plum',
    description: 'Delicate feminine hues popular for luxury nail bars and bridal makeup',
    primary: '#831843',
    secondary: '#BE185D',
    accent: '#F472B6',
    background: '#FFF1F2',
    text: '#500724',
  },
];

export const TYPOGRAPHY_OPTIONS = {
  headings: [
    { label: 'Playfair Display (Editorial Serif)', value: 'Playfair Display' },
    { label: 'Cormorant Garamond (Royal Classical)', value: 'Cormorant Garamond' },
    { label: 'Cinzel (Luxury Classical)', value: 'Cinzel' },
    { label: 'Inter (Clean Modern Sans)', value: 'Inter' },
    { label: 'Outfit (Fashion-Forward Sans)', value: 'Outfit' },
    { label: 'Plus Jakarta Sans (Crisp Contemporary)', value: 'Plus Jakarta Sans' },
    { label: 'Poppins (Geometric Friendly)', value: 'Poppins' },
  ],
  bodies: [
    { label: 'Inter (Optimal Readability)', value: 'Inter' },
    { label: 'Outfit (Modern Clean)', value: 'Outfit' },
    { label: 'Plus Jakarta Sans (Crisp Clean)', value: 'Plus Jakarta Sans' },
    { label: 'Poppins (Soft Modern)', value: 'Poppins' },
  ],
};

// Canonical default content dictionary for all 9 sections
export const DEFAULT_SECTION_DATA: Record<string, any> = {
  HERO: {
    badge_text: 'Top Rated Luxury Salon in Gujarat 2026',
    headline: 'Your Beauty, Our Passion',
    subheadline: 'Where artistry meets luxury hair care, radiant bridal transformations, and rejuvenating spa rituals in Himmatnagar & Ahmedabad.',
    cta_text: 'Book Your Appointment',
    cta_link: '#booking',
    secondary_cta_text: 'Explore Services',
    secondary_cta_link: '#services',
    background_image: '', // empty defaults to DEFAULT_ASSETS.hero
    overlay_enabled: true,
    overlay_color: '#0F091E',
    overlay_opacity: 65,
    text_alignment: 'center', // 'left' | 'center' | 'right'
    hero_height: 'large', // 'medium' | 'large' | 'full'
    primary_button_bg: '#6D28D9',
    primary_button_text: '#FFFFFF',
    primary_button_border: '#7C3AED',
    primary_button_radius: 'rounded-xl',
    secondary_button_bg: 'transparent',
    secondary_button_text: '#FFFFFF',
    secondary_button_border: '#FFFFFF',
    secondary_button_radius: 'rounded-xl',
    heading_color: '#FFFFFF',
    description_color: '#F1F5F9',
    badge_color: '#10B981',
  },

  ABOUT_US: {
    title: 'The Philosophy of Ruhi Beauty Salon',
    subtitle: 'Founded with Passion & Care',
    story: 'We believe every woman deserves personalized beauty care in a serene, hygienic, and luxurious environment. Our collective of certified hair stylists, aesthetic specialists, and bridal artists combine authentic botanical treatments with modern techniques to curate a bespoke experience just for you.',
    main_image: '', // empty defaults to DEFAULT_ASSETS.about
    secondary_image: '',
    experience_number: '12+',
    experience_text: 'Years of Excellence in Hair & Bridal Care',
    stats: [
      { label: 'Delighted Guests', value: '15,000+' },
      { label: 'Expert Specialists', value: '6 Artists' },
      { label: 'Five-Star Reviews', value: '99%' },
    ],
    feature_points: [
      'Certified Master Stylists & International Colorists',
      'Medical-grade sanitization for all scissors, brushes & tools',
      'Exclusive private bridal dressing suite with dedicated lounge',
      '100% genuine dermatological & organic herbal blends',
    ],
    cta_text: 'Discover Our Story & Team',
    cta_link: '#team',
  },

  SERVICES_GRID: {
    heading: 'Signature Treatments & Services',
    subheading: 'Crafted with premium dermatological and hair-nourishing botanicals in Indian Rupees.',
    grid_columns: 3, // 2 | 3 | 4
    max_services: 12,
    show_prices: true,
    show_duration: true,
    show_description: true,
    filter_by_category: true,
    show_booking_button: true,
    booking_button_text: 'Book Service',
    card_style: 'elevated', // 'elevated' | 'bordered' | 'minimal'
  },

  STYLISTS_TEAM: {
    heading: 'Meet Our Expert Stylists & Artists',
    subheading: 'Certified master hair colorists, beauticians, and bridal makeup specialists.',
    show_bio: true,
    show_social_links: true,
  },

  GALLERY: {
    heading: 'Salon Portfolio & Bridal Transformations',
    subheading: 'Real client results from our Himmatnagar and Ahmedabad studios.',
    grid_columns: 4, // 2 | 3 | 4
    aspect_ratio: 'square', // 'square' | 'portrait' | 'landscape'
    images: DEFAULT_ASSETS.gallery,
  },

  TESTIMONIALS: {
    heading: 'Loved by Our Guests',
    subheading: 'Read verified reviews from clients who trust Ruhi Beauty Salon.',
    testimonials: [
      {
        id: 't1',
        client: 'Ayesha Sheikh',
        role: 'Bridal Client, Ahmedabad',
        quote: 'Ruhi and her team did my bridal makeup and hair styling for my wedding. Absolutely magical experience and lasted the entire day through all rituals!',
        rating: 5,
        avatar: '',
      },
      {
        id: 't2',
        client: 'Neha Patel',
        role: 'Entrepreneur, Himmatnagar',
        quote: 'Best hair spa and keratin treatment in Himmatnagar. Incredibly polite staff, clean salon, and reasonable prices.',
        rating: 5,
        avatar: '',
      },
      {
        id: 't3',
        client: 'Zoya Patel',
        role: 'College Student, Himmatnagar',
        quote: 'Always a wonderful experience for facials and waxing. Super hygienic salon and such a calm, peaceful ambience.',
        rating: 5,
        avatar: '',
      },
      {
        id: 't4',
        client: 'Dr. Pooja Sharma',
        role: 'Physician, Himmatnagar',
        quote: 'The level of hygiene here is unmatched. They sanitize every single tool in front of you. Truly a high-end luxury salon for Himmatnagar.',
        rating: 5,
        avatar: '',
      },
    ],
  },

  FAQ: {
    heading: 'Frequently Asked Questions',
    subheading: 'Everything you need to know about booking, visits, and hygiene.',
    faqs: [
      {
        id: 'f1',
        question: 'How far in advance should I book bridal makeup?',
        answer: 'We recommend booking 3 to 4 weeks in advance for bridal and wedding packages, although date consultations are available anytime.',
      },
      {
        id: 'f2',
        question: 'What are your hygiene and sanitization standards?',
        answer: 'We maintain strict medical-grade sterilization for all tools and single-use consumables for threading, waxing, and facials.',
      },
      {
        id: 'f3',
        question: 'Can I select my preferred stylist for an appointment?',
        answer: 'Yes! You can choose your preferred stylist directly during online booking or when calling our desk.',
      },
      {
        id: 'f4',
        question: 'Can I reschedule or cancel my appointment?',
        answer: 'Appointments can be easily rescheduled up to 3 hours prior to the slot either online through your account or via WhatsApp.',
      },
      {
        id: 'f5',
        question: 'Do you accept walk-ins without prior booking?',
        answer: 'Walk-ins are warmly welcomed subject to stylist availability; we recommend booking in advance on weekends.',
      },
    ],
  },

  CONTACT_MAP: {
    heading: 'Visit Our Studios',
    subheading: 'Conveniently located in Himmatnagar and Ahmedabad with ample customer parking.',
    address_downtown: 'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001',
    phone_downtown: '+91 98250 12345',
    whatsapp_number: '+91 98250 12345',
    email: 'care@ruhibeauty.com',
    hours: 'Monday – Sunday: 9:00 AM – 8:00 PM',
    map_embed_url: 'https://maps.google.com',
    show_whatsapp_button: true,
    whatsapp_button_text: 'Chat on WhatsApp',
    show_booking_button: true,
    booking_button_text: 'Book Studio Visit',
  },

  FOOTER: {
    salon_name: 'Ruhi Beauty Salon',
    tagline: 'Luxury Hair Styling, Bridal Transformations & Herbal Facials in Gujarat.',
    address: 'Shop 4-5, Shivalik Complex, Motipura, Himmatnagar, Gujarat 383001',
    phone: '+91 98250 12345',
    email: 'care@ruhibeauty.com',
    copyright: `© ${new Date().getFullYear()} Ruhi Beauty Salon. All rights reserved.`,
    show_social_links: true,
    show_quick_links: true,
    social_links: {
      instagram: 'https://instagram.com/ruhibeautysalon',
      facebook: 'https://facebook.com/ruhibeautysalon',
      whatsapp: 'https://wa.me/919825012345',
      youtube: 'https://youtube.com/@ruhibeautysalon',
    },
  },
};
