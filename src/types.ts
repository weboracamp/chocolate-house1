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
}

export type OrderType = 'on-site' | 'pickup' | 'delivery';

export type PaymentMethod = 'cod' | 'instapay_wallet';

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name_en: string;
  product_name_ar: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
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

export type Language = 'en' | 'ar';
