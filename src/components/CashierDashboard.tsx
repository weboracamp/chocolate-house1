import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { OrderStatus, Expense, Product, OrderType, PaymentMethod, SelectedAddon, CashierStaff } from '../types';
import { AuthModal } from './AuthModal';
import { ProductCustomizeModal } from './ProductCustomizeModal';
import {
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  Plus,
  RefreshCw,
  LogOut,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Printer,
  ShoppingBag,
  ExternalLink,
  Search,
  Package,
  Layers,
  Trash2,
  Minus,
  MapPin,
  Check,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Sliders,
  UserCheck,
  UserPlus,
  X,
  Sparkles,
  Globe,
} from 'lucide-react';

interface PosCartItem {
  id: string;
  product: Product;
  quantity: number;
  selected_addons?: SelectedAddon[];
  addon_total?: number;
  unit_price: number;
}

export const CashierDashboard: React.FC = () => {
  const {
    language,
    t,
    products,
    dailyOrders,
    dailyExpenses,
    placeOrder,
    addExpense,
    endShiftAndReconcile,
    updateOrderStatus,
    setActiveReceiptOrder,
    currentUser,
    isAuthLoading,
    logout,
    setActiveView,
    showToast,
    cashierStaffList,
    addCashierStaff,
  } = useStore();

  // Active Staff Selection State
  const [activeStaffName, setActiveStaffName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('chocolate_house_active_staff');
      if (saved) return saved;
    } catch {}
    const activeStaff = cashierStaffList?.find((s) => s.is_active !== false);
    return activeStaff?.name || currentUser?.name || 'Ahmed';
  });

  const [closingStaffName, setClosingStaffName] = useState<string>(activeStaffName);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffInput, setNewStaffInput] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Customization modal in POS
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const handleSelectStaff = (name: string) => {
    setActiveStaffName(name);
    setClosingStaffName(name);
    try {
      localStorage.setItem('chocolate_house_active_staff', name);
    } catch {}
    showToast(
      language === 'ar'
        ? `الكاشير المسؤول الآن: ${name}`
        : `Active cashier switched to: ${name}`,
      'info'
    );
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStaffInput.trim();
    if (!trimmed) return;
    setIsAddingStaff(true);
    try {
      const ok = await addCashierStaff(trimmed);
      if (ok) {
        handleSelectStaff(trimmed);
        setNewStaffInput('');
        setIsAddStaffModalOpen(false);
      }
    } finally {
      setIsAddingStaff(false);
    }
  };

  // 1. Strict Role & Auth Guard
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#1A0A06] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
        <p className="text-sm font-semibold text-[#F7E7A9]">
          {language === 'ar' ? 'جارٍ التحقق من صلاحيات الكاشير...' : 'Verifying cashier credentials...'}
        </p>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'cashier' && currentUser.role !== 'owner')) {
    return <AuthModal requiredRole="cashier" />;
  }

  // 2. Active Tab State: POS (New Order), Shift Orders, Menu & Stock (Read-Only), Shift Expenses
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'products' | 'expenses'>('pos');

  // POS Order Taking State
  const [posCart, setPosCart] = useState<PosCartItem[]>([]);
  const [posCategory, setPosCategory] = useState<string>('all');
  const [posSearch, setPosSearch] = useState<string>('');
  const [posOrderType, setPosOrderType] = useState<OrderType>('on-site');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('cod');
  const [posCustomerName, setPosCustomerName] = useState<string>('');
  const [posCustomerPhone, setPosCustomerPhone] = useState<string>('');
  const [posTableNumber, setPosTableNumber] = useState<string>('');
  const [posDeliveryAddress, setPosDeliveryAddress] = useState<string>('');
  const [posPickupTime, setPosPickupTime] = useState<string>('15-20 Mins');
  const [posTransferPhone, setPosTransferPhone] = useState<string>('');
  const [posNotes, setPosNotes] = useState<string>('');
  const [posErrors, setPosErrors] = useState<Record<string, string>>({});

  // Products (Read-Only) Tab Filter State
  const [prodSearch, setProdSearch] = useState<string>('');
  const [prodCategory, setProdCategory] = useState<string>('all');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('supplies');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // End Shift Reconcile Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftCompletedReport, setShiftCompletedReport] = useState<any>(null);
  const [isEndingShift, setIsEndingShift] = useState(false);

  // Financial Calculations for the Shift
  const validDailyOrders = dailyOrders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = validDailyOrders.reduce((sum, o) => sum + o.total, 0);

  const cashOrdersSales = validDailyOrders
    .filter((o) => o.payment_method === 'cod')
    .reduce((sum, o) => sum + o.total, 0);

  const digitalOrdersSales = validDailyOrders
    .filter((o) => o.payment_method === 'instapay_wallet')
    .reduce((sum, o) => sum + o.total, 0);

  const totalShiftExpenses = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expected Physical Drawer Cash: Cash Orders Sales - Cash Expenses (Digital payments excluded)
  const expectedPhysicalDrawerCash = Math.max(0, cashOrdersSales - totalShiftExpenses);

  // POS Helper Functions
  const handleAddToPosCart = (product: Product, selectedAddons: SelectedAddon[] = []) => {
    if (product.stock <= 0) {
      showToast(
        language === 'ar' ? 'هذا الصنف غير متوفر حالياً بالمخزون' : 'This item is currently out of stock',
        'warning'
      );
      return;
    }

    const basePrice = product.discount_price || product.price;
    const addonTotal = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const unitPrice = basePrice + addonTotal;

    const addonKey = selectedAddons.map((a) => a.id).sort().join('_');
    const itemId = `${product.id}_${addonKey}`;

    setPosCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(
            language === 'ar'
              ? `الكمية القصوى المتاحة بالمخزون هي ${product.stock}`
              : `Maximum available stock is ${product.stock}`,
            'warning'
          );
          return prev;
        }
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          quantity: 1,
          selected_addons: selectedAddons,
          addon_total: addonTotal,
          unit_price: unitPrice,
        },
      ];
    });
  };

  const handleUpdatePosQuantity = (itemId: string, delta: number) => {
    setPosCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              showToast(
                language === 'ar'
                  ? `الكمية القصوى المتاحة بالمخزون هي ${item.product.stock}`
                  : `Maximum available stock is ${item.product.stock}`,
                'warning'
              );
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[];
    });
  };

  const handleRemoveFromPosCart = (itemId: string) => {
    setPosCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const posSubtotal = posCart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const posDiscount = posCart.reduce((sum, item) => {
    if (item.product.discount_price && item.product.discount_price < item.product.price) {
      return sum + (item.product.price - item.product.discount_price) * item.quantity;
    }
    return sum;
  }, 0);

  const posDeliveryFee = posOrderType === 'delivery' ? 25 : 0;
  const posTotal = posSubtotal + posDeliveryFee;

  const handleCreatePosOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setPosErrors({});

    if (posCart.length === 0) {
      showToast(
        language === 'ar' ? 'يرجى اختيار صنف واحد على الأقل للطلب' : 'Please select at least one item for the order',
        'warning'
      );
      return;
    }

    const errors: Record<string, string> = {};

    const trimmedName = posCustomerName.trim() || (language === 'ar' ? 'عميل صالة' : 'Walk-in Guest');
    const trimmedPhone = posCustomerPhone.trim() || '01000000000';

    if (posOrderType === 'on-site' && !posTableNumber.trim()) {
      errors.tableNumber = language === 'ar' ? 'يرجى إدخال رقم الطاولة' : 'Please specify table number';
    }

    if (posOrderType === 'delivery' && !posDeliveryAddress.trim()) {
      errors.deliveryAddress = language === 'ar' ? 'يرجى إدخال عنوان التوصيل' : 'Delivery address is required';
    }

    if (Object.keys(errors).length > 0) {
      setPosErrors(errors);
      return;
    }

    const orderItems = posCart.map((item) => {
      return {
        product_id: item.product.id,
        product_name_en: item.product.name_en,
        product_name_ar: item.product.name_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        image: item.product.image,
        selected_addons: item.selected_addons || [],
        addon_total: item.addon_total || 0,
      };
    });

    const newOrder = placeOrder({
      order_type: posOrderType,
      customer_name: trimmedName,
      customer_phone: trimmedPhone,
      table_number: posOrderType === 'on-site' ? posTableNumber.trim() : undefined,
      delivery_address: posOrderType === 'delivery' ? posDeliveryAddress.trim() : undefined,
      pickup_time: posOrderType === 'pickup' ? posPickupTime : undefined,
      notes: posNotes.trim() ? `${posNotes.trim()} (Staff: ${activeStaffName})` : `(Staff: ${activeStaffName})`,
      payment_method: posPaymentMethod,
      transfer_from_phone: posPaymentMethod === 'instapay_wallet' ? posTransferPhone.trim() : undefined,
      amount_transferred: posPaymentMethod === 'instapay_wallet' ? posTotal : undefined,
      items: orderItems,
      subtotal: posSubtotal,
      delivery_fee: posDeliveryFee,
      discount_total: posDiscount,
      total: posTotal,
      is_archived: false,
      staff_name: activeStaffName,
    });

    if (newOrder) {
      // Clear POS state
      setPosCart([]);
      setPosTableNumber('');
      setPosDeliveryAddress('');
      setPosCustomerName('');
      setPosCustomerPhone('');
      setPosNotes('');
      setPosTransferPhone('');
    }
  };

  // Filtered Products for POS
  const filteredPosProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = posCategory === 'all' || p.category === posCategory;
      const q = posSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        p.name_ar.includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, posCategory, posSearch]);

  // Filtered Products for Read-Only Stock View
  const filteredStockProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = prodCategory === 'all' || p.category === prodCategory;
      const q = prodSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        p.name_ar.includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, prodCategory, prodSearch]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amount) || amount <= 0) return;

    addExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount,
      notes: expNotes.trim() || undefined,
      cashier_name: activeStaffName.trim() || currentUser?.name || 'Cashier',
    });

    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    setIsExpenseModalOpen(false);
  };

  const handleEndShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const physicalAmount = parseFloat(physicalCashInput);
    if (isNaN(physicalAmount) || physicalAmount < 0) return;

    const staffToAttribute = closingStaffName.trim() || activeStaffName.trim() || currentUser?.name || 'Cashier';

    setIsEndingShift(true);
    try {
      const report = await endShiftAndReconcile(
        physicalAmount,
        staffToAttribute,
        shiftNotes.trim() || undefined
      );
      setShiftCompletedReport(report);
    } catch (err) {
      console.error('Failed to end shift:', err);
    } finally {
      setIsEndingShift(false);
    }
  };

  const categoriesList = [
    { id: 'all', labelEn: 'All Categories', labelAr: 'جميع الأقسام' },
    { id: 'hot_chocolate', labelEn: 'Hot Chocolate', labelAr: 'الشوكولاتة الساخنة' },
    { id: 'molten_cakes', labelEn: 'Molten Cakes', labelAr: 'المولتن كيك' },
    { id: 'crepes_waffles', labelEn: 'Crepes & Waffles', labelAr: 'كريب ووافل' },
    { id: 'iced_beverages', labelEn: 'Iced Drinks', labelAr: 'المشروبات المثلجة' },
    { id: 'dessert_boxes', labelEn: 'Dessert Boxes', labelAr: 'علب وبوكسات الحلى' },
    { id: 'chocolate_bars', labelEn: 'Chocolate Bars', labelAr: 'ألواح الشوكولاتة' },
  ];

  return (
    <div className="min-h-screen bg-[#F4ECDF] text-[#2B140E] flex flex-col selection:bg-[#D4AF37] selection:text-[#1A0A06]">
      {/* 1. Header Bar */}
      <header
        className="w-full px-4 py-3 border-b flex items-center justify-between shadow-md"
        style={{
          backgroundColor: 'var(--color-chocolate, #2B140E)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <h1
              className="text-base sm:text-lg font-bold text-[#FFF5E1] flex items-center gap-2"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              <span>{t.cashierPortal}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1A0A06] font-bold">
                Shift Terminal
              </span>
            </h1>
            <p className="text-xs text-[#D4AF37]">
              {currentUser?.name || 'Cashier'} • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-end">
          {currentUser?.role === 'owner' && (
            <button
              onClick={() => setActiveView('owner')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold bg-[#FFFBF5]/10 text-[#F7E7A9] hover:bg-white/20 transition-colors border border-[#D4AF37]/30"
              title="Return to Owner Dashboard"
            >
              <span>{language === 'ar' ? 'لوحة المالك' : 'Owner Portal'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('store')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold bg-white/10 text-[#F7E7A9] hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'المتجر العام' : 'Public Store'}</span>
          </button>

          {/* Active Staff Attribution Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#D4AF37]/40 min-h-[36px]">
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#F7E7A9]/70 uppercase font-semibold leading-none">
                {language === 'ar' ? 'الكاشير المسؤول' : 'Staff On Duty'}
              </span>
              <select
                id="cashier-header-staff-select"
                value={activeStaffName}
                onChange={(e) => handleSelectStaff(e.target.value)}
                className="bg-transparent text-xs font-black text-white focus:outline-hidden cursor-pointer max-w-[90px] sm:max-w-[140px] truncate pr-1"
              >
                {cashierStaffList.filter((s) => s.is_active !== false).map((staff) => (
                  <option key={staff.id} value={staff.name} className="text-[#2B140E] bg-white">
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewStaffInput('');
                setIsAddStaffModalOpen(true);
              }}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/25 text-[#D4AF37] transition-colors"
              title={language === 'ar' ? 'إضافة اسم موظف جديد' : 'Add Cashier Name'}
              aria-label="Add Cashier Name"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* End Shift Reconciliation Button */}
          <button
            id="cashier-end-shift-btn"
            onClick={() => {
              setPhysicalCashInput('');
              setShiftNotes('');
              setClosingStaffName(activeStaffName);
              setShiftCompletedReport(null);
              setIsShiftModalOpen(true);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-black shadow-md transition-all active:scale-95 text-[#1A0A06]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t.endShiftReset}</span>
            <span className="sm:hidden text-[11px]">{language === 'ar' ? 'إغلاق وردية' : 'Shift Close'}</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-red-300 hover:text-white hover:bg-red-900/30 transition-colors"
            title={t.logout}
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Shift Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {t.totalRevenue}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#2B140E]">
                  {totalRevenue.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[#8C6212]">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {validDailyOrders.length} {language === 'ar' ? 'طلب بالوردية' : 'shift orders'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#2B140E] text-[#D4AF37]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Electronic Payments (InstaPay / Wallets) */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {t.digitalPayments}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-900">
                  {digitalOrdersSales.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-blue-700">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-blue-600 font-medium">
                {language === 'ar' ? 'محافظ / إنستاباي إلكترونية' : 'Bank / Wallet'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          {/* Expected Drawer Cash (Cash Only Minus Expenses) */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-xs flex items-center justify-between relative overflow-hidden">
            <div>
              <p className="text-[11px] font-bold text-[#2B140E] uppercase tracking-wider flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.cashDrawerExpected}</span>
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-800">
                  {expectedPhysicalDrawerCash.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-700">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-500 block leading-tight">
                {t.cashDrawerNote}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Shift Expenses */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {t.externalExpenses}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-700">
                  {totalShiftExpenses.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-rose-600">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {dailyExpenses.length} {language === 'ar' ? 'سجلات نثريات' : 'logged receipts'}
              </span>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              title={t.addExpense}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#D4AF37]/30 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap py-1">
            {/* 1. POS New Order Tab */}
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pos'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md ring-2 ring-[#D4AF37]'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'ar' ? 'إنشاء طلب جديد (POS)' : 'New Order (POS)'}</span>
              {posCart.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#1A0A06] text-[10px] font-black">
                  {posCart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* 2. Shift Orders Tab */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md ring-2 ring-[#D4AF37]'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.dailyOrders} ({dailyOrders.length})</span>
            </button>

            {/* 3. Products List (Read-Only) Tab */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md ring-2 ring-[#D4AF37]'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'ar' ? 'الأصناف والمخزون (للقراءة)' : 'Menu & Stock (Read-Only)'}</span>
            </button>

            {/* 4. Shift Expenses Tab */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md ring-2 ring-[#D4AF37]'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.externalExpenses} ({dailyExpenses.length})</span>
            </button>
          </div>

          {/* Quick Expense Action Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t.addExpense}</span>
          </button>
        </div>

        {/* TAB 1: POS / NEW ORDER TAKING TERMINAL */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Product Catalog Selection (7 Cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Filter and Search Bar */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/25 shadow-xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث سريع عن صنف...' : 'Quick search item...'}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/25 text-xs text-[#2B140E] placeholder-gray-400 focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPosCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        posCategory === cat.id
                          ? 'bg-[#2B140E] text-[#F7E7A9]'
                          : 'bg-[#FFFBF5] text-[#2B140E] hover:bg-gray-100 border border-[#D4AF37]/20'
                      }`}
                    >
                      {language === 'ar' ? cat.labelAr : cat.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredPosProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const price = product.discount_price || product.price;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && setCustomizingProduct(product)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-[#D4AF37]/25 hover:border-[#D4AF37] hover:shadow-md cursor-pointer active:scale-98'
                      }`}
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="w-full h-24 rounded-xl overflow-hidden bg-[#2B140E]/5 mb-2 relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name_en}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          {/* Stock Pill Badge */}
                          <div className="absolute top-1.5 right-1.5">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? 'bg-rose-600 text-white'
                                  : product.stock <= 10
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isOutOfStock
                                ? language === 'ar' ? 'نفد' : 'Out'
                                : `${product.stock} ${language === 'ar' ? 'متاح' : 'left'}`}
                            </span>
                          </div>
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs font-bold text-[#2B140E] line-clamp-1">
                          {language === 'ar' ? product.name_ar : product.name_en}
                        </h4>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {product.category.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Price & Action Buttons */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-[#2B140E]">
                            {price}
                          </span>
                          <span className="text-[10px] text-[#8C6212] font-bold">EGP</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick standard add */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) handleAddToPosCart(product);
                            }}
                            title={language === 'ar' ? 'إضافة سريعة بدون إضافات' : 'Quick Add Standard'}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-[#D4AF37]/30 text-[#2B140E] flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {/* Customize with sizes & add-ons */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) setCustomizingProduct(product);
                            }}
                            title={language === 'ar' ? 'تخصيص الحجم والإضافات' : 'Customize Size & Add-ons'}
                            className="px-2 py-1 rounded-lg bg-[#2B140E] text-[#F7E7A9] text-[10px] font-bold flex items-center gap-0.5 hover:bg-[#1A0A06] transition-colors"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                            <span>{language === 'ar' ? 'خيارات' : 'Add-ons'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPosProducts.length === 0 && (
                <div className="p-8 rounded-2xl bg-white border border-[#D4AF37]/20 text-center text-xs text-gray-500">
                  {language === 'ar' ? 'لا توجد منتجات تطابق البحث' : 'No items match your search'}
                </div>
              )}
            </div>

            {/* Right: Active Order Ticket & Checkout (5 Cols on desktop) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-[#D4AF37]/40 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2B140E] text-[#D4AF37]">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2B140E]">
                      {language === 'ar' ? 'تذكرة الطلب الحالي' : 'Active Order Ticket'}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {posCart.length} {language === 'ar' ? 'أصناف محددة' : 'items selected'}
                    </p>
                  </div>
                </div>

                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPosCart([])}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    {language === 'ar' ? 'إفراغ السلة' : 'Clear Ticket'}
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {posCart.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 space-y-1">
                    <ShoppingBag className="w-8 h-8 mx-auto opacity-30 text-[#D4AF37]" />
                    <p className="text-xs">
                      {language === 'ar' ? 'انقر على الأصناف من القائمة لإضافتها للطلب' : 'Click items from menu to add to ticket'}
                    </p>
                  </div>
                ) : (
                  posCart.map((item) => {
                    const unitPrice = item.unit_price || (item.product.discount_price || item.product.price);
                    const itemTotal = unitPrice * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/25 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2B140E] truncate">
                            {language === 'ar' ? item.product.name_ar : item.product.name_en}
                          </p>
                          {item.selected_addons && item.selected_addons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selected_addons.map((a) => (
                                <span
                                  key={a.id}
                                  className="text-[9px] font-semibold bg-[#2B140E]/5 text-[#2B140E] px-1.5 py-0.5 rounded border border-[#D4AF37]/30"
                                >
                                  {language === 'ar' ? a.name_ar : a.name_en}
                                  {a.price > 0 && ` (+${a.price})`}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-[#8C6212] font-semibold font-mono mt-0.5">
                            {unitPrice} EGP
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdatePosQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#2B140E] flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePosQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-[#2B140E] hover:bg-[#1A0A06] text-[#F7E7A9] flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black text-[#2B140E] w-14 text-right">
                            {itemTotal} EGP
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromPosCart(item.id)}
                            className="text-gray-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Active Cashier Staff Attribution Banner */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FFFBF5] to-amber-50/60 border border-[#D4AF37]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#2B140E] text-[#D4AF37]">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block leading-tight font-medium">
                      {language === 'ar' ? 'منشئ الطلب (الكاشير الحالي):' : 'Order Attributed To:'}
                    </span>
                    <span className="text-xs font-black text-[#2B140E]">
                      {activeStaffName}
                    </span>
                  </div>
                </div>
                <select
                  value={activeStaffName}
                  onChange={(e) => handleSelectStaff(e.target.value)}
                  className="text-[11px] font-bold text-[#8C6212] bg-white px-2 py-1 rounded-lg border border-[#D4AF37]/30 focus:outline-hidden"
                >
                  {cashierStaffList.filter((s) => s.is_active !== false).map((staff) => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Form Settings */}
              <form onSubmit={handleCreatePosOrder} className="space-y-3 pt-2 border-t border-gray-100">
                {/* 1. Order Type Switcher */}
                <div>
                  <label className="text-[11px] font-bold text-[#2B140E] block mb-1">
                    {language === 'ar' ? 'نوع الطلب' : 'Order Type'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPosOrderType('on-site')}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        posOrderType === 'on-site'
                          ? 'bg-[#2B140E] text-[#F7E7A9]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.onSite}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosOrderType('pickup')}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        posOrderType === 'pickup'
                          ? 'bg-[#2B140E] text-[#F7E7A9]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.pickup}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosOrderType('delivery')}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        posOrderType === 'delivery'
                          ? 'bg-[#2B140E] text-[#F7E7A9]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.delivery}
                    </button>
                  </div>
                </div>

                {/* Conditional fields based on order type */}
                {posOrderType === 'on-site' && (
                  <div>
                    <label className="text-[11px] font-bold text-[#2B140E] block mb-1">
                      {t.tableNumber} *
                    </label>
                    <input
                      type="text"
                      required
                      value={posTableNumber}
                      onChange={(e) => setPosTableNumber(e.target.value)}
                      placeholder={language === 'ar' ? 'رقم الطاولة (مثال: T-4)' : 'Table # (e.g. T-4)'}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                    />
                    {posErrors.tableNumber && (
                      <p className="text-[10px] text-rose-600 mt-0.5">{posErrors.tableNumber}</p>
                    )}
                  </div>
                )}

                {posOrderType === 'delivery' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#2B140E] block mb-1">
                        {language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={posDeliveryAddress}
                        onChange={(e) => setPosDeliveryAddress(e.target.value)}
                        placeholder={language === 'ar' ? 'الشارع، رقم العمارة، علامة مميزة' : 'Street, building, landmark'}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                      />
                      {posErrors.deliveryAddress && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{posErrors.deliveryAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                    </label>
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder={language === 'ar' ? 'عميل صالة' : 'Walk-in'}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-mono focus:border-[#D4AF37] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Payment Method Switcher */}
                <div>
                  <label className="text-[11px] font-bold text-[#2B140E] block mb-1">
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('cod')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        posPaymentMethod === 'cod'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'نقداً (كاش)' : 'Cash'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('instapay_wallet')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        posPaymentMethod === 'instapay_wallet'
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إنستاباي / محفظة' : 'InstaPay'}</span>
                    </button>
                  </div>
                </div>

                {posPaymentMethod === 'instapay_wallet' && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      {language === 'ar' ? 'رقم المحول منه' : 'Sender Phone / InstaPay ID'}
                    </label>
                    <input
                      type="text"
                      value={posTransferPhone}
                      onChange={(e) => setPosTransferPhone(e.target.value)}
                      placeholder="01113116242"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-mono focus:border-[#D4AF37] focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">
                    {language === 'ar' ? 'ملاحظات التحضير' : 'Preparation Notes'}
                  </label>
                  <input
                    type="text"
                    value={posNotes}
                    onChange={(e) => setPosNotes(e.target.value)}
                    placeholder={language === 'ar' ? 'سكر خفيف، بدون كريمة...' : 'Less sugar, extra hot...'}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>

                {/* Calculation Summary */}
                <div className="p-3 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>{t.subtotal}:</span>
                    <span className="font-mono font-bold">{posSubtotal} EGP</span>
                  </div>
                  {posDeliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{t.deliveryFee}:</span>
                      <span className="font-mono font-bold">{posDeliveryFee} EGP</span>
                    </div>
                  )}
                  {posDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{t.discountTotal}:</span>
                      <span className="font-mono font-bold">-{posDiscount} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[#D4AF37]/20 font-black text-sm text-[#2B140E]">
                    <span>{t.total}:</span>
                    <span className="text-[#8C6212] font-mono">{posTotal} EGP</span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={posCart.length === 0}
                  className="w-full py-3 rounded-2xl text-xs font-black transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[#1A0A06]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  }}
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تأكيد الطلب وطباعة الإيصال' : 'Confirm Order & Print Receipt'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: SHIFT ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {dailyOrders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#D4AF37]/20 text-center space-y-2">
                <Receipt className="w-12 h-12 text-[#D4AF37] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[#2B140E]">
                  {language === 'ar' ? 'لا توجد طلبات في وردية اليوم بعد' : 'No shift orders yet today'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'ستظهر هنا طلبات العملاء اللحظية ونظام الكاشير بمجرد إرسالها.'
                    : 'Customer web orders and POS orders will populate here live.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyOrders.map((order) => {
                  const isDigital = order.payment_method === 'instapay_wallet';
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-white border border-[#D4AF37]/25 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#2B140E]">
                              {order.order_number}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                order.order_type === 'on-site'
                                  ? 'bg-amber-100 text-amber-900'
                                  : order.order_type === 'pickup'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-purple-100 text-purple-900'
                              }`}
                            >
                              {order.order_type === 'on-site'
                                ? t.onSite
                                : order.order_type === 'pickup'
                                ? t.pickup
                                : t.delivery}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {order.staff_name ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2B140E] bg-[#D4AF37]/20 px-2 py-0.2 rounded-md border border-[#D4AF37]/35">
                                <UserCheck className="w-2.5 h-2.5 text-[#8C6212]" />
                                <span>{order.staff_name}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                <Globe className="w-2.5 h-2.5 text-gray-500" />
                                <span>{language === 'ar' ? 'أونلاين' : 'Online'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden ${
                            order.status === 'completed'
                              ? 'bg-green-50 text-green-800 border-green-300'
                              : order.status === 'preparing'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-yellow-50 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          <option value="pending">{t.pending}</option>
                          <option value="preparing">{t.preparing}</option>
                          <option value="completed">{t.completed}</option>
                          <option value="cancelled">{t.cancelled}</option>
                        </select>
                      </div>

                      {/* Customer Info */}
                      <div className="text-xs space-y-1 bg-[#FFFBF5] p-2.5 rounded-xl border border-[#D4AF37]/15">
                        <div className="flex items-center gap-1.5 font-semibold text-[#2B140E]">
                          <User className="w-3 h-3 text-[#D4AF37]" />
                          <span>{order.customer_name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-mono">{order.customer_phone}</span>
                        </div>
                        {order.table_number && (
                          <p className="text-[11px] text-[#8C6212] font-bold">
                            {t.tableNumber}: {order.table_number}
                          </p>
                        )}
                        {order.delivery_address && (
                          <p className="text-[11px] text-gray-600 line-clamp-1">
                            {order.delivery_address}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-[10px] text-gray-500 italic">
                            {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Order Items Preview */}
                      <div className="text-xs space-y-1.5">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="text-gray-700 text-[11px]">
                            <div className="flex justify-between">
                              <span className="font-semibold">
                                {i.quantity}× {language === 'ar' ? i.product_name_ar : i.product_name_en}
                              </span>
                              <span className="font-mono font-semibold">{i.total_price} EGP</span>
                            </div>
                            {i.selected_addons && i.selected_addons.length > 0 && (
                              <div className="text-[10px] text-[#8C6212] flex flex-wrap gap-1 mt-0.5">
                                {i.selected_addons.map((a) => (
                                  <span key={a.id} className="bg-amber-50 px-1 rounded border border-amber-200">
                                    +{language === 'ar' ? a.name_ar : a.name_en}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Payment Verification pill & Total */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {isDigital ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <CreditCard className="w-3 h-3" />
                              <span>InstaPay ({order.transfer_from_phone || 'Verified'})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Banknote className="w-3 h-3" />
                              <span>COD Cash</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#2B140E]">
                            {order.total} {t.priceCurrency}
                          </span>
                          <button
                            onClick={() => setActiveReceiptOrder(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#2B140E] hover:bg-gray-100 transition-colors"
                            title="Print thermal receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS & STOCK LIST (STRICTLY READ-ONLY) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#D4AF37]/40 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#8C6212]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2B140E]">
                  {language === 'ar' ? 'قائمة الأصناف والمخزون المتاح (عرض فقط)' : 'Products Catalog & Available Stock (Read-Only)'}
                </p>
                <p className="text-[11px] text-gray-600">
                  {language === 'ar'
                    ? 'يمكن للكاشير الاطلاع على الأصناف والأسعار والمخزون الحالي. صلاحيات الإضافة والتعديل والحذف مقصورة حصرياً على المالك.'
                    : 'Cashiers can view products, pricing, and live inventory. Adding, editing, and deleting items is restricted to the Owner.'}
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/25 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث عن صنف...' : 'Search items...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/25 text-xs text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setProdCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      prodCategory === cat.id
                        ? 'bg-[#2B140E] text-[#F7E7A9]'
                        : 'bg-[#FFFBF5] text-[#2B140E] hover:bg-gray-100 border border-[#D4AF37]/20'
                    }`}
                  >
                    {language === 'ar' ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Read-Only Products Table/List */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFFBF5] text-gray-600 border-b border-[#D4AF37]/20">
                    <tr>
                      <th className="p-3 font-bold">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'القسم' : 'Category'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'المخزون الحالي' : 'Live Stock'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStockProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock > 0 && p.stock <= 10;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name_en}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[#2B140E]">{p.name_ar}</p>
                                <p className="text-[11px] text-gray-500">{p.name_en}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 capitalize text-gray-600">
                            {p.category.replace('_', ' ')}
                          </td>
                          <td className="p-3 font-mono font-bold">
                            {p.discount_price ? (
                              <div>
                                <span className="text-emerald-700">{p.discount_price} EGP</span>
                                <span className="text-gray-400 line-through text-[10px] ml-1.5">
                                  {p.price} EGP
                                </span>
                              </div>
                            ) : (
                              <span>{p.price} EGP</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-sm">
                            {p.stock}
                          </td>
                          <td className="p-3">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3 h-3" />
                                <span>{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" />
                                <span>{language === 'ar' ? 'متوفر' : 'In Stock'}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SHIFT EXPENSES LOG */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FFFBF5] border-b border-[#D4AF37]/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#2B140E]">
                  {t.externalExpenses}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {language === 'ar' ? 'مصاريف ونثريات الوردية الحالية' : 'Expenses logged in current shift'}
                </p>
              </div>
              <span className="text-xs font-black text-rose-700 font-mono">
                Total: {totalShiftExpenses.toFixed(2)} {t.priceCurrency}
              </span>
            </div>

            {dailyExpenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                {language === 'ar' ? 'لا توجد مصاريف مسجلة خلال هذه الوردية' : 'No expenses logged during this shift'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dailyExpenses.map((exp) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h4 className="text-sm font-bold text-[#2B140E]">{exp.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 font-medium text-[10px]">
                          {exp.category.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">{new Date(exp.created_at).toLocaleTimeString()}</span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-gray-400 text-[11px]">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-black text-rose-700 font-mono">
                      -{exp.amount} {t.priceCurrency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="w-full max-w-[95vw] sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3
              className="text-lg font-bold text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              {t.addExpense}
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2B140E] block mb-1">
                  {t.expenseTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: شراء ثلج، حليب إضافي، أدوات نظافة' : 'e.g. Extra milk, ice supply'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    {t.expenseCategory}
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  >
                    <option value="supplies">Supplies / Raw Materials</option>
                    <option value="dairy_beverages">Dairy & Milk</option>
                    <option value="packaging">Packaging & Cups</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="petty_cash">Petty Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    {t.expenseAmount} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B140E] block mb-1">
                  {t.expenseNotes}
                </label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Receipt # / Vendor name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors"
                >
                  {t.saveExpense}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STRICT END SHIFT RECONCILIATION PROMPT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="w-full max-w-[95vw] sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#D4AF37]/40 space-y-5 max-h-[90vh] overflow-y-auto">
            {!shiftCompletedReport ? (
              <form onSubmit={handleEndShiftSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#2B140E]">
                    <Banknote className="w-6 h-6 text-[#8C6212]" />
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-[#2B140E]"
                      style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
                    >
                      {t.enterPhysicalCashPrompt}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t.enterPhysicalCashSub}
                    </p>
                  </div>
                </div>

                {/* Expected physical summary */}
                <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Shift Cash Orders Sales:</span>
                    <span className="font-bold font-mono">{cashOrdersSales.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Minus Cash Expenses:</span>
                    <span className="font-bold font-mono">-{totalShiftExpenses.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-black text-[#2B140E]">
                    <span>{t.systemExpected}:</span>
                    <span className="text-[#8C6212] font-mono">{expectedPhysicalDrawerCash.toFixed(2)} EGP</span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    * Note: InstaPay/Digital payments ({digitalOrdersSales.toFixed(2)} EGP) are received electronically and excluded from drawer cash.
                  </p>
                </div>

                {/* Cashier Attributed to Closing the Shift */}
                <div>
                  <label className="text-xs font-black text-[#2B140E] block mb-1.5 uppercase">
                    {language === 'ar' ? 'الموظف المسؤول عن إغلاق الوردية *' : 'Staff Closing Shift *'}
                  </label>
                  <div className="relative">
                    <select
                      id="cashier-shift-closing-staff"
                      value={closingStaffName}
                      onChange={(e) => setClosingStaffName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#D4AF37]/50 bg-[#FFFBF5] text-xs font-black text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37]"
                    >
                      {cashierStaffList.filter((s) => s.is_active !== false).map((staff) => (
                        <option key={staff.id} value={staff.name}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Physical Cash Input (MUST BE FILLED BY CASHIER) */}
                <div>
                  <label className="text-xs font-black text-[#2B140E] block mb-1.5 uppercase">
                    {t.physicalCashAmount} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      id="cashier-physical-cash-input"
                      value={physicalCashInput}
                      onChange={(e) => setPhysicalCashInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#D4AF37] bg-white text-base font-black text-[#2B140E] font-mono focus:outline-hidden focus:ring-3 focus:ring-[#D4AF37]/30"
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-[#D4AF37]">
                      {t.priceCurrency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Shift Closing Notes
                  </label>
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="e.g. Left 200 EGP float coins for morning shift"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                  >
                    {t.close}
                  </button>
                  <button
                    type="submit"
                    id="submit-end-shift-btn"
                    disabled={isEndingShift}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black text-[#1A0A06] transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                      isEndingShift ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    }}
                  >
                    {isEndingShift ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ الأرشفة والإغلاق...' : 'Archiving & Closing...'}</span>
                      </>
                    ) : (
                      t.confirmResetShift
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success report screen */
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#2B140E]">
                  {t.shiftReportSaved}
                </h3>

                <div className="p-4 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span>Shift #:</span>
                    <span className="font-mono font-bold">{shiftCompletedReport.shift_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold">{shiftCompletedReport.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Expected Cash:</span>
                    <span className="font-mono font-bold">{shiftCompletedReport.system_expected_cash} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Counted by Cashier:</span>
                    <span className="font-mono font-bold">{shiftCompletedReport.cashier_reported_cash} EGP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-black">
                    <span>Variance / Discrepancy:</span>
                    <span
                      className={
                        shiftCompletedReport.discrepancy === 0
                          ? 'text-green-700 font-mono'
                          : shiftCompletedReport.discrepancy > 0
                          ? 'text-blue-700 font-mono'
                          : 'text-rose-700 font-mono'
                      }
                    >
                      {shiftCompletedReport.discrepancy >= 0
                        ? `+${shiftCompletedReport.discrepancy} EGP`
                        : `${shiftCompletedReport.discrepancy} EGP`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsShiftModalOpen(false);
                    setShiftCompletedReport(null);
                    setPhysicalCashInput('');
                    setShiftNotes('');
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
                >
                  {language === 'ar' ? 'تم - إغلاق وتحديث الوردية' : 'Done - Ready for Next Shift'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCT CUSTOMIZATION (SIZES & ADD-ONS FOR POS) */}
      {customizingProduct && (
        <ProductCustomizeModal
          product={customizingProduct}
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={(product, quantity, selectedAddons) => {
            for (let i = 0; i < quantity; i++) {
              handleAddToPosCart(product, selectedAddons);
            }
            setCustomizingProduct(null);
          }}
          confirmButtonText={language === 'ar' ? 'إضافة للطلب' : 'Add to Ticket'}
        />
      )}

      {/* MODAL 4: QUICK ADD CASHIER STAFF */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="w-full max-w-[95vw] sm:max-w-sm bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#2B140E] text-[#D4AF37]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-[#2B140E]">
                  {language === 'ar' ? 'إضافة موظف كاشير جديد' : 'Add New Cashier Staff'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#2B140E] block mb-1">
                  {language === 'ar' ? 'اسم الموظف' : 'Staff Member Name'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStaffInput}
                  onChange={(e) => setNewStaffInput(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: محمود أو ياسمين' : 'e.g. Mahmoud or Yasmin'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={isAddingStaff || !newStaffInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAddingStaff ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                  <span>{language === 'ar' ? 'إضافة وتعيين حالياً' : 'Add & Set Active'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
