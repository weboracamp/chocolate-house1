export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- CHOCOLATE HOUSE - شوكلت هاوس
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Roles Enum & Category Type
CREATE TYPE user_role AS ENUM ('owner', 'cashier');
CREATE TYPE order_type_enum AS ENUM ('on-site', 'pickup', 'delivery');
CREATE TYPE payment_method_enum AS ENUM ('cod', 'instapay_wallet');
CREATE TYPE order_status_enum AS ENUM ('pending', 'preparing', 'completed', 'cancelled');
CREATE TYPE expense_category_enum AS ENUM ('supplies', 'dairy_beverages', 'packaging', 'maintenance', 'petty_cash', 'other');

-- 2. Profiles Table (Links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10, 2) CHECK (discount_price >= 0),
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image TEXT NOT NULL,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Shift Reports Table (Cash Drawer Reconciliation)
CREATE TABLE IF NOT EXISTS public.shift_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_number TEXT NOT NULL,
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_orders_count INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  digital_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expenses_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  system_expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cashier_reported_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discrepancy NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  order_type order_type_enum NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  table_number TEXT,
  delivery_address TEXT,
  pickup_time TEXT,
  notes TEXT,
  payment_method payment_method_enum NOT NULL,
  transfer_from_phone TEXT,
  amount_transferred NUMERIC(10, 2),
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'pending',
  shift_id UUID REFERENCES public.shift_reports(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_en TEXT NOT NULL,
  product_name_ar TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  image TEXT
);

-- 7. Expenses Table (Cashier Out-of-Pocket / Store Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category expense_category_enum NOT NULL DEFAULT 'supplies',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  cashier_name TEXT NOT NULL,
  shift_id UUID REFERENCES public.shift_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Contact Messages / Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- AUTOMATIC STOCK DECREMENT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_order_stock_decrement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - NEW.quantity),
      updated_at = timezone('utc'::text, now())
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_stock_decrement();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Products: Anyone can read, only Owner can update/insert/delete
CREATE POLICY "Public products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL USING (public.current_user_role() = 'owner');

-- 2. Orders: Customers can insert orders, Cashiers can read today's, Owners read all
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Cashiers and Owners can read active orders" ON public.orders
  FOR SELECT USING (
    public.current_user_role() = 'owner' OR
    (public.current_user_role() = 'cashier' AND is_archived = false)
  );

CREATE POLICY "Staff can update order status" ON public.orders
  FOR UPDATE USING (
    public.current_user_role() IN ('owner', 'cashier')
  );

-- 3. Order Items: Insertable on checkout, viewable by staff
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT USING (
    public.current_user_role() IN ('owner', 'cashier')
  );

-- 4. Expenses: Cashiers & Owners can insert, only Owner has full analytics
CREATE POLICY "Staff can view expenses" ON public.expenses
  FOR SELECT USING (public.current_user_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff can insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'cashier'));

-- 5. Shift Reports: Cashier can insert shift reports, Owner can read all
CREATE POLICY "Cashiers can submit shift reports" ON public.shift_reports
  FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff can view shift reports" ON public.shift_reports
  FOR SELECT USING (public.current_user_role() IN ('owner', 'cashier'));

-- 6. Contact Messages: Public can submit inquiries, Staff/Owner can view and delete
CREATE POLICY "Public can submit contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view and manage contact messages" ON public.contact_messages
  FOR ALL USING (public.current_user_role() IN ('owner', 'cashier'));

-- 7. Newsletter Subscribers: Public can subscribe, Staff/Owner can view and manage
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view and manage newsletter subscribers" ON public.newsletter_subscribers
  FOR ALL USING (public.current_user_role() IN ('owner', 'cashier'));
`;
