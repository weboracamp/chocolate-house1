import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Order,
  OrderItem,
  Expense,
  ShiftReport,
  UserProfile,
  UserRole,
  Language,
  CategoryType,
  OrderStatus,
  FeatureItem,
  ActiveViewType,
  SiteConfig,
  Testimonial,
  FAQItem,
  ContactInquiry,
  ContactMessage,
  NewsletterSubscriber,
} from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_FEATURES } from '../data/features';
import { INITIAL_SITE_CONFIG, INITIAL_TESTIMONIALS, INITIAL_FAQS } from '../data/siteConfig';
import { translations } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import {
  cachedSupabaseQuery,
  cachedSupabaseMutations,
  invalidateCache,
  invalidateAllCache,
  CACHE_TTL_CONFIG,
} from '../lib/supabaseCache';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface CartItem extends OrderItem {
  stock: number;
}

interface StoreContextType {
  // Language & i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  
  // Dynamic Site Config & Content
  siteConfig: SiteConfig;
  features: FeatureItem[];
  testimonials: Testimonial[];
  faqs: FAQItem[];
  
  // Contact Messages & Inquiries
  contactMessages: ContactMessage[];
  contactInquiries: ContactInquiry[];
  submitContactInquiry: (inquiry: Omit<ContactInquiry, 'id' | 'created_at' | 'status'>) => boolean;
  submitContactMessage: (message: Omit<ContactMessage, 'id' | 'created_at'>) => Promise<boolean>;
  deleteContactMessage: (id: string) => Promise<boolean>;
  updateContactMessageStatus: (id: string, status: 'new' | 'read' | 'resolved') => Promise<boolean>;

  // Newsletter Subscribers
  newsletterSubscribers: NewsletterSubscriber[];
  subscribeNewsletter: (email: string) => Promise<boolean>;
  deleteNewsletterSubscriber: (id: string) => Promise<boolean>;
  
  // Products
  products: Product[];
  lowStockProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;
  
  // Orders
  orders: Order[];
  dailyOrders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'status'>) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;
  
  // Expenses
  expenses: Expense[];
  dailyExpenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  
  // Shifts
  shiftReports: ShiftReport[];
  currentShiftId: string;
  endShiftAndReconcile: (cashierReportedCash: number, cashierName: string, notes?: string) => ShiftReport;
  
  // Monthly Export & Reset (Owner)
  exportAndResetMonthlyData: () => { bestSeller: Product | null; totalOrders: number; totalSales: number };
  
  // Auth
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  login: (email: string, password?: string, role?: 'owner' | 'cashier', name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  dismissToast: (id: string) => void;
  
  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'ch_language',
  PRODUCTS: 'ch_products',
  ORDERS: 'ch_orders',
  EXPENSES: 'ch_expenses',
  SHIFTS: 'ch_shift_reports',
  USER: 'ch_user_profile',
  SHIFT_RESET_TIMESTAMP: 'ch_last_shift_reset',
  CONTACT_MESSAGES: 'ch_contact_messages',
  NEWSLETTER_SUBSCRIBERS: 'ch_newsletter_subscribers',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language State (Default: 'en' as required)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved === 'ar' ? 'ar' : 'en') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  // 2. View / Route State (support URL path or hash)
  const [activeView, setActiveView] = useState<ActiveViewType>(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash.includes('owner') || path.includes('/owner')) return 'owner';
    if (hash.includes('cashier') || path.includes('/cashier')) return 'cashier';
    if (hash.includes('why-us') || hash.includes('why') || hash.includes('about')) return 'why-us';
    if (hash.includes('contact')) return 'contact';
    return 'store';
  });

  // Listen to hash / URL changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('owner') || path.includes('/owner')) {
        setActiveView('owner');
      } else if (hash.includes('cashier') || path.includes('/cashier')) {
        setActiveView('cashier');
      } else if (hash.includes('why-us') || hash.includes('why') || hash.includes('about')) {
        setActiveView('why-us');
      } else if (hash.includes('contact')) {
        setActiveView('contact');
      } else {
        setActiveView('store');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Update hash when view changes
  const handleSetActiveView = (view: ActiveViewType) => {
    setActiveView(view);
    if (view === 'store') {
      window.location.hash = '';
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Dynamic Site Config & Content State
  const [siteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [features] = useState<FeatureItem[]>(INITIAL_FEATURES);
  const [testimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [faqs] = useState<FAQItem[]>(INITIAL_FAQS);
  
  // Contact Messages & Inquiries State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    // When Supabase is configured, start empty so real DB data (even 0 rows) is faithfully reflected
    if (supabase) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTACT_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'msg-sample-1',
        name: 'كريم محمود',
        phone: '01098765432',
        email: 'karim.m@example.com',
        subject: 'حجز مناسبة عيد ميلاد خاصة',
        message: 'مساء الخير، هل يمكن حجز طاولة لـ 8 أشخاص مع تجهيز تورتة شوكولاتة مخصصة يوم الجمعة القادم؟',
        status: 'new',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-sample-2',
        name: 'سارة خالد',
        phone: '01123456789',
        email: 'sara.k@example.com',
        subject: 'استفسار عن خدمة التوصيل',
        message: 'هل يتوفر توصيل لمناطق محيطة بالحوامدية مثل طريق مصر أسيوط؟ شكراً لكم.',
        status: 'read',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  });

  // Newsletter Subscribers State
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>(() => {
    // When Supabase is configured, start empty so real DB data (even 0 rows) is faithfully reflected
    if (supabase) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'sub-sample-1',
        email: 'chocolate.lover@example.com',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'sub-sample-2',
        email: 'mohamed.cairo@gmail.com',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];
  });

  // Fetch initial records from Supabase via the Caching Layer (Reduces Supabase load)
  useEffect(() => {
    if (supabase) {
      const fetchInitialData = async () => {
        try {
          // 0. Fetch products through caching layer (TTL: 10 mins)
          const { data: remoteProducts, fromCache: prodFromCache, error: prodError } = await cachedSupabaseQuery<Product[]>(
            'products',
            async () => {
              const res = await supabase!
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
              return { data: res.data as Product[], error: res.error };
            },
            { table: 'products' }
          );

          if (!prodError && Array.isArray(remoteProducts)) {
            setProducts(remoteProducts);
            if (prodFromCache) {
              console.info(`[StoreContext] ⚡ Loaded ${remoteProducts.length} products from client-side cache`);
            } else {
              console.info(`[StoreContext] 📦 Loaded ${remoteProducts.length} products from Supabase (empty table reflects as 0 items)`);
            }
          } else if (prodError) {
            console.warn('[StoreContext] Failed fetching products from Supabase (network/server error):', prodError);
          }
        } catch (err) {
          console.warn('Error loading products from Supabase via cache:', err);
        }

        try {
          // 1. Fetch contact messages through caching layer (TTL: 3 mins)
          const { data: messages, fromCache: msgFromCache, error: msgError } = await cachedSupabaseQuery<ContactMessage[]>(
            'contact_messages',
            async () => {
              const res = await supabase!
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });
              return { data: res.data as ContactMessage[], error: res.error };
            },
            { table: 'contact_messages' }
          );

          if (!msgError && Array.isArray(messages)) {
            setContactMessages(messages);
            if (msgFromCache) {
              console.info(`[StoreContext] ⚡ Loaded ${messages.length} contact_messages from client-side cache`);
            } else {
              console.info(`[StoreContext] 📨 Loaded ${messages.length} contact_messages from Supabase (empty table reflects as 0 rows)`);
            }
          } else if (msgError) {
            console.warn('[StoreContext] Failed fetching contact_messages from Supabase:', msgError);
          }
        } catch (err) {
          console.warn('Error loading contact_messages via cache:', err);
        }

        try {
          // 2. Fetch newsletter subscribers through caching layer (TTL: 5 mins)
          const { data: subs, fromCache: subsFromCache, error: subError } = await cachedSupabaseQuery<NewsletterSubscriber[]>(
            'newsletter_subscribers',
            async () => {
              const res = await supabase!
                .from('newsletter_subscribers')
                .select('*')
                .order('created_at', { ascending: false });
              return { data: res.data as NewsletterSubscriber[], error: res.error };
            },
            { table: 'newsletter_subscribers' }
          );

          if (!subError && Array.isArray(subs)) {
            setNewsletterSubscribers(subs);
            if (subsFromCache) {
              console.info(`[StoreContext] ⚡ Loaded ${subs.length} newsletter_subscribers from client-side cache`);
            } else {
              console.info(`[StoreContext] 📬 Loaded ${subs.length} newsletter_subscribers from Supabase (empty table reflects as 0 rows)`);
            }
          } else if (subError) {
            console.warn('[StoreContext] Failed fetching newsletter_subscribers from Supabase:', subError);
          }
        } catch (err) {
          console.warn('Error loading newsletter_subscribers via cache:', err);
        }

        try {
          // 3. Fetch orders and order_items through caching layer (TTL: 2 mins)
          const { data: remoteOrders, fromCache: ordersFromCache, error: ordError } = await cachedSupabaseQuery<Order[]>(
            'orders',
            async () => {
              const { data: ordersData, error: ordersErr } = await supabase!
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

              if (ordersErr || !ordersData) return { data: null, error: ordersErr };

              // Fetch order items for these orders
              const { data: itemsData } = await supabase!
                .from('order_items')
                .select('*');

              const mappedOrders: Order[] = ordersData.map((ord: any) => {
                const items = (itemsData || [])
                  .filter((item: any) => item.order_id === ord.id)
                  .map((item: any) => ({
                    product_id: item.product_id || '',
                    product_name_en: item.product_name_en,
                    product_name_ar: item.product_name_ar,
                    quantity: item.quantity,
                    unit_price: Number(item.unit_price),
                    total_price: Number(item.total_price),
                    image: item.image,
                  }));

                return {
                  id: ord.id,
                  order_number: ord.order_number,
                  order_type: ord.order_type,
                  customer_name: ord.customer_name,
                  customer_phone: ord.customer_phone,
                  table_number: ord.table_number || undefined,
                  delivery_address: ord.delivery_address || undefined,
                  pickup_time: ord.pickup_time || undefined,
                  notes: ord.notes || undefined,
                  payment_method: ord.payment_method,
                  transfer_from_phone: ord.transfer_from_phone || undefined,
                  amount_transferred: ord.amount_transferred ? Number(ord.amount_transferred) : undefined,
                  items,
                  subtotal: Number(ord.subtotal),
                  delivery_fee: Number(ord.delivery_fee || 0),
                  discount_total: Number(ord.discount_total || 0),
                  total: Number(ord.total),
                  status: ord.status,
                  created_at: ord.created_at,
                  shift_id: ord.shift_id || undefined,
                  is_archived: Boolean(ord.is_archived),
                };
              });

              return { data: mappedOrders, error: null };
            },
            { table: 'orders' }
          );

          if (!ordError && remoteOrders && remoteOrders.length > 0) {
            setOrders((prevLocal) => {
              // Merge remote and local orders gracefully without duplicating
              const existingIds = new Set(prevLocal.map((o) => o.id));
              const newFromRemote = remoteOrders.filter((ro) => !existingIds.has(ro.id));
              return [...prevLocal, ...newFromRemote];
            });
            if (ordersFromCache) {
              console.info('[StoreContext] ⚡ Loaded orders from client-side cache');
            }
          }
        } catch (err) {
          console.warn('Error loading orders from Supabase via cache:', err);
        }

        try {
          // 4. Fetch expenses through caching layer (TTL: 3 mins)
          const { data: remoteExpenses, error: expErr } = await cachedSupabaseQuery<Expense[]>(
            'expenses',
            async () => {
              const res = await supabase!
                .from('expenses')
                .select('*')
                .order('created_at', { ascending: false });
              return { data: res.data as Expense[], error: res.error };
            },
            { table: 'expenses' }
          );

          if (!expErr && remoteExpenses && remoteExpenses.length > 0) {
            setExpenses(remoteExpenses);
          }
        } catch (err) {
          console.warn('Error loading expenses from Supabase via cache:', err);
        }

        try {
          // 5. Fetch shift reports through caching layer (TTL: 3 mins)
          const { data: remoteShifts, error: shiftErr } = await cachedSupabaseQuery<ShiftReport[]>(
            'shift_reports',
            async () => {
              const res = await supabase!
                .from('shift_reports')
                .select('*')
                .order('created_at', { ascending: false });
              return { data: res.data as ShiftReport[], error: res.error };
            },
            { table: 'shift_reports' }
          );

          if (!shiftErr && remoteShifts && remoteShifts.length > 0) {
            setShiftReports(remoteShifts);
          }
        } catch (err) {
          console.warn('Error loading shift_reports from Supabase via cache:', err);
        }
      };

      fetchInitialData();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTACT_MESSAGES, JSON.stringify(contactMessages));
  }, [contactMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, JSON.stringify(newsletterSubscribers));
  }, [newsletterSubscribers]);

  const submitContactMessage = async (messageData: Omit<ContactMessage, 'id' | 'created_at'>): Promise<boolean> => {
    const newId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newMessage: ContactMessage = {
      ...messageData,
      id: newId,
      created_at: now,
      status: messageData.status || 'new',
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .insert({
            id: newId,
            name: messageData.name.trim(),
            phone: messageData.phone.trim(),
            email: messageData.email?.trim() || null,
            subject: messageData.subject?.trim() || null,
            message: messageData.message.trim(),
            status: 'new',
            created_at: now,
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error('[StoreContext] Supabase insert contact_messages error:', error);
          showToast(
            language === 'ar' ? `فشل إرسال الرسالة: ${error.message}` : `Failed to send message: ${error.message}`,
            'error'
          );
          return false;
        }

        invalidateCache('contact_messages');
        if (data) {
          newMessage.id = data.id;
        }
      } catch (err: any) {
        console.error('[StoreContext] Exception inserting contact_message:', err);
        showToast(language === 'ar' ? 'فشل إرسال الرسالة، يرجى المحاولة مرة أخرى' : 'Failed to send message, please try again', 'error');
        return false;
      }
    }

    setContactMessages((prev) => [newMessage, ...prev]);
    showToast(
      language === 'ar'
        ? 'شكراً لتواصلك معنا! تم استلام رسالتك وسنقوم بالرد عليك في أقرب وقت.'
        : 'Thank you for reaching out! Your message has been received and our team will respond shortly.',
      'success'
    );
    return true;
  };

  const deleteContactMessage = async (id: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) {
          console.error('[StoreContext] Supabase delete contact_messages error:', error);
          showToast(
            language === 'ar' ? `فشل حذف الرسالة: ${error.message}` : `Failed to delete message: ${error.message}`,
            'error'
          );
          return false;
        }
        invalidateCache('contact_messages');
      } catch (err: any) {
        console.error('[StoreContext] Exception deleting contact_message:', err);
        showToast(language === 'ar' ? 'فشل حذف الرسالة' : 'Failed to delete message', 'error');
        return false;
      }
    }

    setContactMessages((prev) => prev.filter((m) => m.id !== id));
    showToast(language === 'ar' ? 'تم حذف الرسالة بنجاح' : 'Message deleted successfully', 'info');
    return true;
  };

  const updateContactMessageStatus = async (id: string, status: 'new' | 'read' | 'resolved'): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ status })
          .eq('id', id);

        if (error) {
          console.error('[StoreContext] Supabase update contact_message status error:', error);
          return false;
        }
        invalidateCache('contact_messages');
      } catch (err) {
        console.error('[StoreContext] Exception updating contact_message status:', err);
        return false;
      }
    }

    setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    return true;
  };

  const subscribeNewsletter = async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      showToast(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address', 'error');
      return false;
    }

    // Check if already subscribed locally
    const existing = newsletterSubscribers.find((s) => s.email.toLowerCase() === trimmed);
    if (existing) {
      showToast(
        language === 'ar'
          ? 'هذا البريد الإلكتروني مشترك بالفعل في نشرتنا البريدية!'
          : 'This email is already subscribed to our newsletter!',
        'info'
      );
      return true;
    }

    const newId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newSubscriber: NewsletterSubscriber = {
      id: newId,
      email: trimmed,
      is_active: true,
      created_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .insert({
            id: newId,
            email: trimmed,
            is_active: true,
            created_at: now,
          })
          .select()
          .maybeSingle();

        if (error) {
          // Handle unique constraint conflict (PostgreSQL error code 23505 or duplicate message)
          const isDuplicate =
            error.code === '23505' ||
            error.message?.toLowerCase().includes('duplicate') ||
            error.message?.toLowerCase().includes('unique');

          if (isDuplicate) {
            showToast(
              language === 'ar'
                ? 'هذا البريد الإلكتروني مشترك بالفعل في نشرتنا البريدية!'
                : 'This email is already subscribed to our newsletter!',
              'info'
            );
            return true;
          }

          console.error('[StoreContext] Supabase insert newsletter_subscribers error:', error);
          showToast(
            language === 'ar' ? `فشل الاشتراك: ${error.message}` : `Subscription failed: ${error.message}`,
            'error'
          );
          return false;
        }

        invalidateCache('newsletter_subscribers');
        if (data) {
          newSubscriber.id = data.id;
        }
      } catch (err: any) {
        console.error('[StoreContext] Exception subscribing to newsletter:', err);
        showToast(language === 'ar' ? 'فشل الاشتراك، يرجى المحاولة مرة أخرى' : 'Failed to subscribe, please try again', 'error');
        return false;
      }
    }

    setNewsletterSubscribers((prev) => [newSubscriber, ...prev]);
    showToast(
      language === 'ar'
        ? 'تم اشتراكك في النشرة البريدية بنجاح! ستصلك أحدث العروض والخصومات.'
        : 'Subscribed successfully! You will receive our latest offers and discounts.',
      'success'
    );
    return true;
  };

  const deleteNewsletterSubscriber = async (id: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
        if (error) {
          console.error('[StoreContext] Supabase delete newsletter_subscribers error:', error);
          showToast(
            language === 'ar' ? `فشل حذف المشترك: ${error.message}` : `Failed to delete subscriber: ${error.message}`,
            'error'
          );
          return false;
        }
        invalidateCache('newsletter_subscribers');
      } catch (err: any) {
        console.error('[StoreContext] Exception deleting newsletter subscriber:', err);
        showToast(language === 'ar' ? 'فشل حذف المشترك' : 'Failed to delete subscriber', 'error');
        return false;
      }
    }

    setNewsletterSubscribers((prev) => prev.filter((s) => s.id !== id));
    showToast(language === 'ar' ? 'تم حذف المشترك بنجاح' : 'Subscriber deleted successfully', 'info');
    return true;
  };

  // Backward compatibility alias for contactInquiries
  const contactInquiries = contactMessages;
  const submitContactInquiry = (inquiry: Omit<ContactInquiry, 'id' | 'created_at' | 'status'>): boolean => {
    submitContactMessage({
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email,
      subject: inquiry.subject,
      message: inquiry.message,
    });
    return true;
  };

  // 4. Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // With Supabase configured, default to empty list so real DB data (even when 0 rows) is faithfully reflected
    return supabase ? [] : INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  // Low stock products (stock <= 15)
  const lowStockProducts = products.filter((p) => p.stock <= 15);

  const addProduct = async (newProd: Omit<Product, 'id'>): Promise<boolean> => {
    const newId = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const product: Product = {
      ...newProd,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert({
            id: product.id,
            name_en: product.name_en,
            name_ar: product.name_ar,
            description_en: product.description_en || '',
            description_ar: product.description_ar || '',
            price: product.price,
            discount_price: product.discount_price || null,
            category: product.category,
            stock: product.stock,
            image: product.image,
            is_best_seller: Boolean(product.is_best_seller),
            is_new: Boolean(product.is_new),
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          console.error('[StoreContext] Supabase insert product error:', error);
          showToast(
            language === 'ar'
              ? `فشل إضافة الصنف: ${error.message}`
              : `Failed to add product: ${error.message}`,
            'error'
          );
          return false;
        }

        if (data) {
          setProducts((prev) => [data as Product, ...prev]);
          invalidateCache('products');
          showToast(language === 'ar' ? 'تمت إضافة الصنف بنجاح' : 'Product added successfully', 'success');
          return true;
        }
      } catch (err: any) {
        console.error('[StoreContext] Exception inserting product:', err);
        showToast(`Error: ${err.message || err}`, 'error');
        return false;
      }
    }

    setProducts((prev) => [product, ...prev]);
    invalidateCache('products');
    showToast(language === 'ar' ? 'تمت إضافة الصنف بنجاح' : 'Product added successfully', 'success');
    return true;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const payload: Record<string, any> = { ...updates, updated_at: now };
        if ('discount_price' in updates && updates.discount_price === undefined) {
          payload.discount_price = null;
        }

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[StoreContext] Supabase update product error:', error);
          showToast(
            language === 'ar'
              ? `فشل تعديل بيانات الصنف: ${error.message}`
              : `Failed to update product: ${error.message}`,
            'error'
          );
          return false;
        }

        setProducts((prev) =>
          prev.map((p) => (p.id === id ? ((data as Product) || { ...p, ...updates, updated_at: now }) : p))
        );
        invalidateCache('products');
        showToast(language === 'ar' ? 'تم تحديث بيانات الصنف بنجاح' : 'Product updated successfully', 'success');
        return true;
      } catch (err: any) {
        console.error('[StoreContext] Exception updating product:', err);
        showToast(`Error: ${err.message || err}`, 'error');
        return false;
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: now } : p))
    );
    invalidateCache('products');
    showToast(language === 'ar' ? 'تم تحديث بيانات الصنف' : 'Product updated successfully', 'success');
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    if (supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error('[StoreContext] Supabase delete product error:', error);
          showToast(
            language === 'ar'
              ? `فشل حذف الصنف: ${error.message}`
              : `Failed to delete product: ${error.message}`,
            'error'
          );
          return false;
        }
      } catch (err: any) {
        console.error('[StoreContext] Exception deleting product:', err);
        showToast(`Error: ${err.message || err}`, 'error');
        return false;
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    invalidateCache('products');
    showToast(language === 'ar' ? 'تم حذف الصنف' : 'Product deleted', 'info');
    return true;
  };

  // 4. Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const addToCart = (product: Product, quantity = 1): boolean => {
    if (product.stock <= 0) {
      showToast(language === 'ar' ? 'عذراً، هذا الصنف غير متوفر حالياً' : 'Sorry, this item is sold out', 'error');
      return false;
    }

    const unitPrice = product.discount_price ?? product.price;
    const existing = cart.find((item) => item.product_id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stock) {
      showToast(
        language === 'ar'
          ? `الكمية المطلوبة تتجاوز المخزون المتبقي (${product.stock} قطعة)`
          : `Requested quantity exceeds available stock (${product.stock} available)`,
        'warning'
      );
      return false;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: newQty,
                total_price: newQty * unitPrice,
                stock: product.stock,
              }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name_en: product.name_en,
        product_name_ar: product.name_ar,
        quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        image: product.image,
        stock: product.stock,
      };
      setCart((prev) => [...prev, newItem]);
    }

    showToast(
      language === 'ar'
        ? `تمت إضافة "${product.name_ar}" للصينية`
        : `Added "${product.name_en}" to tray`,
      'success'
    );
    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;

    const currentProduct = products.find((p) => p.id === productId);
    const availableStock = currentProduct ? currentProduct.stock : item.stock;

    if (quantity > availableStock) {
      showToast(
        language === 'ar'
          ? `الكمية القصوى المتاحة بالمخزون هي ${availableStock}`
          : `Maximum available in stock is ${availableStock}`,
        'warning'
      );
      return;
    }

    setCart((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              quantity,
              total_price: quantity * i.unit_price,
            }
          : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  // Calculate discount total
  const cartDiscount = cart.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.product_id);
    if (prod && prod.discount_price && prod.discount_price < prod.price) {
      return sum + (prod.price - prod.discount_price) * item.quantity;
    }
    return sum;
  }, 0);

  const cartTotal = cartSubtotal;

  // 5. Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  // Last shift reset timestamp (to filter Cashier daily view)
  const [lastShiftReset, setLastShiftReset] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHIFT_RESET_TIMESTAMP) || new Date(0).toISOString();
  });

  // Daily orders (active non-archived orders since last shift reset)
  const dailyOrders = orders.filter((o) => {
    if (o.is_archived) return false;
    return new Date(o.created_at) >= new Date(lastShiftReset);
  });

  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Place order with auto-decrement stock
  const placeOrder = (
    orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'status'>
  ): Order | null => {
    // 1. Strict Stock Validation
    for (const item of orderData.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || product.stock < item.quantity) {
        showToast(
          language === 'ar'
            ? `عذراً، الصنف "${item.product_name_ar}" غير متوفر بالكمية المطلوبة (المتبقي: ${product ? product.stock : 0})`
            : `Sorry, "${item.product_name_en}" is not available in requested quantity (Left: ${product ? product.stock : 0})`,
          'error'
        );
        return null;
      }
    }

    // 2. Auto-decrement stock in database / state
    setProducts((prev) =>
      prev.map((prod) => {
        const orderItem = orderData.items.find((i) => i.product_id === prod.id);
        if (orderItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - orderItem.quantity),
          };
        }
        return prod;
      })
    );

    // 3. Create the order
    const dateStr = new Date().toISOString();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CH-${randomNum}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      status: 'pending',
      created_at: dateStr,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveReceiptOrder(newOrder);

    // Invalidate orders and products cache
    invalidateCache('orders');
    invalidateCache('products');

    // Async push to Supabase if connected
    if (supabase) {
      (async () => {
        try {
          // 1. Insert order record
          await supabase.from('orders').insert({
            id: newOrder.id,
            order_number: newOrder.order_number,
            order_type: newOrder.order_type,
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone,
            table_number: newOrder.table_number || null,
            delivery_address: newOrder.delivery_address || null,
            pickup_time: newOrder.pickup_time || null,
            notes: newOrder.notes || null,
            payment_method: newOrder.payment_method,
            transfer_from_phone: newOrder.transfer_from_phone || null,
            amount_transferred: newOrder.amount_transferred || null,
            subtotal: newOrder.subtotal,
            delivery_fee: newOrder.delivery_fee,
            discount_total: newOrder.discount_total,
            total: newOrder.total,
            status: newOrder.status,
            is_archived: false,
            created_at: newOrder.created_at,
          });

          // 2. Insert order items
          const itemsPayload = newOrder.items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            order_id: newOrder.id,
            product_id: item.product_id || null,
            product_name_en: item.product_name_en,
            product_name_ar: item.product_name_ar,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            image: item.image || null,
          }));

          if (itemsPayload.length > 0) {
            await supabase.from('order_items').insert(itemsPayload);
          }
        } catch (err) {
          console.warn('Failed to insert order to Supabase:', err);
        }
      })();
    }

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#2B140E', '#F7E7A9', '#5E2F20'],
      });
    } catch {
      // ignore
    }

    showToast(
      language === 'ar'
        ? `تم إرسال طلبك بنجاح! رقم الفاتورة: ${orderNumber}`
        : `Order placed successfully! Order #${orderNumber}`,
      'success'
    );

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    invalidateCache('orders');
    if (supabase) {
      supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.warn('Failed to update order status in Supabase:', error);
        });
    }
    showToast(
      language === 'ar'
        ? `تم تحديث حالة الطلب إلى "${translations.ar[status]}"`
        : `Order status updated to "${status}"`,
      'info'
    );
  };

  // 6. Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  const dailyExpenses = expenses.filter(
    (exp) => new Date(exp.created_at) >= new Date(lastShiftReset)
  );

  const addExpense = (newExp: Omit<Expense, 'id' | 'created_at'>) => {
    const expense: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [expense, ...prev]);
    invalidateCache('expenses');

    if (supabase) {
      supabase
        .from('expenses')
        .insert({
          id: expense.id,
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          notes: expense.notes || null,
          cashier_name: expense.cashier_name,
          created_at: expense.created_at,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[StoreContext] Failed to insert expense into Supabase:', error);
            showToast(
              language === 'ar'
                ? `تنبيه: تعذر مزامنة المصروف مع قاعدة البيانات: ${error.message}`
                : `Warning: Could not sync expense with database: ${error.message}`,
              'warning'
            );
          }
        });
    }

    showToast(
      language === 'ar'
        ? `تم تسجيل المصروف بقيمة ${expense.amount} ج.م`
        : `Logged expense of ${expense.amount} EGP`,
      'success'
    );
  };

  // 7. Shifts & Reconciliation
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shiftReports));
  }, [shiftReports]);

  const currentShiftId = `shift-${new Date().toISOString().slice(0, 10)}`;

  const endShiftAndReconcile = (
    cashierReportedCash: number,
    cashierName: string,
    notes?: string
  ): ShiftReport => {
    // Calculate shift financial totals
    const shiftOrders = dailyOrders.filter((o) => o.status !== 'cancelled');
    const totalSales = shiftOrders.reduce((sum, o) => sum + o.total, 0);

    const cashSales = shiftOrders
      .filter((o) => o.payment_method === 'cod')
      .reduce((sum, o) => sum + o.total, 0);

    const digitalSales = shiftOrders
      .filter((o) => o.payment_method === 'instapay_wallet')
      .reduce((sum, o) => sum + o.total, 0);

    const expensesTotal = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Expected cash in drawer = Cash Orders - Cash Expenses (Digital payments do NOT enter physical drawer!)
    const systemExpectedCash = Math.max(0, cashSales - expensesTotal);
    const discrepancy = cashierReportedCash - systemExpectedCash;

    const report: ShiftReport = {
      id: `rep-${Date.now()}`,
      shift_number: `SHIFT-${new Date().toISOString().slice(5, 10).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      cashier_name: cashierName,
      start_time: lastShiftReset,
      end_time: new Date().toISOString(),
      total_orders_count: shiftOrders.length,
      total_sales: totalSales,
      cash_sales: cashSales,
      digital_sales: digitalSales,
      expenses_total: expensesTotal,
      system_expected_cash: systemExpectedCash,
      cashier_reported_cash: cashierReportedCash,
      discrepancy,
      notes,
      created_at: new Date().toISOString(),
    };

    setShiftReports((prev) => [report, ...prev]);
    invalidateCache('shift_reports');

    if (supabase) {
      supabase
        .from('shift_reports')
        .insert({
          id: report.id,
          shift_number: report.shift_number,
          cashier_id: currentUser?.id || null,
          cashier_name: report.cashier_name,
          start_time: report.start_time,
          end_time: report.end_time,
          total_orders_count: report.total_orders_count,
          total_sales: report.total_sales,
          cash_sales: report.cash_sales,
          digital_sales: report.digital_sales,
          expenses_total: report.expenses_total,
          system_expected_cash: report.system_expected_cash,
          cashier_reported_cash: report.cashier_reported_cash,
          discrepancy: report.discrepancy,
          notes: report.notes || null,
          created_at: report.created_at,
        })
        .then(({ error }) => {
          if (error) {
            console.error('[StoreContext] Failed to insert shift report into Supabase:', error);
            showToast(
              language === 'ar'
                ? `تنبيه: تعذر حفظ تقرير الوردية بالسحابة: ${error.message}`
                : `Warning: Could not sync shift report with database: ${error.message}`,
              'warning'
            );
          }
        });
    }

    // Reset cashier daily view
    const nowIso = new Date().toISOString();
    setLastShiftReset(nowIso);
    localStorage.setItem(STORAGE_KEYS.SHIFT_RESET_TIMESTAMP, nowIso);

    showToast(
      language === 'ar'
        ? `تم إغلاق الوردية وحفظ التقرير. الفارق: ${discrepancy >= 0 ? `+${discrepancy}` : discrepancy} ج.م`
        : `Shift closed. Discrepancy: ${discrepancy >= 0 ? `+${discrepancy}` : discrepancy} EGP`,
      discrepancy === 0 ? 'success' : discrepancy > 0 ? 'info' : 'warning'
    );

    return report;
  };

  // 8. Owner: Export & Reset Monthly Data
  const exportAndResetMonthlyData = () => {
    // Compute best seller
    const productSalesMap: Record<string, { product: Product; count: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        if (!productSalesMap[item.product_id] && prod) {
          productSalesMap[item.product_id] = { product: prod, count: 0, revenue: 0 };
        }
        if (productSalesMap[item.product_id]) {
          productSalesMap[item.product_id].count += item.quantity;
          productSalesMap[item.product_id].revenue += item.total_price;
        }
      });
    });

    let bestSeller: Product | null = null;
    let highestCount = 0;
    Object.values(productSalesMap).forEach((val) => {
      if (val.count > highestCount) {
        highestCount = val.count;
        bestSeller = val.product;
      }
    });

    const activeOrders = orders.filter((o) => !o.is_archived);
    const totalSales = activeOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);

    // Build CSV Content
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += '--- CHOCOLATE HOUSE MONTHLY FINANCIAL & ORDERS REPORT ---\r\n';
    csvContent += `Generated At,${new Date().toLocaleString()}\r\n`;
    csvContent += `Total Orders,${activeOrders.length}\r\n`;
    csvContent += `Total Gross Revenue (EGP),${totalSales.toFixed(2)}\r\n`;
    csvContent += `Best Seller Product,"${bestSeller ? (bestSeller as Product).name_en : 'N/A'}" (${highestCount} sold)\r\n\r\n`;

    csvContent += 'Order #,Date,Type,Customer,Phone,Payment,Method Details,Subtotal,Delivery,Total,Status\r\n';
    activeOrders.forEach((o) => {
      const details = o.payment_method === 'instapay_wallet' ? `Sender: ${o.transfer_from_phone || 'N/A'}` : 'Cash';
      csvContent += `"${o.order_number}","${o.created_at}","${o.order_type}","${o.customer_name}","${o.customer_phone}","${o.payment_method}","${details}",${o.subtotal},${o.delivery_fee},${o.total},"${o.status}"\r\n`;
    });

    csvContent += '\r\n--- SHIFT REPORTS AUDIT ---\r\n';
    csvContent += 'Shift #,Cashier,Start,End,Orders,Total Sales,Cash Sales,Digital Sales,Expenses,Expected Cash,Reported Cash,Discrepancy\r\n';
    shiftReports.forEach((sr) => {
      csvContent += `"${sr.shift_number}","${sr.cashier_name}","${sr.start_time}","${sr.end_time}",${sr.total_orders_count},${sr.total_sales},${sr.cash_sales},${sr.digital_sales},${sr.expenses_total},${sr.system_expected_cash},${sr.cashier_reported_cash},${sr.discrepancy}\r\n`;
    });

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chocolate_House_Monthly_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Archive active orders in database
    setOrders((prev) => prev.map((o) => ({ ...o, is_archived: true })));

    showToast(
      language === 'ar'
        ? 'تم تصدير التقرير الشهري بنجاح وأرشفة الطلبات السابقة'
        : 'Monthly report exported & completed orders archived',
      'success'
    );

    return {
      bestSeller,
      totalOrders: activeOrders.length,
      totalSales,
    };
  };

  // 9. Auth State & Real Supabase Session Management
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(Boolean(supabase));

  // Helper to map Supabase User to UserProfile strictly reading public.profiles
  const resolveUserProfile = async (user: any): Promise<UserProfile | null> => {
    let role: UserRole | null = null;
    let name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Staff';

    if (supabase) {
      try {
        // 1. Direct lookup by user UUID in public.profiles table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role && (profile.role === 'owner' || profile.role === 'cashier')) {
          role = profile.role as UserRole;
          name = profile.full_name || name;
          console.info(`[StoreContext] 👤 Resolved verified role "${role}" from public.profiles for ${user.email}`);
        } else {
          // 2. Lookup by email in public.profiles if UUID didn't match
          const { data: profileByEmail, error: emailErr } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('email', user.email)
            .maybeSingle();

          if (profileByEmail?.role && (profileByEmail.role === 'owner' || profileByEmail.role === 'cashier')) {
            role = profileByEmail.role as UserRole;
            name = profileByEmail.full_name || name;
            console.info(`[StoreContext] 👤 Resolved verified role "${role}" via email in public.profiles for ${user.email}`);
          } else if (profileErr || emailErr) {
            console.warn('[StoreContext] Could not find authorized role in public.profiles:', profileErr || emailErr);
          }
        }
      } catch (err) {
        console.warn('[StoreContext] Exception resolving profile from public.profiles:', err);
      }
    }

    // STRICT ZERO-TRUST RULE: If user has NO valid matching row in public.profiles with an explicit role, DENY access completely
    if (!role) {
      console.warn(`[StoreContext] ⛔ Access Denied: User ${user.email} (${user.id}) has no valid role in public.profiles`);
      return null;
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
      role,
      name,
    };

    return profile;
  };

  // Sync Supabase Auth session on mount and listen to changes
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let mounted = true;

    // Check existing active Supabase session
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;
        if (session?.user && !error) {
          try {
            const profile = await resolveUserProfile(session.user);
            if (profile) {
              if (mounted) {
                setCurrentUser(profile);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
              }
            } else {
              // Unregistered user with no profile row - sign them out immediately
              await supabase.auth.signOut();
              if (mounted) {
                setCurrentUser(null);
                localStorage.removeItem(STORAGE_KEYS.USER);
              }
            }
          } catch (e) {
            console.warn('[StoreContext] Failed to resolve user profile:', e);
            if (mounted) {
              setCurrentUser(null);
              localStorage.removeItem(STORAGE_KEYS.USER);
            }
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
        if (mounted) setIsAuthLoading(false);
      })
      .catch((err) => {
        console.warn('[StoreContext] getSession error:', err);
        if (mounted) {
          setCurrentUser(null);
          setIsAuthLoading(false);
        }
      });

    // Real-time auth state updates (e.g. login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        try {
          const profile = await resolveUserProfile(session.user);
          if (profile) {
            if (mounted) {
              setCurrentUser(profile);
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
            }
          } else {
            // Unauthorized user without an explicit role row - reject and sign out
            await supabase.auth.signOut();
            if (mounted) {
              setCurrentUser(null);
              localStorage.removeItem(STORAGE_KEYS.USER);
            }
          }
        } catch (e) {
          console.warn('[StoreContext] onAuthStateChange profile resolution error:', e);
          if (mounted) {
            setCurrentUser(null);
            localStorage.removeItem(STORAGE_KEYS.USER);
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      if (mounted) setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password?: string,
    targetRole?: 'owner' | 'cashier',
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    if (!password) {
      return { success: false, error: language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('[StoreContext] Supabase signInWithPassword error:', error);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const profile = await resolveUserProfile(data.user);

        // Zero-trust check: User MUST have a matching row in public.profiles with role 'owner' or 'cashier'
        if (!profile) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.USER);
          return {
            success: false,
            error:
              language === 'ar'
                ? 'الحساب غير مصرح له بالدخول: لم يتم العثور على دور مخصص لحسابك في قاعدة البيانات (public.profiles).'
                : 'Account not authorized: No valid role found in public.profiles. Access denied.',
          };
        }

        // Enforce role authorization:
        // 1. If logging into Owner portal, user must have 'owner' role in public.profiles
        if (targetRole === 'owner' && profile.role !== 'owner') {
          await supabase.auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.USER);
          return {
            success: false,
            error:
              language === 'ar'
                ? 'غير مصرح: حسابك مسجل بصلاحية كاشير (Cashier) ولا يملك إذن الوصول إلى لوحة تحكم المالك.'
                : 'Unauthorized: Your account role is "cashier" and cannot access the Owner dashboard.',
          };
        }

        // 2. If logging into Cashier portal, user must have 'cashier' OR 'owner' role
        if (targetRole === 'cashier' && profile.role !== 'cashier' && profile.role !== 'owner') {
          await supabase.auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.USER);
          return {
            success: false,
            error:
              language === 'ar'
                ? 'غير مصرح: ليس لديك صلاحية الوصول إلى نظام الكاشير.'
                : 'Unauthorized: You do not have permission to access the Cashier terminal.',
          };
        }

        setCurrentUser(profile);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));

        showToast(
          language === 'ar'
            ? `مرحباً بك، ${profile.name} (${profile.role === 'owner' ? 'المالك' : 'الكاشير'})`
            : `Welcome, ${profile.name} (${profile.role})`,
          'success'
        );
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      console.error('[StoreContext] Auth exception:', err);
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[StoreContext] Sign out error:', err);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
    handleSetActiveView('store');
  };

  // 10. Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        t,
        siteConfig,
        features,
        testimonials,
        faqs,
        contactMessages,
        contactInquiries,
        submitContactInquiry,
        submitContactMessage,
        deleteContactMessage,
        updateContactMessageStatus,
        newsletterSubscribers,
        subscribeNewsletter,
        deleteNewsletterSubscriber,
        products,
        lowStockProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        orders,
        dailyOrders,
        placeOrder,
        updateOrderStatus,
        activeReceiptOrder,
        setActiveReceiptOrder,
        expenses,
        dailyExpenses,
        addExpense,
        shiftReports,
        currentShiftId,
        endShiftAndReconcile,
        exportAndResetMonthlyData,
        currentUser,
        isAuthLoading,
        login,
        logout,
        toasts,
        showToast,
        dismissToast,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        activeView,
        setActiveView: handleSetActiveView,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
