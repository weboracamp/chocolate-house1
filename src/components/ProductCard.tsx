import React, { useState } from 'react';
import { Product, SelectedAddon } from '../types';
import { useStore } from '../context/StoreContext';
import { Plus, Minus, Check, Flame, Sparkles, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { ProductCustomizeModal } from './ProductCustomizeModal';

interface ProductCardProps {
  product: Product;
  onCustomize?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onCustomize }) => {
  const { language, t, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const currentPrice = hasDiscount ? product.discount_price! : product.price;
  const originalPrice = product.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - (product.discount_price || 0)) / originalPrice) * 100)
    : 0;

  const handleOpenCustomize = () => {
    if (isSoldOut) return;
    if (onCustomize) {
      onCustomize(product);
    } else {
      setIsCustomizeOpen(true);
    }
  };

  const handleConfirmCustomize = (prod: Product, qty: number, addons: SelectedAddon[]) => {
    const success = addToCart(prod, qty, addons);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
      setQuantity(1);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-white border overflow-hidden transition-all duration-300 ${
        isSoldOut
          ? 'opacity-70 grayscale-[30%] border-gray-200'
          : 'hover:shadow-xl hover:-translate-y-1'
      }`}
      style={{
        borderColor: hasDiscount ? 'rgba(212, 175, 55, 0.45)' : 'rgba(212, 175, 55, 0.2)',
        boxShadow: '0 4px 15px rgba(43, 20, 14, 0.05)',
      }}
    >
      {/* Top Image Container */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-[#2B140E]/5">
        <img
          src={product.image}
          alt={language === 'ar' ? product.name_ar : product.name_en}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Badges container */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 pointer-events-none">
          <div className="flex flex-col gap-1">
            {/* Best Seller Badge */}
            {product.is_best_seller && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4AF37] text-[#1A0A06] shadow-sm">
                <Flame className="w-3 h-3 fill-[#1A0A06]" />
                <span>{t.bestSellers}</span>
              </span>
            )}

            {/* Discount Badge */}
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E53E3E] text-white shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>
                  {discountPercent}% {t.discount}
                </span>
              </span>
            )}
          </div>

          {/* Sold Out / Low Stock Indicator */}
          <div>
            {isSoldOut ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#C53030] text-white shadow-md">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.soldOut}</span>
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DD6B20] text-white shadow-xs">
                <span>
                  {product.stock} {t.stockCount}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Category Tag pill at bottom of image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90">
          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-[#F7E7A9]">
            {t.categories[product.category] || product.category}
          </span>
          <span className="text-[10px] font-medium opacity-80">
            {product.stock} {t.stockCount}
          </span>
        </div>
      </div>

      {/* Content & Details */}
      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
        <div>
          {/* Product Name */}
          <h3
            className="text-base sm:text-lg font-bold text-[#2B140E] line-clamp-1 leading-snug group-hover:text-[#8C6212] transition-colors"
            style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
          >
            {language === 'ar' ? product.name_ar : product.name_en}
          </h3>

          {/* Description */}
          <p className="mt-1 text-xs text-[#2B140E]/70 line-clamp-2 leading-relaxed">
            {language === 'ar' ? product.description_ar : product.description_en}
          </p>
        </div>

        {/* Price & Add to Cart Controls */}
        <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
          {/* Price Layout (Supports Discount original crossed out) */}
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through font-semibold leading-none">
                {originalPrice} {t.priceCurrency}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-[#2B140E] tracking-tight">
                {currentPrice}
              </span>
              <span className="text-xs font-bold text-[#8C6212]">
                {t.priceCurrency}
              </span>
            </div>
          </div>

          {/* Action Button & Quantity Stepper */}
          {isSoldOut ? (
            <button
              disabled
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 cursor-not-allowed uppercase"
            >
              {t.soldOut}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Stepper */}
              <div className="flex items-center border border-[#D4AF37]/30 rounded-lg bg-[#FFFBF5] overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-2 py-1 text-xs font-bold text-[#2B140E] hover:bg-[#D4AF37]/20 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-xs font-bold text-[#2B140E]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-2 py-1 text-xs font-bold text-[#2B140E] hover:bg-[#D4AF37]/20 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Add Button */}
              <button
                id={`add-btn-${product.id}`}
                onClick={handleOpenCustomize}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                style={{
                  background: justAdded
                    ? '#22543D'
                    : 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  color: justAdded ? '#FFFFFF' : '#1A0A06',
                }}
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Added</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تخصيص وإضافة' : 'Customize & Add'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Customization Modal (Fallback when onCustomize not provided) */}
      {!onCustomize && isCustomizeOpen && (
        <ProductCustomizeModal
          product={product}
          isOpen={isCustomizeOpen}
          onClose={() => setIsCustomizeOpen(false)}
          onConfirm={handleConfirmCustomize}
        />
      )}
    </div>
  );
};
