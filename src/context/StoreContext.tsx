import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Order,
  OrderItem,
  Expense,
  ShiftReport,
  UserProfile,
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
  deleteContactMessage: (id: string) => void;

  // Newsletter Subscribers
  newsletterSubscribers: NewsletterSubscriber[];
  subscribeNewsletter: (email: string) => Promise<boolean>;
  deleteNewsletterSubscriber: (id: string) => void;
  
  // Products
  products: Product[];
  lowStockProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
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
  login: (email: string, role: 'owner' | 'cashier', name?: string) => void;
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

  // Fetch initial records from Supabase if connected
  useEffect(() => {
    if (supabase) {
      const fetchInitialData = async () => {
        try {
          // Fetch contact messages
          const { data: messages, error: msgError } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
          if (!msgError && messages && messages.length > 0) {
            setContactMessages(messages);
          }
        } catch (err) {
          console.warn('Error loading contact_messages from Supabase:', err);
        }

        try {
          // Fetch newsletter subscribers
          const { data: subs, error: subError } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false });
          if (!subError && subs && subs.length > 0) {
            setNewsletterSubscribers(subs);
          }
        } catch (err) {
          console.warn('Error loading newsletter_subscribers from Supabase:', err);
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
    const newMessage: ContactMessage = {
      ...messageData,
      id: `msg-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: messageData.status || 'new',
    };

    setContactMessages((prev) => [newMessage, ...prev]);

    // Push to Supabase if configured
    if (supabase) {
      try {
        await supabase.from('contact_messages').insert({
          name: messageData.name,
          phone: messageData.phone,
          email: messageData.email || null,
          subject: messageData.subject || null,
          message: messageData.message,
          status: 'new',
        });
      } catch (err) {
        console.warn('Could not insert to Supabase contact_messages:', err);
      }
    }

    showToast(
      language === 'ar'
        ? 'شكراً لتواصلك معنا! تم استلام رسالتك وسنقوم بالرد عليك في أقرب وقت.'
        : 'Thank you for reaching out! Your message has been received and our team will respond shortly.',
      'success'
    );
    return true;
  };

  const deleteContactMessage = async (id: string) => {
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
    if (supabase) {
      try {
        await supabase.from('contact_messages').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete from Supabase contact_messages:', err);
      }
    }
    showToast(language === 'ar' ? 'تم حذف الرسالة' : 'Message deleted', 'info');
  };

  const subscribeNewsletter = async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      showToast(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email', 'error');
      return false;
    }

    // Check if already subscribed
    const existing = newsletterSubscribers.find((s) => s.email.toLowerCase() === trimmed);
    if (existing) {
      showToast(
        language === 'ar'
          ? 'هذا البريد الإلكتروني مسجل لدينا بالفعل!'
          : 'This email is already subscribed!',
        'info'
      );
      return true;
    }

    const newSubscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: trimmed,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setNewsletterSubscribers((prev) => [newSubscriber, ...prev]);

    if (supabase) {
      try {
        await supabase.from('newsletter_subscribers').insert({
          email: trimmed,
          is_active: true,
        });
      } catch (err) {
        console.warn('Could not insert to Supabase newsletter_subscribers:', err);
      }
    }

    showToast(
      language === 'ar'
        ? 'تم اشتراكك في النشرة البريدية بنجاح! ستصلك أحدث العروض والخصومات.'
        : 'Subscribed successfully! You will receive our latest offers and discounts.',
      'success'
    );
    return true;
  };

  const deleteNewsletterSubscriber = async (id: string) => {
    setNewsletterSubscribers((prev) => prev.filter((s) => s.id !== id));
    if (supabase) {
      try {
        await supabase.from('newsletter_subscribers').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete from Supabase newsletter_subscribers:', err);
      }
    }
    showToast(language === 'ar' ? 'تم حذف المشترك' : 'Subscriber deleted', 'info');
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
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  // Low stock products (stock <= 15)
  const lowStockProducts = products.filter((p) => p.stock <= 15);

  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [product, ...prev]);
    showToast(language === 'ar' ? 'تمت إضافة الصنف بنجاح' : 'Product added successfully', 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast(language === 'ar' ? 'تم تحديث بيانات الصنف' : 'Product updated successfully', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(language === 'ar' ? 'تم حذف الصنف' : 'Product deleted', 'info');
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

  // 9. Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const login = (email: string, role: 'owner' | 'cashier', name?: string) => {
    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      role,
      name: name || (role === 'owner' ? 'Store Manager' : 'Front Barista'),
    };
    setCurrentUser(profile);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    showToast(
      language === 'ar'
        ? `مرحباً بك، ${profile.name} (${role === 'owner' ? 'المالك' : 'الكاشير'})`
        : `Welcome, ${profile.name} (${role})`,
      'success'
    );
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
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
