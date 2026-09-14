import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderType, PaymentMethod } from '../types';
import {
  X,
  Store,
  ShoppingBag,
  Truck,
  CreditCard,
  Banknote,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    language,
    t,
    cart,
    cartTotal,
    cartDiscount,
    isCheckoutOpen,
    setIsCheckoutOpen,
    placeOrder,
  } = useStore();

  // Form State
  const [orderType, setOrderType] = useState<OrderType>('on-site');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('15-20 Mins');
  const [orderNotes, setOrderNotes] = useState('');

  // Digital Payment Required Fields
  const [transferFromPhone, setTransferFromPhone] = useState('');
  const [amountTransferred, setAmountTransferred] = useState<string>(cartTotal.toString());
  const [copiedInstaPay, setCopiedInstaPay] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  // When order type changes to 'pickup', auto-switch payment method to 'instapay_wallet'
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'pickup') {
      setPaymentMethod('instapay_wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInstaPay(true);
    setTimeout(() => setCopiedInstaPay(false), 2000);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!customerName.trim()) {
      errs.customerName = language === 'ar' ? 'يرجى إدخال اسم العميل' : 'Please enter customer name';
    }

    if (!customerPhone.trim() || customerPhone.length < 9) {
      errs.customerPhone = language === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number';
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      errs.deliveryAddress = language === 'ar' ? 'يرجى إدخال عنوان التوصيل بالتفصيل' : 'Please enter full delivery address';
    }

    // STRICT CHECK FOR PICKUP: COD must NOT be used
    if (orderType === 'pickup' && paymentMethod === 'cod') {
      errs.paymentMethod = language === 'ar'
        ? 'الدفع عند الاستلام غير متاح لطلبات الاستلام. يلزم التحويل الرقمي.'
        : 'Cash on Arrival is disabled for Pickup orders.';
    }

    // STRICT CHECK FOR DIGITAL PAYMENT: transferFrom and amountTransferred are required
    if (paymentMethod === 'instapay_wallet') {
      if (!transferFromPhone.trim() || transferFromPhone.length < 8) {
        errs.transferFromPhone = language === 'ar'
          ? 'يرجى إدخال رقم الهاتف المحول منه (المحفظة / إنستاباي)'
          : 'Please enter sender phone number';
      }
      if (!amountTransferred || parseFloat(amountTransferred) <= 0) {
        errs.amountTransferred = language === 'ar'
          ? 'يرجى إدخال المبلغ المحول'
          : 'Please enter transferred amount';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const deliveryFee = orderType === 'delivery' ? 15 : 0;
    const finalTotal = cartTotal + deliveryFee;

    const orderData = {
      order_type: orderType,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      table_number: orderType === 'on-site' ? tableNumber.trim() : undefined,
      delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
      pickup_time: orderType === 'pickup' ? pickupTime : undefined,
      notes: orderNotes.trim() || undefined,
      payment_method: paymentMethod,
      transfer_from_phone: paymentMethod === 'instapay_wallet' ? transferFromPhone.trim() : undefined,
      amount_transferred:
        paymentMethod === 'instapay_wallet' ? parseFloat(amountTransferred) || finalTotal : undefined,
      items: cart.map((i) => ({
        product_id: i.product_id,
        product_name_en: i.product_name_en,
        product_name_ar: i.product_name_ar,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        image: i.image,
      })),
      subtotal: cartTotal,
      delivery_fee: deliveryFee,
      discount_total: cartDiscount,
      total: finalTotal,
    };

    const newOrder = placeOrder(orderData);
    setIsSubmitting(false);

    if (newOrder) {
      setIsCheckoutOpen(false);
    }
  };

  const deliveryFee = orderType === 'delivery' ? 15 : 0;
  const finalTotal = cartTotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-[#FFFBF5] rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/30 my-8">
        {/* Modal Header */}
        <div
          className="p-5 flex items-center justify-between border-b text-white"
          style={{
            backgroundColor: 'var(--color-chocolate)',
            borderColor: 'rgba(212, 175, 55, 0.3)',
          }}
        >
          <div>
            <h2
              className="text-lg sm:text-xl font-bold text-[#FFF5E1]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              {language === 'ar' ? 'استكمال وتأكيد الطلب' : 'Complete Your Order'}
            </h2>
            <p className="text-xs text-[#D4AF37]">
              {cart.length} {language === 'ar' ? 'أصناف مختارة' : 'items in tray'} • {finalTotal} {t.priceCurrency}
            </p>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. ORDER TYPE SELECTOR (Crucial requirement: 3 order types) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2B140E] uppercase tracking-wider block">
              1. {t.orderType}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* On-Site */}
              <button
                type="button"
                id="order-type-on-site"
                onClick={() => handleOrderTypeChange('on-site')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  orderType === 'on-site'
                    ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md scale-102 font-bold'
                    : 'bg-white text-[#2B140E] border-[#D4AF37]/20 hover:bg-[#F5EDE0]'
                }`}
              >
                <Store className={`w-5 h-5 ${orderType === 'on-site' ? 'text-[#D4AF37]' : 'text-[#8C6212]'}`} />
                <span className="text-xs">{t.onSite}</span>
              </button>

              {/* Pickup */}
              <button
                type="button"
                id="order-type-pickup"
                onClick={() => handleOrderTypeChange('pickup')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  orderType === 'pickup'
                    ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md scale-102 font-bold'
                    : 'bg-white text-[#2B140E] border-[#D4AF37]/20 hover:bg-[#F5EDE0]'
                }`}
              >
                <ShoppingBag className={`w-5 h-5 ${orderType === 'pickup' ? 'text-[#D4AF37]' : 'text-[#8C6212]'}`} />
                <span className="text-xs">{t.pickup}</span>
              </button>

              {/* Delivery */}
              <button
                type="button"
                id="order-type-delivery"
                onClick={() => handleOrderTypeChange('delivery')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md scale-102 font-bold'
                    : 'bg-white text-[#2B140E] border-[#D4AF37]/20 hover:bg-[#F5EDE0]'
                }`}
              >
                <Truck className={`w-5 h-5 ${orderType === 'delivery' ? 'text-[#D4AF37]' : 'text-[#8C6212]'}`} />
                <span className="text-xs">{t.delivery}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#2B140E]/70 px-1">
              {orderType === 'on-site'
                ? t.onSiteDesc
                : orderType === 'pickup'
                ? t.pickupDesc
                : t.deliveryDesc}
            </p>
          </div>

          {/* 2. CUSTOMER & ORDER DETAILS */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#D4AF37]/20 shadow-xs">
            <h3 className="text-xs font-bold text-[#2B140E] uppercase tracking-wider">
              2. {language === 'ar' ? 'بيانات العميل والموقع' : 'Customer Details'}
            </h3>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.customerName} *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسمك الكريم' : 'Your full name'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFFBF5] text-sm text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              {errors.customerName && (
                <span className="text-xs text-red-500 mt-1 block">{errors.customerName}</span>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.customerPhone} *</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="01113116242"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFFBF5] text-sm text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              {errors.customerPhone && (
                <span className="text-xs text-red-500 mt-1 block">{errors.customerPhone}</span>
              )}
            </div>

            {/* Conditional fields based on orderType */}
            {orderType === 'on-site' && (
              <div>
                <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                  <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.tableNumber}</span>
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: طاولة رقم ٤ (أو اترك فارغاً)' : 'e.g. Table 4'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFFBF5] text-sm text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] transition-all"
                />
              </div>
            )}

            {orderType === 'pickup' && (
              <div>
                <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.pickupTime}</span>
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFFBF5] text-sm text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] transition-all"
                >
                  <option value="15-20 Mins">
                    {language === 'ar' ? 'خلال ١٥ - ٢٠ دقيقة' : 'In 15-20 Mins'}
                  </option>
                  <option value="30 Mins">
                    {language === 'ar' ? 'خلال ٣٠ دقيقة' : 'In 30 Mins'}
                  </option>
                  <option value="45 Mins">
                    {language === 'ar' ? 'خلال ٤٥ دقيقة' : 'In 45 Mins'}
                  </option>
                  <option value="1 Hour">
                    {language === 'ar' ? 'خلال ساعة' : 'In 1 Hour'}
                  </option>
                </select>
              </div>
            )}

            {orderType === 'delivery' && (
              <div>
                <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.deliveryAddress} *</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'الحوامدية - شارع الجمهورية أو صلاح سالم بجوار...'
                      : 'Al Hawamdeya, building, apartment & landmark...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFFBF5] text-sm text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] transition-all"
                />
                {errors.deliveryAddress && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.deliveryAddress}</span>
                )}
              </div>
            )}

            {/* Preparation Notes */}
            <div>
              <label className="text-xs font-semibold text-[#2B140E] flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.orderNotes}</span>
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={
                  language === 'ar' ? 'مثال: سكر خفيف، صوص شوكولاتة إضافي' : 'e.g. Extra chocolate drizzle'
                }
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-[#FFFBF5] text-xs text-[#2B140E] focus:outline-hidden focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          {/* 3. PAYMENT METHOD LOGIC (Crucial Logic with Pickup COD prohibition) */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#D4AF37]/20 shadow-xs">
            <h3 className="text-xs font-bold text-[#2B140E] uppercase tracking-wider">
              3. {t.paymentMethod}
            </h3>

            {/* PICKUP WARNING IF COD WAS ATTEMPTED */}
            {orderType === 'pickup' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {t.pickupCodDisabledNotice}
                </p>
              </div>
            )}

            {/* Payment Method Radio Options */}
            <div className="space-y-2">
              {/* COD Option - DISABLED for Pickup */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  orderType === 'pickup'
                    ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed'
                    : paymentMethod === 'cod'
                    ? 'bg-[#FFFBF5] border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs'
                    : 'bg-white border-gray-200 hover:bg-[#FFFBF5] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    disabled={orderType === 'pickup'}
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#8C6212]" />
                    <span className="text-xs sm:text-sm font-semibold text-[#2B140E]">
                      {t.cod}
                    </span>
                  </div>
                </div>
                {orderType === 'pickup' && (
                  <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {language === 'ar' ? 'غير متاح للتيك أواي' : 'Disabled for Pickup'}
                  </span>
                )}
              </label>

              {/* Digital Wallet / InstaPay Option */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'instapay_wallet'
                    ? 'bg-[#FFFBF5] border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs'
                    : 'bg-white border-gray-200 hover:bg-[#FFFBF5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    value="instapay_wallet"
                    checked={paymentMethod === 'instapay_wallet'}
                    onChange={() => setPaymentMethod('instapay_wallet')}
                    className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs sm:text-sm font-semibold text-[#2B140E]">
                      {t.instapayWallet}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#8C6212] bg-[#F7E7A9]/60 px-2 py-0.5 rounded-full">
                  InstaPay / Vodafone Cash
                </span>
              </label>
            </div>

            {/* DIGITAL PAYMENT REQUIRED FIELDS (CRUCIAL REQUIREMENT) */}
            {paymentMethod === 'instapay_wallet' && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#2B140E] text-[#FFF5E1] border border-[#D4AF37]/40 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#D4AF37]/20">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <h4 className="text-xs font-bold text-[#F7E7A9]">
                    {t.digitalPaymentDetails}
                  </h4>
                </div>

                {/* Cafe Official Accounts Box */}
                <div className="bg-[#1A0A06] p-2.5 rounded-lg border border-[#D4AF37]/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#D4AF37] block">
                        InstaPay / Wallet Hotline
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {t.instaPayNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(t.instaPayNumber)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#D4AF37] text-[#1A0A06] flex items-center gap-1 hover:bg-[#F7E7A9] transition-colors"
                    >
                      {copiedInstaPay ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedInstaPay ? t.copied : t.copyNumber}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-[#F7E7A9]/70 pt-1 border-t border-[#D4AF37]/10">
                    <span>InstaPay Username: </span>
                    <strong className="text-white font-mono">{t.instaPayUsername}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-[#F7E7A9]/80 leading-relaxed">
                  {t.digitalPaymentNotice}
                </p>

                {/* 1. Transfer From Phone (Required) */}
                <div>
                  <label className="text-xs font-bold text-[#F7E7A9] block mb-1">
                    {t.transferFrom} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={transferFromPhone}
                    onChange={(e) => setTransferFromPhone(e.target.value)}
                    placeholder={t.transferFromPlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-[#1A0A06] border border-[#D4AF37]/50 text-white text-xs font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                  {errors.transferFromPhone && (
                    <span className="text-xs text-red-400 mt-1 block">
                      {errors.transferFromPhone}
                    </span>
                  )}
                </div>

                {/* 2. Amount Transferred (Required) */}
                <div>
                  <label className="text-xs font-bold text-[#F7E7A9] block mb-1">
                    {t.amountTransferred} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      value={amountTransferred}
                      onChange={(e) => setAmountTransferred(e.target.value)}
                      placeholder={t.amountTransferredPlaceholder}
                      className="w-full px-3 py-2 rounded-lg bg-[#1A0A06] border border-[#D4AF37]/50 text-white text-xs font-mono focus:outline-hidden focus:border-[#D4AF37]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-[#D4AF37] font-bold">
                      {t.priceCurrency}
                    </span>
                  </div>
                  {errors.amountTransferred && (
                    <span className="text-xs text-red-400 mt-1 block">
                      {errors.amountTransferred}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. TOTAL BREAKDOWN & SUBMIT CTA */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/25 space-y-2">
            <div className="flex justify-between text-xs text-[#2B140E]">
              <span>{t.subtotal}</span>
              <span className="font-semibold">{cartTotal} {t.priceCurrency}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between text-xs text-[#2B140E]">
                <span>{t.deliveryFee}</span>
                <span className="font-semibold">{deliveryFee} {t.priceCurrency}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-[#2B140E] pt-2 border-t border-[#D4AF37]/20">
              <span>{t.total}</span>
              <span className="text-[#D4AF37] text-xl">{finalTotal} {t.priceCurrency}</span>
            </div>

            <button
              type="submit"
              id="confirm-place-order-btn"
              disabled={isSubmitting}
              className="w-full mt-3 py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all duration-200 active:scale-98 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                color: '#1A0A06',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.45)',
              }}
            >
              <Sparkles className="w-4 h-4 text-[#1A0A06]" />
              <span>{isSubmitting ? 'Processing...' : t.placeOrder}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
