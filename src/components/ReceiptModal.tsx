import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Share2,
  Check,
  Store,
  Truck,
  FileText,
  Sparkles,
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const {
    activeReceiptOrder,
    setActiveReceiptOrder,
    siteConfig,
    language,
    t,
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);

  // Setup/tear down thermal print root in DOM
  useEffect(() => {
    let el = document.getElementById('receipt-print-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'receipt-print-root';
      document.body.appendChild(el);
    }
    setPrintContainer(el);

    return () => {
      // Keep element or clean up if needed
    };
  }, []);

  if (!activeReceiptOrder) return null;

  const order = activeReceiptOrder;
  const isArabic = language === 'ar';
  const isDigital = order.payment_method === 'instapay_wallet';

  const orderDate = new Date(order.created_at || Date.now());
  const formattedDate = orderDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const itemsText = order.items
      .map(
        (item) =>
          `• ${item.quantity}x ${isArabic ? item.product_name_ar : item.product_name_en} - ${item.total_price} EGP` +
          (item.selected_addons && item.selected_addons.length > 0
            ? ` (${item.selected_addons.map((a) => (isArabic ? a.name_ar : a.name_en)).join(', ')})`
            : '')
      )
      .join('\n');

    const summary = `🧾 *Chocolate House - شوكلت هاوس*
رقم الطلب: ${order.order_number}
نوع الطلب: ${
      order.order_type === 'on-site'
        ? 'صالة (داخل الكافيه)'
        : order.order_type === 'pickup'
        ? 'استلام من الفرع'
        : 'توصيل'
    }
العميل: ${order.customer_name} (${order.customer_phone})
${order.table_number ? `طاولة: ${order.table_number}\n` : ''}${
      order.delivery_address ? `العنوان: ${order.delivery_address}\n` : ''
    }
الطلبات:
${itemsText}

الإجمالي: ${order.total} EGP
طريقة الدفع: ${isDigital ? 'إنستاباي / محفظة' : 'الدفع عند الاستلام (كاش)'}
التاريخ: ${formattedDate} ${formattedTime}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Thermal receipt content (used both for 80mm print & visual ticket)
  const renderThermalReceiptContent = () => (
    <div id="thermal-receipt-content" className="receipt-print-area font-mono text-black">
      {/* Receipt Header */}
      <div className="text-center pb-2 mb-2 border-b border-dashed border-gray-400">
        <h2 className="text-base font-black tracking-wider uppercase">CHOCOLATE HOUSE</h2>
        <p className="text-xs font-bold">شوكلت هاوس - كافيه & حلويات</p>
        <p className="text-[10px] mt-0.5">{siteConfig.address_ar || 'الحوامدية - الجيزة'}</p>
        <p className="text-[10px]">هاتف: {siteConfig.phone}</p>
      </div>

      {/* Ticket Details */}
      <div className="text-[10px] space-y-0.5 pb-2 mb-2 border-b border-dashed border-gray-400">
        <div className="flex justify-between font-bold text-xs">
          <span>{isArabic ? 'رقم الفاتورة:' : 'Order #:'}</span>
          <span className="font-mono">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>{isArabic ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
          <span>{formattedDate} {formattedTime}</span>
        </div>
        <div className="flex justify-between">
          <span>{isArabic ? 'نوع الطلب:' : 'Order Type:'}</span>
          <span className="font-bold">
            {order.order_type === 'on-site'
              ? isArabic ? 'صالة (طاولة)' : 'On-Site Dine-In'
              : order.order_type === 'pickup'
              ? isArabic ? 'استلام (تيك أواي)' : 'Takeaway / Pickup'
              : isArabic ? 'توصيل دليفري' : 'Delivery'}
          </span>
        </div>
        {order.staff_name && (
          <div className="flex justify-between">
            <span>{isArabic ? 'الكاشير:' : 'Cashier:'}</span>
            <span>{order.staff_name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{isArabic ? 'العميل:' : 'Customer:'}</span>
          <span className="font-bold">{order.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span>{isArabic ? 'الهاتف:' : 'Phone:'}</span>
          <span>{order.customer_phone}</span>
        </div>
        {order.table_number && (
          <div className="flex justify-between font-bold">
            <span>{isArabic ? 'رقم الطاولة:' : 'Table #:'}</span>
            <span>{order.table_number}</span>
          </div>
        )}
        {order.delivery_address && (
          <div className="pt-0.5">
            <span className="block font-bold">{isArabic ? 'عنوان التوصيل:' : 'Address:'}</span>
            <span className="block text-[9px]">{order.delivery_address}</span>
          </div>
        )}
        {order.pickup_time && (
          <div className="flex justify-between">
            <span>{isArabic ? 'وقت الاستلام:' : 'Pickup Time:'}</span>
            <span>{order.pickup_time}</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="pb-2 mb-2 border-b border-dashed border-gray-400">
        <div className="flex justify-between text-[10px] font-bold pb-1 border-b border-gray-300">
          <span>{isArabic ? 'الصنف' : 'Item'}</span>
          <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
        </div>
        <div className="space-y-1.5 pt-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="flex justify-between items-start">
                <span className="font-semibold leading-tight flex-1">
                  {item.quantity}x {isArabic ? item.product_name_ar : item.product_name_en}
                </span>
                <span className="font-mono font-bold shrink-0 ml-2">
                  {item.total_price} EGP
                </span>
              </div>
              {item.selected_addons && item.selected_addons.length > 0 && (
                <div className="text-[9px] text-gray-600 pl-3">
                  {item.selected_addons.map((a) => `+${isArabic ? a.name_ar : a.name_en}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="text-[10px] space-y-0.5 pb-2 mb-2 border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span className="font-mono">{order.subtotal} EGP</span>
        </div>
        {order.delivery_fee > 0 && (
          <div className="flex justify-between">
            <span>{isArabic ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
            <span className="font-mono">{order.delivery_fee} EGP</span>
          </div>
        )}
        {order.discount_total > 0 && (
          <div className="flex justify-between text-emerald-800">
            <span>{isArabic ? 'الخصم:' : 'Discount:'}</span>
            <span className="font-mono">-{order.discount_total} EGP</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-300">
          <span>{isArabic ? 'الإجمالي النهائي:' : 'TOTAL:'}</span>
          <span className="font-mono">{order.total} EGP</span>
        </div>
      </div>

      {/* Payment info & Footer */}
      <div className="text-[9px] space-y-1 text-center">
        <p className="font-bold">
          {isArabic ? 'طريقة الدفع:' : 'Payment:'}{' '}
          {isDigital
            ? isArabic
              ? `إنستاباي / محفظة (${order.transfer_from_phone || 'تم التحويل'})`
              : `InstaPay / Wallet (${order.transfer_from_phone || 'Verified'})`
            : isArabic
            ? 'نقداً عند الاستلام (كاش)'
            : 'Cash on Arrival (COD)'}
        </p>
        {order.notes && (
          <p className="italic text-[9px] text-gray-700">
            {isArabic ? 'ملاحظة:' : 'Note:'} {order.notes}
          </p>
        )}
        <div className="pt-2 border-t border-dashed border-gray-400">
          <p className="font-bold">{siteConfig.tagline_ar || 'شكراً لزيارتكم شوكلت هاوس'}</p>
          <p className="text-[8px] text-gray-600 mt-0.5">Thank you for choosing Chocolate House</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 80mm Print Portal for thermal printer */}
      {printContainer && createPortal(renderThermalReceiptContent(), printContainer)}

      {/* Screen Modal Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
        <div className="relative w-full max-w-md bg-[#FFFBF5] rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/40 my-4">
          {/* Header Banner */}
          <div
            className="p-4 text-white relative flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #1A0A06 0%, #2B140E 50%, #442217 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#F7E7A9]">
                  {t.orderSuccessTitle || (isArabic ? 'تم تأكيد الطلب بنجاح' : 'Order Confirmed')}
                </h3>
                <p className="text-xs text-[#F7E7A9]/75 font-mono">
                  {order.order_number}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveReceiptOrder(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Visual Thermal Receipt Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs relative">
              <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-[#8C6212] bg-[#FFFBF5] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span>80mm Thermal</span>
              </div>
              {renderThermalReceiptContent()}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-4 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 text-[#1A0A06] transition-transform active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                }}
              >
                <Printer className="w-4 h-4" />
                <span>{t.printReceipt || (isArabic ? 'طباعة الإيصال' : 'Print Receipt')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-3 px-4 rounded-2xl text-xs font-bold border border-[#D4AF37]/50 bg-white hover:bg-[#FFFBF5] text-[#2B140E] flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-[#8C6212]" />}
                <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ ملخص الطلب' : 'Copy Summary')}</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveReceiptOrder(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-[#2B140E] hover:bg-gray-100 transition-colors text-center"
            >
              {t.continueShopping || (isArabic ? 'العودة للتسوق' : 'Close & Back')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
