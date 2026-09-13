import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    language,
    t,
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    setIsCheckoutOpen,
  } = useStore();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 ${
          language === 'ar' ? 'left-0' : 'right-0'
        } max-w-full flex w-full sm:w-[420px] bg-[#FFFBF5] shadow-2xl z-50 flex-col`}
      >
        {/* Drawer Header */}
        <div
          className="p-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: 'var(--color-chocolate)',
            borderColor: 'rgba(212, 175, 55, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F7E7A9]">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2
                className="text-base sm:text-lg font-bold text-[#FFF5E1]"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
              >
                {t.cart}
              </h2>
              <p className="text-xs text-[#D4AF37]">
                {cart.length} {language === 'ar' ? 'أصناف مختلفة' : 'unique items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-2 rounded-lg text-xs font-semibold text-[#F7E7A9]/70 hover:text-red-400 transition-colors"
                title="Clear tray"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37]">
                <ShoppingBag className="w-8 h-8 opacity-60" />
              </div>
              <h3
                className="text-lg font-bold text-[#2B140E]"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
              >
                {t.trayEmpty}
              </h3>
              <p className="text-xs text-[#2B140E]/70 max-w-xs leading-relaxed">
                {t.trayEmptySub}
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors shadow-md"
              >
                {t.continueShopping}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D4AF37]/20 shadow-xs"
              >
                {/* Image */}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.product_name_en}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#2B140E] truncate">
                    {language === 'ar' ? item.product_name_ar : item.product_name_en}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-[#D4AF37]">
                      {item.unit_price} {t.priceCurrency}
                    </span>
                    <span className="text-[10px] text-gray-400">× {item.quantity}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-[#D4AF37]/30 rounded-md bg-[#FFFBF5]">
                      <button
                        onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 hover:bg-[#D4AF37]/20 text-[#2B140E]"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-[#2B140E]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 hover:bg-[#D4AF37]/20 text-[#2B140E]"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-[#2B140E]">
                    {item.total_price}
                  </span>
                  <span className="text-[10px] font-bold text-[#D4AF37] block">
                    {t.priceCurrency}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-[#D4AF37]/20 space-y-3">
            {/* Price Summary Breakdown */}
            <div className="space-y-1.5 text-xs text-[#2B140E]">
              <div className="flex justify-between">
                <span className="opacity-80">{t.subtotal}</span>
                <span className="font-semibold">{cartSubtotal} {t.priceCurrency}</span>
              </div>

              {cartDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    {t.discountTotal}
                  </span>
                  <span>-{cartDiscount} {t.priceCurrency}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-[#2B140E] pt-2 border-t border-[#D4AF37]/20">
                <span>{t.total}</span>
                <span className="text-[#D4AF37] text-lg">{cartTotal} {t.priceCurrency}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="proceed-checkout-btn"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-98"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                color: '#1A0A06',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
              }}
            >
              <span>{t.placeOrder}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
