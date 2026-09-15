-- ==============================================================================
-- CHOCOLATE HOUSE - شوكلت هاوس
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Enums safely
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'cashier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('on-site', 'pickup', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cod', 'instapay_wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('pending', 'preparing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category_enum AS ENUM ('supplies', 'dairy_beverages', 'packaging', 'maintenance', 'petty_cash', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
  id TEXT PRIMARY KEY,
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
  has_sizes BOOLEAN DEFAULT FALSE,
  price_small NUMERIC(10, 2) CHECK (price_small >= 0),
  price_large NUMERIC(10, 2) CHECK (price_large >= 0),
  size_label_type TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure size columns exist if updating existing database
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_small NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_large NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_label_type TEXT DEFAULT 'standard';

-- 4. Shift Reports Table (Cash Drawer Reconciliation)
CREATE TABLE IF NOT EXISTS public.shift_reports (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
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
  shift_id TEXT REFERENCES public.shift_reports(id) ON DELETE SET NULL,
  staff_name TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  stock_restored BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_en TEXT NOT NULL,
  product_name_ar TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  selected_addons JSONB DEFAULT '[]'::jsonb,
  addon_total NUMERIC(10, 2) DEFAULT 0
);

-- 7. Expenses Table (Cashier Out-of-Pocket / Store Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category expense_category_enum NOT NULL DEFAULT 'supplies',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  cashier_name TEXT NOT NULL,
  shift_id TEXT REFERENCES public.shift_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Contact Messages / Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Cashier Staff Members Table (Named Staff Attribution)
CREATE TABLE IF NOT EXISTS public.cashier_staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial cashier staff
INSERT INTO public.cashier_staff (id, name, is_active)
VALUES 
  ('staff-1', 'Ahmed', true),
  ('staff-2', 'Sara', true),
  ('staff-3', 'Omar', true),
  ('staff-4', 'Youssef', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- AUTOMATIC STOCK DECREMENT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_order_stock_decrement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock = GREATEST(0, stock - NEW.quantity),
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_stock_decrement();

-- ==============================================================================
-- AUTOMATIC STOCK RESTORATION / RE-DECREMENT ON ORDER STATUS CHANGE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_order_status_stock_sync()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Case 1: Order status changed to 'cancelled' from an active status
  -- Idempotency check: only restore stock if stock_restored is currently FALSE
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND COALESCE(OLD.stock_restored, FALSE) = FALSE THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      UPDATE public.products
      SET stock = stock + item.quantity,
          updated_at = timezone('utc'::text, now())
      WHERE id = item.product_id;
    END LOOP;

    NEW.stock_restored := TRUE;

  -- Case 2: Order status changed FROM 'cancelled' back to an active status (un-cancelled)
  -- Idempotency check: only re-decrement stock if stock was previously restored
  ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' AND COALESCE(OLD.stock_restored, FALSE) = TRUE THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - item.quantity),
          updated_at = timezone('utc'::text, now())
      WHERE id = item.product_id;
    END LOOP;

    NEW.stock_restored := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_stock_sync ON public.orders;
CREATE TRIGGER on_order_status_stock_sync
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_order_status_stock_sync();

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

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products Policies: Public read, all staff/anon manage
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow product modifications" ON public.products;
CREATE POLICY "Allow product modifications" ON public.products
  FOR ALL USING (true);

-- Orders Policies: Public create and view orders
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and customers can read orders" ON public.orders;
CREATE POLICY "Staff and customers can read orders" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can update order status" ON public.orders;
CREATE POLICY "Staff can update order status" ON public.orders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Staff can delete orders" ON public.orders;
CREATE POLICY "Staff can delete orders" ON public.orders
  FOR DELETE USING (true);

-- Order Items Policies
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;
CREATE POLICY "Staff can view order items" ON public.order_items
  FOR SELECT USING (true);

-- Expenses Policies
DROP POLICY IF EXISTS "Staff can manage expenses" ON public.expenses;
CREATE POLICY "Staff can manage expenses" ON public.expenses
  FOR ALL USING (true);

-- Shift Reports Policies
DROP POLICY IF EXISTS "Staff can manage shift reports" ON public.shift_reports;
CREATE POLICY "Staff can manage shift reports" ON public.shift_reports
  FOR ALL USING (true);

-- Contact Messages Policies
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage contact messages" ON public.contact_messages;
CREATE POLICY "Staff can manage contact messages" ON public.contact_messages
  FOR ALL USING (true);

-- Newsletter Subscribers Policies
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Staff can manage newsletter subscribers" ON public.newsletter_subscribers
  FOR ALL USING (true);

-- Cashier Staff Policies
ALTER TABLE public.cashier_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cashier staff are readable" ON public.cashier_staff;
CREATE POLICY "Cashier staff are readable" ON public.cashier_staff
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cashier staff are manageable" ON public.cashier_staff;
DROP POLICY IF EXISTS "Authenticated can manage cashier staff" ON public.cashier_staff;
CREATE POLICY "Authenticated can manage cashier staff" ON public.cashier_staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- SUPABASE REALTIME PUBLICATION
-- Stock updates (via the order_items trigger) and other live tables
-- ==============================================================================
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER TABLE public.newsletter_subscribers REPLICA IDENTITY FULL;
ALTER TABLE public.shift_reports REPLICA IDENTITY FULL;
ALTER TABLE public.cashier_staff REPLICA IDENTITY FULL;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['products', 'orders', 'order_items', 'contact_messages', 'newsletter_subscribers', 'shift_reports', 'cashier_staff']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- DELTA MIGRATION SCRIPT (For existing databases)
-- Run this block if you already have the initial Chocolate House schema deployed:
-- ==============================================================================
-- 1. Cashier Staff Table
CREATE TABLE IF NOT EXISTS public.cashier_staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.cashier_staff (id, name, is_active)
VALUES 
  ('staff-1', 'Ahmed', true),
  ('staff-2', 'Sara', true),
  ('staff-3', 'Omar', true),
  ('staff-4', 'Youssef', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.cashier_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cashier staff are readable" ON public.cashier_staff;
CREATE POLICY "Cashier staff are readable" ON public.cashier_staff FOR SELECT USING (true);
DROP POLICY IF EXISTS "Cashier staff are manageable" ON public.cashier_staff;
DROP POLICY IF EXISTS "Authenticated can manage cashier staff" ON public.cashier_staff;
CREATE POLICY "Authenticated can manage cashier staff" ON public.cashier_staff 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Staff name attribution on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- 3. Customer Add-ons on order items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS addon_total NUMERIC(10, 2) DEFAULT 0;

-- 4. Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
CREATE POLICY "Staff can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
CREATE POLICY "Staff can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;
CREATE POLICY "Staff can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

