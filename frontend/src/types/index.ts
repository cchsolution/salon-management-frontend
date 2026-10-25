export type UserRole =
  | 'SUPERADMIN'
  | 'SALON_OWNER'
  | 'SALON_MANAGER'
  | 'RECEPTIONIST'
  | 'STYLIST'
  | 'INVENTORY_MANAGER'
  | 'CUSTOMER';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  salon: string | null;
  salon_name?: string;
  branch: string | null;
  branch_name?: string;
  avatar: string | null;
  is_active: boolean;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  tax_rate: string | number;
  logo: string | null;
  is_active: boolean;
  subscription_plan: string;
}

export interface Branch {
  id: string;
  salon: string;
  salon_name?: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  is_primary: boolean;
  is_active: boolean;
  opening_time: string;
  closing_time: string;
}

export interface StaffProfile {
  id: string;
  salon: string;
  salon_name?: string;
  user: string;
  user_details?: User;
  branch: string | null;
  branch_name?: string;
  title: string;
  bio: string;
  commission_rate: string | number;
  is_bookable: boolean;
  color_code: string;
  avatar_url?: string;
  employment_start: string | null;
}

export interface ServiceCategory {
  id: string;
  salon: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  services_count?: number;
}

export interface Service {
  id: string;
  salon: string;
  category: string | null;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  discount_price: string | number | null;
  effective_price: string | number;
  duration_minutes: number;
  buffer_time_minutes: number;
  image: string | null;
  is_active: boolean;
  is_featured: boolean;
  tax_exempt: boolean;
  qualified_staff_details?: StaffProfile[];
}

export interface CustomerActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Customer {
  id: string;
  salon: string;
  user: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  birth_date: string | null;
  address: string;
  city: string;
  notes: string;
  preferences: Record<string, any>;
  tags: string[];
  loyalty_points: number;
  total_spend: string | number;
  visit_count: number;
  last_visit: string | null;
  is_active: boolean;
  recent_activities?: CustomerActivity[];
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AppointmentItem {
  id: string;
  service: string;
  service_name: string;
  price: string | number;
  duration_minutes: number;
}

export interface Appointment {
  id: string;
  salon: string;
  salon_name?: string;
  branch: string;
  branch_details?: Branch;
  customer: string;
  customer_details?: Customer;
  staff: string;
  staff_details?: StaffProfile;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  booking_source: string;
  total_amount: string | number;
  total_duration_minutes: number;
  notes: string;
  cancellation_reason?: string;
  items: AppointmentItem[];
}

export interface InvoiceItem {
  id?: string;
  item_type: 'SERVICE' | 'PRODUCT' | 'PACKAGE';
  service?: string | null;
  item_name: string;
  quantity: number;
  unit_price: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_price: string | number;
  staff?: string | null;
  staff_name?: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'LOYALTY_POINTS' | 'BANK_TRANSFER';

export interface MembershipPlan {
  id: string;
  salon?: string;
  name: string;
  price: string | number;
  duration_days?: number;
  discount_percentage: string | number;
  description?: string;
  benefits?: string[];
  tier?: string;
  billing_cycle?: string;
  free_services_count?: number;
  is_active: boolean;
}

export interface Coupon {
  id: string;
  salon?: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string | number;
  min_order_amount?: string | number;
  min_spend?: string | number;
  max_discount_amount?: string | number;
  valid_from?: string;
  valid_to?: string;
  usage_limit?: number;
  used_count?: number;
  times_used?: number;
  description?: string;
  is_active: boolean;
}

export interface Payment {
  id: string;
  invoice: string;
  amount: string | number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  salon: string;
  branch: string;
  branch_name?: string;
  customer: string | null;
  customer_details?: Customer;
  appointment?: string | null;
  invoice_number: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  balance_due: string | number;
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'CANCELLED';
  notes: string;
  items: InvoiceItem[];
  payments: Payment[];
  created_at: string;
}

export interface Product {
  id: string;
  salon: string;
  category: string | null;
  category_name?: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  unit: string;
  purchase_price: string | number;
  selling_price: string | number;
  is_retail: boolean;
  low_stock_threshold: number;
  total_stock: number;
  is_active: boolean;
  stock_levels?: {
    id: string;
    branch: string;
    branch_name: string;
    quantity_on_hand: number;
    reorder_level: number;
    is_low_stock: boolean;
  }[];
}

export interface WebsiteTheme {
  id?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  header_style: string;
  button_border_radius: string;
}

export interface WebsiteSection {
  id: string;
  section_type: string;
  order: number;
  is_enabled: boolean;
  content: Record<string, any>;
  published_content?: Record<string, any>;
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  is_home: boolean;
  is_active: boolean;
  sections: WebsiteSection[];
}

export interface Website {
  id: string;
  salon: string;
  salon_name?: string;
  salon_slug?: string;
  title: string;
  meta_description: string;
  custom_domain?: string | null;
  is_published: boolean;
  published_at?: string | null;
  theme: WebsiteTheme;
  pages: WebsitePage[];
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'BOOKING' | 'LOW_STOCK' | 'PAYMENT' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  summary: {
    today_revenue: number;
    today_appointments: number;
    completed_today: number;
    pending_today: number;
    cancelled_today: number;
    total_revenue: number;
    avg_bill_value: number;
    pending_payments: number;
    total_clients: number;
    new_clients_this_month: number;
    low_stock_count: number;
  };
  revenue_chart: {
    date: string;
    iso_date: string;
    revenue: number;
    appointments: number;
  }[];
  popular_services: {
    name: string;
    bookings: number;
    revenue: number;
  }[];
  staff_performance: {
    id: string;
    name: string;
    title: string;
    branch: string;
    appointments_count: number;
    revenue_generated: number;
    commission_earned: number;
    commission_rate: number;
  }[];
  branch_comparison: {
    id: string;
    name: string;
    city: string;
    revenue: number;
    appointments: number;
  }[];
  recent_transactions: {
    id: string;
    invoice_number: string;
    customer_name: string;
    amount: number;
    status: string;
    date: string;
  }[];
  upcoming_appointments: {
    id: string;
    customer_name: string;
    staff_name: string;
    date: string;
    time: string;
    status: string;
    amount: number;
  }[];
}
