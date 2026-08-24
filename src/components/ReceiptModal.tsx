import React from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { X, Printer, CheckCircle2, MapPin } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { language, t, activeReceiptOrder, setActiveReceiptOrder } = useStore();

  if (!activeReceiptOrder) return null;

  const order = activeReceiptOrder;

  // 1. Google Maps Store Location URL for QR Code generation (Exact URL requested)
  const storeGoogleMapsUrl = 'https://maps.app.goo.gl/AxWMKsKdfzpvW4gv5?g_st=ic';
  // Generates 150x150 QR code directly encoding the exact Google Maps URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(storeGoogleMapsUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    /* Outer Modal Container: Configured with id="thermal-receipt-modal" and print styles to prevent blank pages during window.print() */
    <div
      id="thermal-receipt-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/30 my-8 print:my-0 print:border-none print:shadow-none print:w-[80mm] print:max-w-[80mm] print:rounded-none print:overflow-visible">
        {/* Top bar (Hidden when printing via .print:hidden) */}
        <div className="p-4 bg-[#2B140E] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-bold text-sm text-[#F7E7A9]">
              {t.orderSuccessTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-receipt-btn"
              className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#1A0A06] font-bold text-xs flex items-center gap-1.5 hover:bg-[#F7E7A9] transition-colors shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printReceipt}</span>
            </button>
            <button
              onClick={() => setActiveReceiptOrder(null)}
              className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 80mm THERMAL PRINTABLE RECEIPT CONTENT */}
        <div
          id="thermal-receipt-content"
          className="p-6 text-black bg-white font-mono text-xs space-y-4 print:p-2 print:space-y-3"
        >
          {/* Receipt Header */}
          <div className="text-center space-y-1.5 border-b border-dashed border-gray-400 pb-4">
            <div className="flex justify-center pb-1">
              <Logo size="sm" />
            </div>
            <h1 className="text-base font-black tracking-wider uppercase">
              Chocolate House - شوكلت هاوس
            </h1>
            <p className="text-[10px] text-gray-700">
              Salah Salem ST, Al Hawamdeya Giza
            </p>
            <p className="text-[10px] text-gray-700">
              Tel: 01112437437 | InstaPay: 01112437437
            </p>
            <div className="pt-2 text-xs font-bold">
              <span>{t.orderNumber}: </span>
              <span className="text-sm">{order.order_number}</span>
            </div>
            <p className="text-[10px] text-gray-600">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          {/* Customer & Order Metadata */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-3">
            <div className="flex justify-between">
              <span className="font-semibold">{t.orderType}:</span>
              <span className="font-bold uppercase">
                {order.order_type === 'on-site'
                  ? t.onSite
                  : order.order_type === 'pickup'
                  ? t.pickup
                  : t.delivery}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">{t.customerName}:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">{t.customerPhone}:</span>
              <span>{order.customer_phone}</span>
            </div>
            {order.table_number && (
              <div className="flex justify-between">
                <span className="font-semibold">{t.tableNumber}:</span>
                <span className="font-bold">{order.table_number}</span>
              </div>
            )}
            {order.pickup_time && (
              <div className="flex justify-between">
                <span className="font-semibold">{t.pickupTime}:</span>
                <span>{order.pickup_time}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="pt-1">
                <span className="font-semibold block">{t.deliveryAddress}:</span>
                <span className="text-[10px] text-gray-800">{order.delivery_address}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-2 border-b border-dashed border-gray-400 pb-3">
            <div className="flex justify-between font-bold text-[10px] uppercase text-gray-600">
              <span>Item / Qty</span>
              <span>Price</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex-1 pr-2">
                  <span className="font-bold block">
                    {language === 'ar' ? item.product_name_ar : item.product_name_en}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {item.quantity} × {item.unit_price} EGP
                  </span>
                </div>
                <span className="font-bold text-right shrink-0">
                  {item.total_price} EGP
                </span>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1 text-xs border-b border-dashed border-gray-400 pb-3">
            <div className="flex justify-between">
              <span>{t.subtotal}:</span>
              <span>{order.subtotal} EGP</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span>{t.deliveryFee}:</span>
                <span>{order.delivery_fee} EGP</span>
              </div>
            )}
            {order.discount_total > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>{t.discountTotal}:</span>
                <span>-{order.discount_total} EGP</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-300">
              <span>{t.total}:</span>
              <span className="text-base">{order.total} EGP</span>
            </div>
          </div>

          {/* Payment Method & Verification */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-3">
            <div className="flex justify-between">
              <span className="font-semibold">{t.paymentMethod}:</span>
              <span className="font-bold">
                {order.payment_method === 'cod' ? 'CASH ON ARRIVAL' : 'INSTAPAY / WALLET'}
              </span>
            </div>

            {order.payment_method === 'instapay_wallet' && (
              <div className="p-2 bg-gray-100 rounded text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Sender Phone:</span>
                  <span className="font-bold">{order.transfer_from_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Transferred:</span>
                  <span className="font-bold">{order.amount_transferred || order.total} EGP</span>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="pt-1 text-[10px] text-gray-600">
                <strong>Notes: </strong> {order.notes}
              </div>
            )}
          </div>

          {/* Functional Google Maps Location QR Code & Footer */}
          <div className="text-center pt-2 space-y-2">
            <div className="flex flex-col items-center justify-center space-y-1">
              <img
                src={qrCodeUrl}
                alt="Store Location QR Code - Google Maps"
                className="w-24 h-24 sm:w-28 sm:h-28 mx-auto border border-gray-300 p-1 bg-white rounded-md"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-800 pt-1">
                <MapPin className="w-3 h-3 text-red-600 shrink-0 print:hidden" />
                <span>Scan for Google Maps Location</span>
              </div>
              <p className="text-[9px] text-gray-500" dir="rtl">
                امسح الكود لفتح موقع الفرع في خرائط جوجل
              </p>
            </div>
            <p className="text-[11px] font-bold pt-1">
              Thank you for visiting Chocolate House!
            </p>
            <p className="text-[10px] text-gray-500" dir="rtl">
              شكراً لاختياركم شوكلت هاوس - الحوامدية
            </p>
          </div>
        </div>

        {/* Action Button (Hidden when printing) */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={() => setActiveReceiptOrder(null)}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
