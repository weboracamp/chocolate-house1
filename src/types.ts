export type Language = 'en' | 'ar';

export interface FeatureItem {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  icon?: string;
}

export type CategoryType =
  | 'Iced coffee'
  | 'Matcha'
  | 'Beverage Bottle'
  | 'Frappe'
  | 'Mojito'
  | 'Milk Check'
  | 'Turkish coffee'
  | 'Nutella'
  | 'Molten Cake'
  | 'Ice Cream'
  | 'Tart Waffles'
  | 'Cheese Cake'
  | 'Ban Cake'
  | 'Waffle Stick'
  | 'Tiramisu'
  | 'Cuisson'
  | 'Donuts'
  | 'Fadge'
  | 'Hot coffee';

export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  discount_price?: number; // If set, this is the active price and `price` is original crossed out
  category: CategoryType;
  stock: number;
  image: string;
  is_best_seller?: boolean;
  is_new?: boolean;
  calories?: number;
  created_at?: string;
  updated_at?: string;
}

export type OrderType = 'on-site' | 'pickup' | 'delivery';

export type PaymentMethod = 'cod' | 'instapay_wallet';

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface SelectedAddon {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  price: number;
  category: 'size' | 'flavor' | 'topping';
}

export interface CashierStaff {
  id: string;
  name: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name_en: string;
  product_name_ar: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image?: string;
  selected_addons?: SelectedAddon[];
  addon_total?: number;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  staff_name?: string;
  table_number?: string;
  delivery_address?: string;
  pickup_time?: string;
  notes?: string;
  payment_method: PaymentMethod;
  transfer_from_phone?: string;
  amount_transferred?: number;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  shift_id?: string;
  is_archived?: boolean;
  stock_restored?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  category: 'supplies' | 'dairy_beverages' | 'packaging' | 'maintenance' | 'petty_cash' | 'other';
  amount: number;
  notes?: string;
  cashier_name: string;
  created_at: string;
  shift_id?: string;
}

export interface ShiftReport {
  id: string;
  shift_number: string;
  cashier_name: string;
  start_time: string;
  end_time: string;
  total_orders_count: number;
  total_sales: number;
  cash_sales: number;
  digital_sales: number;
  expenses_total: number;
  system_expected_cash: number;
  cashier_reported_cash: number;
  discrepancy: number; // positive = over, negative = short, 0 = balanced
  notes?: string;
  created_at: string;
}

export type UserRole = 'owner' | 'cashier';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export type ActiveViewType = 'store' | 'why-us' | 'contact' | 'cashier' | 'owner';

export interface Testimonial {
  id: string;
  author_en: string;
  author_ar: string;
  role_en: string;
  role_ar: string;
  comment_en: string;
  comment_ar: string;
  rating: number;
  date: string;
}

export interface FAQItem {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  category?: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'resolved';
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  status?: 'new' | 'read' | 'resolved';
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active?: boolean;
  created_at: string;
}

export interface SiteConfig {
  name_en: string;
  name_ar: string;
  slogan_en: string;
  slogan_ar: string;
  tagline_en: string;
  tagline_ar: string;
  phone: string;
  whatsapp: string;
  email: string;
  address_en: string;
  address_ar: string;
  googleMapsUrl: string;
  openingHours_en: string;
  openingHours_ar: string;
  deliveryNotice_en: string;
  deliveryNotice_ar: string;
}
