import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { OrderStatus, Expense } from '../types';
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
} from 'lucide-react';

export const CashierDashboard: React.FC = () => {
  const {
    language,
    t,
    dailyOrders,
    dailyExpenses,
    addExpense,
    endShiftAndReconcile,
    updateOrderStatus,
    setActiveReceiptOrder,
    currentUser,
    logout,
    setActiveView,
  } = useStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'pos'>('orders');

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

  // Crucial requirement: Digital payments add to Total Revenue but do NOT add to physical drawer cash
  const expectedPhysicalDrawerCash = Math.max(0, cashOrdersSales - totalShiftExpenses);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amount) || amount <= 0) return;

    addExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount,
      notes: expNotes.trim() || undefined,
      cashier_name: currentUser?.name || 'Cashier Barista',
    });

    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    setIsExpenseModalOpen(false);
  };

  const handleEndShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const physicalAmount = parseFloat(physicalCashInput);
    if (isNaN(physicalAmount) || physicalAmount < 0) return;

    const report = endShiftAndReconcile(
      physicalAmount,
      currentUser?.name || 'Shift Cashier',
      shiftNotes.trim() || undefined
    );

    setShiftCompletedReport(report);
  };

  return (
    <div className="min-h-screen bg-[#F4ECDF] text-[#2B140E] flex flex-col">
      {/* Cashier Top Navigation Bar */}
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
              <span>{t.cashierPortal}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1A0A06] font-bold">
                Shift Terminal
              </span>
            </h1>
            <p className="text-xs text-[#D4AF37]">
              {currentUser?.name || 'Front Cashier'} • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Back to Public Menu */}
          <button
            onClick={() => setActiveView('store')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-[#F7E7A9] hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'عرض المتجر' : 'Public Store'}</span>
          </button>

          {/* End Shift CTA */}
          <button
            id="cashier-end-shift-btn"
            onClick={() => {
              setPhysicalCashInput('');
              setShiftNotes('');
              setShiftCompletedReport(null);
              setIsShiftModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.endShiftReset}</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900/30 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* 1. FINANCIAL TRACKING SUMMARY CARDS (Strict Business Logic) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t.totalRevenue}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#2B140E]">
                  {totalRevenue.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[#8C6212]">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {validDailyOrders.length} {language === 'ar' ? 'طلب اليوم' : 'orders today'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#2B140E] text-[#D4AF37]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Digital Payments (InstaPay / Wallets) */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t.digitalPayments}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-900">
                  {digitalOrdersSales.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-blue-700">{t.priceCurrency}</span>
              </div>
              <span className="text-[10px] text-blue-600 font-medium">
                {language === 'ar' ? 'مدفوعة عبر إنستاباي/المحافظ' : 'Direct to Bank / Wallet'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Cash Drawer Expected (Physical Cash Only minus Expenses) */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-md flex items-center justify-between relative overflow-hidden">
            <div>
              <p className="text-xs font-bold text-[#2B140E] uppercase tracking-wider flex items-center gap-1">
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
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Shift Expenses */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 2. TAB CONTROLS & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D4AF37]/30 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <span>{t.dailyOrders} ({dailyOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-[#2B140E] text-[#F7E7A9] shadow-md'
                  : 'bg-white text-[#2B140E] hover:bg-[#FFFBF5]'
              }`}
            >
              <span>{t.externalExpenses} ({dailyExpenses.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t.addExpense}</span>
          </button>
        </div>

        {/* 3. TAB 1: DAILY ORDERS STREAM */}
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
                    ? 'ستظهر هنا طلبات العملاء اللحظية والتوصيل بمجرد إرسالها.'
                    : 'Customer web orders and in-store orders will populate here live.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyOrders.map((order) => {
                  const isDigital = order.payment_method === 'instapay_wallet';
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-white border border-[#D4AF37]/25 shadow-sm space-y-3 flex flex-col justify-between"
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
                          <span className="text-[11px] text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
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
                      </div>

                      {/* Order Items Preview */}
                      <div className="text-xs space-y-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-gray-700 text-[11px]">
                            <span>
                              {i.quantity}× {language === 'ar' ? i.product_name_ar : i.product_name_en}
                            </span>
                            <span className="font-mono font-semibold">{i.total_price} EGP</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Verification pill & Total */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {isDigital ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <CreditCard className="w-3 h-3" />
                              <span>InstaPay ({order.transfer_from_phone})</span>
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

        {/* 4. TAB 2: EXPENSES LOG */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FFFBF5] border-b border-[#D4AF37]/20 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2B140E]">
                {t.externalExpenses}
              </h3>
              <span className="text-xs font-black text-rose-700">
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
                        <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 font-medium">
                          {exp.category.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span>{new Date(exp.created_at).toLocaleTimeString()}</span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-gray-400">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-black text-rose-700">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
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

      {/* MODAL 2: STRICT END SHIFT RECONCILIATION PROMPT (Crucial Business Logic) */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-5">
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
                    <span className="font-bold">{cashOrdersSales.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Minus Cash Expenses:</span>
                    <span className="font-bold">-{totalShiftExpenses.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-black text-[#2B140E]">
                    <span>{t.systemExpected}:</span>
                    <span className="text-[#8C6212]">{expectedPhysicalDrawerCash.toFixed(2)} EGP</span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    * Note: InstaPay/Digital payments ({digitalOrdersSales.toFixed(2)} EGP) are received electronically and excluded from drawer cash.
                  </p>
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
                    className="px-5 py-2.5 rounded-xl text-xs font-black text-[#1A0A06] transition-all shadow-md active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    }}
                  >
                    {t.confirmResetShift}
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
                    <span>System Expected Cash:</span>
                    <span className="font-bold">{shiftCompletedReport.system_expected_cash} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Counted by Cashier:</span>
                    <span className="font-bold">{shiftCompletedReport.cashier_reported_cash} EGP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-black">
                    <span>Variance / Discrepancy:</span>
                    <span
                      className={
                        shiftCompletedReport.discrepancy === 0
                          ? 'text-green-700'
                          : shiftCompletedReport.discrepancy > 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }
                    >
                      {shiftCompletedReport.discrepancy >= 0
                        ? `+${shiftCompletedReport.discrepancy} EGP`
                        : `${shiftCompletedReport.discrepancy} EGP`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
                >
                  {language === 'ar' ? 'تم - بدء الوردية التالية' : 'Done - Ready for Next Shift'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
