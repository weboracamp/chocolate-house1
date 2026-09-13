import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { Product, CategoryType, OrderStatus } from '../types';
import { EXACT_CATEGORIES } from './CategoryFilter';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  Download,
  Plus,
  Edit2,
  Trash2,
  Search,
  LogOut,
  Sparkles,
  Award,
  Copy,
  Check,
  Printer,
  Receipt,
  Calendar,
  ExternalLink,
  Package,
  Layers,
  Mail,
  Users,
  MessageSquare,
  PhoneCall,
  Phone,
  Database,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const {
    language,
    t,
    products,
    lowStockProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    expenses,
    shiftReports,
    exportAndResetMonthlyData,
    refetchShiftReports,
    exportAndResetShiftReports,
    updateOrderStatus,
    setActiveReceiptOrder,
    currentUser,
    logout,
    setActiveView,
    showToast,
    contactMessages,
    deleteContactMessage,
    updateContactMessageStatus,
    newsletterSubscribers,
    deleteNewsletterSubscriber,
  } = useStore();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    'orders' | 'inventory' | 'financials' | 'shifts' | 'inquiries' | 'subscribers'
  >('orders');

  // Period filtering for orders ('daily' | 'monthly' | 'yearly')
  const [periodFilter, setPeriodFilter] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // Product Modal State (Add / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('Molten Cake');
  const [formStock, setFormStock] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);

  // Export Monthly Orders Modal Confirmation
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedSummary, setExportedSummary] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export Shift Reports Modal Confirmation
  const [isExportShiftsModalOpen, setIsExportShiftsModalOpen] = useState(false);
  const [exportedShiftsSummary, setExportedShiftsSummary] = useState<any>(null);
  const [isExportingShifts, setIsExportingShifts] = useState(false);
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Selected message for detail view
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  // Supabase SQL Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filter orders by period
  const now = new Date();
  const filteredOrders = orders.filter((order) => {
    if (order.is_archived && periodFilter === 'daily') return false;
    const orderDate = new Date(order.created_at);

    if (periodFilter === 'daily') {
      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    } else if (periodFilter === 'monthly') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    } else {
      return orderDate.getFullYear() === now.getFullYear();
    }
  }).filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q)
    );
  });

  // Current Month orders specifically for export and reset calculations
  const currentMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthRevenue = currentMonthOrders.reduce(
    (sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0),
    0
  );

  // Financial Calculations
  const nonCancelledOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);

  const totalDigitalSales = nonCancelledOrders
    .filter((o) => o.payment_method === 'instapay_wallet')
    .reduce((sum, o) => sum + o.total, 0);

  const totalCashSales = nonCancelledOrders
    .filter((o) => o.payment_method === 'cod')
    .reduce((sum, o) => sum + o.total, 0);

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = Math.max(0, totalRevenue - totalExpensesAmount);

  // Best seller calculation
  const productCountMap: Record<string, { product: Product; qty: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    o.items.forEach((item) => {
      const p = products.find((prod) => prod.id === item.product_id);
      if (p) {
        if (!productCountMap[p.id]) productCountMap[p.id] = { product: p, qty: 0 };
        productCountMap[p.id].qty += item.quantity;
      }
    });
  });

  const bestSellerItem = Object.values(productCountMap).sort((a, b) => b.qty - a.qty)[0];

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormNameEn('');
    setFormNameAr('');
    setFormDescEn('');
    setFormDescAr('');
    setFormPrice('');
    setFormDiscountPrice('');
    setFormCategory('Molten Cake');
    setFormStock('20');
    setFormImage('https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80');
    setFormIsBestSeller(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormNameEn(p.name_en);
    setFormNameAr(p.name_ar);
    setFormDescEn(p.description_en);
    setFormDescAr(p.description_ar);
    setFormPrice(p.price.toString());
    setFormDiscountPrice(p.discount_price ? p.discount_price.toString() : '');
    setFormCategory(p.category);
    setFormStock(p.stock.toString());
    setFormImage(p.image);
    setFormIsBestSeller(Boolean(p.is_best_seller));
    setIsProductModalOpen(true);
  };

  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formPrice);
    const stock = parseInt(formStock, 10);
    const discountPrice = formDiscountPrice ? parseFloat(formDiscountPrice) : undefined;

    if (!formNameEn.trim() || !formNameAr.trim() || isNaN(price) || isNaN(stock)) return;

    setIsSavingProduct(true);
    let success = false;
    try {
      if (editingProduct) {
        success = await updateProduct(editingProduct.id, {
          name_en: formNameEn.trim(),
          name_ar: formNameAr.trim(),
          description_en: formDescEn.trim(),
          description_ar: formDescAr.trim(),
          price,
          discount_price: discountPrice && discountPrice < price ? discountPrice : undefined,
          category: formCategory,
          stock,
          image: formImage.trim() || 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
          is_best_seller: formIsBestSeller,
        });
      } else {
        success = await addProduct({
          name_en: formNameEn.trim(),
          name_ar: formNameAr.trim(),
          description_en: formDescEn.trim(),
          description_ar: formDescAr.trim(),
          price,
          discount_price: discountPrice && discountPrice < price ? discountPrice : undefined,
          category: formCategory,
          stock,
          image: formImage.trim() || 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
          is_best_seller: formIsBestSeller,
        });
      }
    } catch (err) {
      console.error('Save product error:', err);
    } finally {
      setIsSavingProduct(false);
    }

    if (success) {
      setIsProductModalOpen(false);
    }
  };

  const handleExecuteExportAndReset = async () => {
    setIsExporting(true);
    try {
      const result = await exportAndResetMonthlyData();
      setExportedSummary(result);
    } catch (err) {
      console.error('Export and reset error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-refresh shift reports from Supabase when opening the shifts tab
  useEffect(() => {
    if (activeTab === 'shifts') {
      void refetchShiftReports(true);
    }
  }, [activeTab, refetchShiftReports]);

  const handleExecuteExportAndResetShifts = async () => {
    setIsExportingShifts(true);
    try {
      const result = await exportAndResetShiftReports();
      setExportedShiftsSummary(result);
    } catch (err) {
      console.error('Export shift reports error:', err);
    } finally {
      setIsExportingShifts(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4ECDF] text-[#2B140E] flex flex-col">
      {/* Owner Top Navigation */}
      <header
        className="w-full px-4 py-3 border-b flex items-center justify-between shadow-md"
        style={{
          backgroundColor: 'var(--color-chocolate)',
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
              <span>{t.ownerPortal}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1A0A06] font-bold">
                Admin
              </span>
            </h1>
            <p className="text-xs text-[#D4AF37]">
              {currentUser?.name || 'Ahmed Al-Sayed (Owner)'}
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView('store')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-[#F7E7A9] hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'المتجر العام' : 'Public Store'}</span>
          </button>

          {/* Switch to Cashier View for Owner */}
          <button
            onClick={() => setActiveView('cashier')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFBF5]/10 text-[#F7E7A9] hover:bg-white/20 transition-colors border border-[#D4AF37]/30"
            title="Switch to Cashier Terminal"
          >
            <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{language === 'ar' ? 'نظام الكاشير' : 'Cashier Terminal'}</span>
          </button>

          {/* Export & Reset CTA (Monthly Orders) */}
          <button
            id="owner-export-reset-btn"
            onClick={() => {
              setExportedSummary(null);
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
            }}
            title={language === 'ar' ? 'تصدير وأرشفة طلبات الشهر' : 'Export & Reset Monthly Orders'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportAndReset}</span>
          </button>

          {/* Export & Reset CTA (Shift Reports) */}
          <button
            id="owner-export-shifts-btn"
            onClick={() => {
              setExportedShiftsSummary(null);
              setIsExportShiftsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95 border border-[#D4AF37]/50"
            style={{
              background: 'linear-gradient(135deg, #2B140E 0%, #1A0A06 100%)',
              color: '#F7E7A9',
            }}
            title={language === 'ar' ? 'تصدير وتفريغ تقارير الورديات' : 'Export & Reset Shift Reports'}
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t.exportShifts}</span>
          </button>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900/30 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* 1. PROMINENT LOW STOCK ALERT (Strict Requirement: stock <= 15) */}
        {lowStockProducts.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-600 text-amber-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-amber-900">
                  {t.lowStockAlertTitle} ({lowStockProducts.length} {language === 'ar' ? 'أصناف' : 'items'})
                </h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  {lowStockProducts.length} {t.lowStockAlertDesc}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded-md bg-white/80 border border-amber-300 text-[11px] font-bold text-amber-900"
                    >
                      {language === 'ar' ? p.name_ar : p.name_en} ({p.stock} left)
                    </span>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <span className="text-[11px] font-bold text-amber-800 self-center">
                      +{lowStockProducts.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 transition-colors shrink-0 shadow-sm"
            >
              {language === 'ar' ? 'تعديل وتوريد المخزون' : 'Manage & Restock'}
            </button>
          </div>
        )}

        {/* 2. BEST SELLER HIGHLIGHT & FINANCIAL METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t.totalRevenue} ({periodFilter})
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#2B140E]">
                  {totalRevenue.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[#8C6212]">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {nonCancelledOrders.length} {language === 'ar' ? 'طلب مسجل' : 'completed orders'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#2B140E] text-[#D4AF37]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Digital Payments vs Cash breakdown */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Payment Breakdown
            </p>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>InstaPay:</span>
              </span>
              <span className="font-mono">{totalDigitalSales.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash:</span>
              </span>
              <span className="font-mono">{totalCashSales.toFixed(2)} EGP</span>
            </div>
          </div>

          {/* Operational Expenses */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t.totalExpenses}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-700">
                  {totalExpensesAmount.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-rose-600">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {expenses.length} {language === 'ar' ? 'مصروف مسجل' : 'cashier expenses'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Best Seller Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2B140E] to-[#442217] text-[#FFF5E1] border border-[#D4AF37]/40 shadow-sm flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block">
                {t.bestSellerBadge}
              </span>
              <h4 className="text-sm font-bold truncate mt-1">
                {bestSellerItem
                  ? language === 'ar'
                    ? bestSellerItem.product.name_ar
                    : bestSellerItem.product.name_en
                  : 'N/A'}
              </h4>
              <span className="text-xs text-[#F7E7A9] font-mono">
                {bestSellerItem ? `${bestSellerItem.qty} sold` : '0 orders'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shrink-0">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#D4AF37]/30 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
            }`}
          >
            <span>Order Management ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
            }`}
          >
            <span>{t.inventoryManagement} ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shifts'
                ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
            }`}
          >
            <span>{t.shiftAudits} ({shiftReports.length})</span>
          </button>

          <button
            id="owner-inquiries-tab"
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'inquiries'
                ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t.customerInquiriesTab} ({contactMessages.length})</span>
          </button>

          <button
            id="owner-subscribers-tab"
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'subscribers'
                ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t.newsletterSubscribersTab} ({newsletterSubscribers.length})</span>
          </button>
        </div>

        {/* 4. TAB 1: ORDER MANAGEMENT (Daily, Monthly, Yearly Filtering) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#D4AF37]/25">
              {/* Period Selector */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D4AF37] ml-1" />
                <span className="text-xs font-bold text-[#2B140E] pr-1">{t.filterPeriod}:</span>
                {(['daily', 'monthly', 'yearly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      periodFilter === p
                        ? 'bg-[#2B140E] text-[#F7E7A9]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t[p]}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, phone..."
                  className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D4AF37]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  {language === 'ar' ? 'لا توجد طلبات مطابقة للفترة المحددة' : 'No orders found for this period filter'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFFBF5] text-[#2B140E] border-b border-[#D4AF37]/20 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">Order #</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Customer & Phone</th>
                        <th className="p-3.5">Items</th>
                        <th className="p-3.5">Payment Details</th>
                        <th className="p-3.5">Total</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#2B140E]">
                            {order.order_number}
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="p-3.5 capitalize">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.order_type === 'on-site'
                                  ? 'bg-amber-100 text-amber-900'
                                  : order.order_type === 'pickup'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-purple-100 text-purple-900'
                              }`}
                            >
                              {order.order_type}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#2B140E]">{order.customer_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{order.customer_phone}</div>
                          </td>
                          <td className="p-3.5 text-[11px] max-w-[180px]">
                            {order.items.map((i, idx) => (
                              <div key={idx} className="truncate">
                                {i.quantity}× {language === 'ar' ? i.product_name_ar : i.product_name_en}
                              </div>
                            ))}
                          </td>
                          <td className="p-3.5 text-[11px]">
                            {order.payment_method === 'instapay_wallet' ? (
                              <div className="text-blue-800 font-bold">
                                <span>InstaPay</span>
                                <span className="block text-[10px] font-mono text-gray-500">
                                  From: {order.transfer_from_phone || 'N/A'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-emerald-800 font-bold">Cash (COD)</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-extrabold text-[#2B140E]">
                            {order.total} EGP
                          </td>
                          <td className="p-3.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                                order.status === 'completed'
                                  ? 'bg-green-50 text-green-800 border-green-300'
                                  : order.status === 'preparing'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-50 text-red-800 border-red-300'
                                  : 'bg-yellow-50 text-yellow-800 border-yellow-300'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setActiveReceiptOrder(order)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[#2B140E] hover:bg-gray-100"
                              title="Print receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. TAB 2: INVENTORY & STOCK MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2B140E] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D4AF37]" />
                <span>Active Menu Items ({products.length})</span>
              </h3>
              <button
                id="owner-add-product-btn"
                onClick={handleOpenAddProduct}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.addProduct}</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFFBF5] text-[#2B140E] border-b border-[#D4AF37]/20 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price & Discount</th>
                      <th className="p-3.5">Stock Level</th>
                      <th className="p-3.5">Badges</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const isLow = p.stock <= 15;
                      const hasDiscount = p.discount_price && p.discount_price < p.price;
                      return (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3.5 flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name_en}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-[#2B140E]">{p.name_en}</div>
                              <div className="text-[11px] text-gray-500" dir="rtl">{p.name_ar}</div>
                            </div>
                          </td>
                          <td className="p-3.5 font-medium text-gray-700">
                            {p.category}
                          </td>
                          <td className="p-3.5">
                            {hasDiscount ? (
                              <div>
                                <span className="font-bold text-[#2B140E]">{p.discount_price} EGP</span>
                                <span className="text-[10px] text-gray-400 line-through block">{p.price} EGP</span>
                              </div>
                            ) : (
                              <span className="font-bold text-[#2B140E]">{p.price} EGP</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
                                p.stock === 0
                                  ? 'bg-red-100 text-red-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3.5">
                            {p.is_best_seller && (
                              <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#8C6212] font-bold text-[10px] mr-1">
                                Best Seller
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                Discount
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* 6. TAB 3: SHIFT AUDITS & CASH DRAWER RECONCILIATIONS */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#2B140E] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.shiftAudits}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6212]">
                  {shiftReports.length}
                </span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchShiftReports(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#2B140E] border border-[#D4AF37]/30 hover:bg-amber-50/50 transition-colors shadow-xs"
                  title={language === 'ar' ? 'تحديث تقارير الورديات من قاعدة البيانات' : 'Refresh shift reports from database'}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#8C6212]" />
                  <span>{t.refreshShifts}</span>
                </button>

                <button
                  onClick={() => {
                    setExportedShiftsSummary(null);
                    setIsExportShiftsModalOpen(true);
                  }}
                  disabled={shiftReports.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    color: '#1A0A06',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.exportShifts}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
              {shiftReports.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  {language === 'ar' ? 'لا توجد تقارير ورديات مغلقة بعد' : 'No closed shift reports submitted yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFFBF5] text-[#2B140E] border-b border-[#D4AF37]/20 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">Shift #</th>
                        <th className="p-3.5">Cashier</th>
                        <th className="p-3.5">Orders</th>
                        <th className="p-3.5">Total Sales</th>
                        <th className="p-3.5">Cash / Digital</th>
                        <th className="p-3.5">{t.systemExpected}</th>
                        <th className="p-3.5">{t.cashierCounted}</th>
                        <th className="p-3.5">{t.variance}</th>
                        <th className="p-3.5">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shiftReports.map((sr) => (
                        <tr key={sr.id} className="hover:bg-amber-50/40">
                          <td className="p-3.5 font-mono font-bold">{sr.shift_number}</td>
                          <td className="p-3.5 font-semibold">{sr.cashier_name}</td>
                          <td className="p-3.5">{sr.total_orders_count}</td>
                          <td className="p-3.5 font-bold font-mono">{sr.total_sales.toFixed(2)} EGP</td>
                          <td className="p-3.5 text-[11px]">
                            <div>Cash: {sr.cash_sales} EGP</div>
                            <div className="text-blue-700">Digital: {sr.digital_sales} EGP</div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-gray-700">
                            {sr.system_expected_cash.toFixed(2)} EGP
                          </td>
                          <td className="p-3.5 font-mono font-bold text-[#2B140E]">
                            {sr.cashier_reported_cash.toFixed(2)} EGP
                          </td>
                          <td className="p-3.5 font-mono font-black">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                sr.discrepancy === 0
                                  ? 'bg-green-100 text-green-800'
                                  : sr.discrepancy > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sr.discrepancy >= 0 ? `+${sr.discrepancy}` : sr.discrepancy} EGP
                            </span>
                          </td>
                          <td className="p-3.5 text-[10px] text-gray-500">
                            {new Date(sr.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. TAB: CUSTOMER INQUIRIES & MESSAGES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D4AF37]/25 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2B140E] text-[#D4AF37]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#2B140E]">
                    {t.inquiriesTitle}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {contactMessages.length} {language === 'ar' ? 'رسالة واستفسار مسجل' : 'inquiries received from Contact Us page'}
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث بالاسم، الهاتف، الرسالة...' : 'Search inquiries by name, phone...'}
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden bg-[#FFFBF5]"
                />
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-xs">
              {contactMessages.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <Mail className="w-10 h-10 text-[#D4AF37]/40 mx-auto" />
                  <p className="text-xs font-semibold">{t.noInquiriesYet}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFFBF5] text-[#2B140E] border-b border-[#D4AF37]/20 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-3.5">{t.senderName}</th>
                        <th className="p-3.5">{t.senderPhone}</th>
                        <th className="p-3.5">{t.senderEmail}</th>
                        <th className="p-3.5">{t.messageSubject}</th>
                        <th className="p-3.5">{t.inquiryDate}</th>
                        <th className="p-3.5 text-right rtl:text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contactMessages
                        .filter((m) => {
                          if (!inquirySearch.trim()) return true;
                          const q = inquirySearch.toLowerCase();
                          return (
                            m.name.toLowerCase().includes(q) ||
                            m.phone.toLowerCase().includes(q) ||
                            (m.email && m.email.toLowerCase().includes(q)) ||
                            (m.subject && m.subject.toLowerCase().includes(q)) ||
                            m.message.toLowerCase().includes(q)
                          );
                        })
                        .map((msg) => (
                          <tr key={msg.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-3.5 whitespace-nowrap">
                              {msg.status === 'resolved' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {language === 'ar' ? 'تم الرد' : 'Resolved'}
                                </span>
                              ) : msg.status === 'read' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {language === 'ar' ? 'تمت القراءة' : 'Read'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  {language === 'ar' ? 'جديد' : 'New'}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-bold text-[#2B140E] whitespace-nowrap">
                              {msg.name}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span>{msg.phone}</span>
                                <a
                                  href={`tel:${msg.phone}`}
                                  className="p-1 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                                  title="Call"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 font-bold text-[10px]"
                                  title="WhatsApp"
                                >
                                  WA
                                </a>
                              </div>
                            </td>
                            <td className="p-3.5 text-gray-600 whitespace-nowrap">
                              {msg.email ? (
                                <a
                                  href={`mailto:${msg.email}`}
                                  className="hover:underline text-blue-700 font-mono"
                                >
                                  {msg.email}
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="p-3.5 max-w-xs truncate">
                              <div className="font-semibold text-[#2B140E] truncate">
                                {msg.subject || (language === 'ar' ? 'استفسار عام' : 'General Inquiry')}
                              </div>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {msg.message}
                              </p>
                            </td>
                            <td className="p-3.5 text-[10px] text-gray-500 whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right rtl:text-left whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    if (msg.status === 'new' && updateContactMessageStatus) {
                                      updateContactMessageStatus(msg.id, 'read');
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
                                >
                                  {language === 'ar' ? 'عرض' : 'View'}
                                </button>
                                <button
                                  onClick={() => deleteContactMessage(msg.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                  title={t.deleteRecord}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. TAB: NEWSLETTER SUBSCRIBERS */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D4AF37]/25 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2B140E] text-[#D4AF37]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#2B140E]">
                    {t.newsletterTitle}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {newsletterSubscribers.length} {language === 'ar' ? 'مشترك في القائمة البريدية' : 'registered subscribers'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث بالبريد...' : 'Search email...'}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden bg-[#FFFBF5]"
                  />
                </div>

                {/* Copy all emails button */}
                <button
                  onClick={() => {
                    const emails = newsletterSubscribers.map((s) => s.email).join(', ');
                    navigator.clipboard.writeText(emails);
                    setCopiedEmails(true);
                    showToast(language === 'ar' ? 'تم نسخ جميع الإيميلات إلى الحافظة' : 'Copied all emails to clipboard', 'success');
                    setTimeout(() => setCopiedEmails(false), 2000);
                  }}
                  disabled={newsletterSubscribers.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors shrink-0 disabled:opacity-50"
                >
                  {copiedEmails ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  <span>{copiedEmails ? 'Copied!' : language === 'ar' ? 'نسخ الكل' : 'Copy All'}</span>
                </button>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-xs">
              {newsletterSubscribers.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <Users className="w-10 h-10 text-[#D4AF37]/40 mx-auto" />
                  <p className="text-xs font-semibold">{t.noSubscribersYet}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFFBF5] text-[#2B140E] border-b border-[#D4AF37]/20 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5 w-12">#</th>
                        <th className="p-3.5">{t.senderEmail}</th>
                        <th className="p-3.5">{t.subscriptionDate}</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right rtl:text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {newsletterSubscribers
                        .filter((s) => {
                          if (!subscriberSearch.trim()) return true;
                          return s.email.toLowerCase().includes(subscriberSearch.toLowerCase());
                        })
                        .map((sub, idx) => (
                          <tr key={sub.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-3.5 font-mono text-gray-400">{idx + 1}</td>
                            <td className="p-3.5 font-bold font-mono text-[#2B140E]">
                              {sub.email}
                            </td>
                            <td className="p-3.5 text-[10px] text-gray-500">
                              {new Date(sub.created_at).toLocaleString()}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                {language === 'ar' ? 'نشط' : 'Active'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right rtl:text-left whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(sub.email);
                                    showToast(language === 'ar' ? 'تم نسخ البريد الإلكتروني' : 'Email copied', 'info');
                                  }}
                                  className="px-2 py-1 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                  title={t.copyEmail}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteNewsletterSubscriber(sub.id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                  title={t.deleteRecord}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: VIEW INQUIRY DETAILS */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-[#2B140E]">
                  {language === 'ar' ? 'تفاصيل رسالة العميل' : 'Customer Inquiry Details'}
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(selectedMessage.created_at).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FFFBF5] p-3 rounded-xl border border-[#D4AF37]/20">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">{t.senderName}:</span>
                  <span className="font-bold text-[#2B140E]">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">{t.senderPhone}:</span>
                  <span className="font-mono font-bold text-[#2B140E]">{selectedMessage.phone}</span>
                </div>
                {selectedMessage.email && (
                  <div className="col-span-2 pt-1 border-t border-gray-200">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">{t.senderEmail}:</span>
                    <span className="font-mono text-blue-700">{selectedMessage.email}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold mb-0.5">{t.messageSubject}:</span>
                <p className="font-bold text-sm text-[#2B140E]">
                  {selectedMessage.subject || (language === 'ar' ? 'استفسار عام' : 'General Inquiry')}
                </p>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">{t.messageContent}:</span>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedMessage.phone}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] text-white hover:bg-[#20b858]"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={() => {
                    const nextStatus = selectedMessage.status === 'resolved' ? 'read' : 'resolved';
                    updateContactMessageStatus(selectedMessage.id, nextStatus);
                    setSelectedMessage({ ...selectedMessage, status: nextStatus });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    selectedMessage.status === 'resolved'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                  }`}
                >
                  {selectedMessage.status === 'resolved'
                    ? (language === 'ar' ? 'تحديد كـ قيد المتابعة' : 'Mark as Pending')
                    : (language === 'ar' ? 'تحديد كـ تم الرد' : 'Mark as Replied')}
                </button>
                <button
                  onClick={() => {
                    deleteContactMessage(selectedMessage.id);
                    setSelectedMessage(null);
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200"
                  title={t.deleteRecord}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3
              className="text-lg font-bold text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              {editingProduct ? t.editProduct : t.addProduct}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Belgian Molten Cake"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Name (Arabic) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: مولتن كيك شوكولاتة"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B140E] block mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                >
                  {EXACT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Regular Price (EGP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Discount Price (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    placeholder="85"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B140E] block mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#2B140E] block mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={formDescAr}
                    onChange={(e) => setFormDescAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="best-seller-toggle"
                  checked={formIsBestSeller}
                  onChange={(e) => setFormIsBestSeller(e.target.checked)}
                  className="w-4 h-4 text-[#D4AF37] rounded-sm focus:ring-[#D4AF37]"
                />
                <label htmlFor="best-seller-toggle" className="text-xs font-bold text-[#2B140E]">
                  Mark as "Best Seller" Badge
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F7E7A9]" />
                      <span>{language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    t.saveProduct
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT & RESET CONFIRMATION */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            {!exportedSummary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#2B140E]">
                    <Download className="w-6 h-6 text-[#8C6212]" />
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-[#2B140E]"
                      style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
                    >
                      {t.exportConfirmTitle}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {t.exportConfirmDesc}
                </p>

                <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>Current Month Total Orders:</span>
                    <span className="font-bold">{currentMonthOrders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Month Gross Revenue:</span>
                    <span className="font-bold">{currentMonthRevenue.toFixed(2)} EGP</span>
                  </div>
                  <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'سيتم توليد ملف إكسيل (.xlsx) بثلاث صفحات (الطلبات، تفاصيل الأصناف، تقارير الورديات) وبدء التنزيل فوراً. وفقط بعد بدء التنزيل، سيتم حذف طلبات هذا الشهر نهائياً من قاعدة البيانات.'
                      : 'Generates a multi-sheet Excel (.xlsx) file (Orders, Order Items, Shifts Audit) and triggers download. Only after download begins, orders for this month will be permanently deleted from the database.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="owner-confirm-export-reset-btn"
                    onClick={handleExecuteExportAndReset}
                    disabled={isExporting}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black text-[#1A0A06] shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      isExporting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    }}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ التصدير والحذف...' : 'Generating & Resetting...'}</span>
                      </>
                    ) : (
                      language === 'ar' ? 'تنزيل إكسيل (.xlsx) وإعادة التعيين' : 'Download Excel (.xlsx) & Reset Month'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#2B140E]">
                  {language === 'ar' ? 'تم تنزيل الإكسيل وحذف بيانات الشهر بنجاح!' : 'Export Complete & Month Reset!'}
                </h3>
                <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 text-xs space-y-1.5 text-left">
                  <div className="flex justify-between">
                    <span>Exported & Deleted Orders:</span>
                    <span className="font-bold">{exportedSummary.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exported Sales:</span>
                    <span className="font-bold">{exportedSummary.totalSales.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t text-[#8C6212]">
                    <span>Best Seller:</span>
                    <span>
                      {exportedSummary.bestSeller ? exportedSummary.bestSeller.name_en : 'N/A'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsExportModalOpen(false);
                    setExportedSummary(null);
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
                >
                  {t.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: EXPORT & RESET SHIFT REPORTS CONFIRMATION */}
      {isExportShiftsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            {!exportedShiftsSummary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#2B140E]">
                    <Layers className="w-6 h-6 text-[#8C6212]" />
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-[#2B140E]"
                      style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
                    >
                      {t.exportShiftsConfirmTitle}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {t.exportShiftsConfirmDesc}
                </p>

                <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'إجمالي تقارير الورديات:' : 'Total Shift Reports:'}</span>
                    <span className="font-bold">{shiftReports.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'إجمالي مبيعات الورديات:' : 'Total Shift Sales:'}</span>
                    <span className="font-bold">
                      {shiftReports.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0).toFixed(2)} EGP
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'سيتم توليد ملف إكسيل (.xlsx) يحتوي على كافة تفاصيل الورديات (رقم الوردية، الكاشير، وقت البدء والانتهاء، إجمالي المبيعات، المقبوضات النقدية والرقمية، المصروفات، المتوقع بالنظام، المحصّل الفعلي، والفارق، والملاحظات). وفقط بعد بدء التنزيل بنجاح، سيتم حذف هذه السجلات نهائياً من قاعدة البيانات لتسريع النظام.'
                      : 'Generates a detailed Excel (.xlsx) file containing all shift records (shift number, cashier name, start/end times, total orders, sales, cash/digital breakdown, expenses, expected cash, counted cash, discrepancy, notes, and timestamps). Only after download begins, records will be permanently deleted from the database to optimize system performance.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsExportShiftsModalOpen(false)}
                    disabled={isExportingShifts}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    id="owner-confirm-export-shifts-btn"
                    onClick={handleExecuteExportAndResetShifts}
                    disabled={isExportingShifts || shiftReports.length === 0}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black text-[#1A0A06] shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      isExportingShifts || shiftReports.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    }}
                  >
                    {isExportingShifts ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ التصدير والحذف...' : 'Generating & Resetting...'}</span>
                      </>
                    ) : (
                      language === 'ar' ? 'تنزيل إكسيل (.xlsx) وإعادة تعيين الورديات' : 'Download Excel (.xlsx) & Reset Shifts'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#2B140E]">
                  {t.exportShiftsSuccessTitle}
                </h3>
                <div className="p-3.5 rounded-xl bg-[#FFFBF5] border border-[#D4AF37]/30 text-xs space-y-1.5 text-left">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'الورديات المصدرة والمحذوفة:' : 'Exported & Purged Shifts:'}</span>
                    <span className="font-bold">{exportedShiftsSummary.totalShifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'إجمالي المبيعات الموثقة:' : 'Total Documented Sales:'}</span>
                    <span className="font-bold">{exportedShiftsSummary.totalSales.toFixed(2)} EGP</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsExportShiftsModalOpen(false);
                    setExportedShiftsSummary(null);
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
                >
                  {t.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
