import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product, SelectedAddon } from '../types';
import { useStore } from '../context/StoreContext';
import { X, Plus, Minus, Check, CupSoda, CheckCircle2, Layers } from 'lucide-react';
import {
  isProductSizeEnabled,
  getProductSizeLabels,
  SizeKey,
} from '../utils/productSizes';

interface ProductCustomizeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    product: Product,
    quantity: number,
    selectedAddons: SelectedAddon[],
    selectedSize?: SizeKey
  ) => void;
  confirmButtonText?: string;
  initialSize?: SizeKey;
}

// 1. SIZE OPTIONS (ONLY for 'Iced coffee' category)
export const SIZE_OPTIONS = [
  { id: 'size_cup', name_en: 'Cup', name_ar: 'الكوباية', price: 0, desc_ar: 'السعر العادي للمشروب', desc_en: 'Standard cup' },
  { id: 'size_can', name_en: 'Can', name_ar: 'كان', price: 20, desc_ar: 'عبوة كان محكمة ومثلجة', desc_en: '+20 EGP' },
];

// 2. FLAVOR ADD-ONS (Apply to ALL products, multi-select)
export const FLAVOR_OPTIONS = [
  { id: 'flavor_vanilla', name_en: 'Vanilla', name_ar: 'فانيليا', price: 15 },
  { id: 'flavor_caramel', name_en: 'Caramel', name_ar: 'كراميل', price: 15 },
];

// 3. TOPPING ADD-ONS (Apply to ALL products, multi-select)
export const TOPPING_OPTIONS = [
  { id: 'topping_condensed_milk', name_en: 'Condensed Milk', name_ar: 'حليب مكثف', price: 20 },
  { id: 'topping_white_chocolate', name_en: 'White Chocolate', name_ar: 'شوكلت وايت', price: 20 },
  { id: 'topping_dark_chocolate', name_en: 'Dark Chocolate', name_ar: 'شوكلت دارك', price: 20 },
];

export const ProductCustomizeModal: React.FC<ProductCustomizeModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  confirmButtonText,
  initialSize = 'small',
}) => {
  const { language, t } = useStore();

  const isIcedCoffee = product?.category === 'Iced coffee';
  const hasSizes = product ? isProductSizeEnabled(product) : false;
  const sizeLabels = product ? getProductSizeLabels(product) : null;

  // State
  const [productSizeKey, setProductSizeKey] = useState<SizeKey>(initialSize);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('size_cup');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Reset when a new product is selected
  useEffect(() => {
    if (isOpen) {
      setProductSizeKey(initialSize || 'small');
      setSelectedSizeId('size_cup');
      setSelectedAddonIds([]);
      setQuantity(1);
    }
  }, [isOpen, initialSize, product?.id]);

  // Lock body scroll and handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const basePrice = hasSizes
    ? (productSizeKey === 'large'
        ? Number(product.price_large) || product.price
        : Number(product.price_small) || product.price)
    : (product.discount_price ?? product.price);

  // Toggle addon
  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate Extra Costs per single item
  const selectedSizeObj = isIcedCoffee
    ? SIZE_OPTIONS.find((s) => s.id === selectedSizeId) || SIZE_OPTIONS[0]
    : null;
  const sizeCost = selectedSizeObj ? selectedSizeObj.price : 0;

  const allAddons = [...FLAVOR_OPTIONS, ...TOPPING_OPTIONS];
  const toppingsCost = selectedAddonIds.reduce((sum, id) => {
    const opt = allAddons.find((o) => o.id === id);
    return sum + (opt ? opt.price : 0);
  }, 0);

  const addonCostPerItem = sizeCost + toppingsCost;
  const unitFinalPrice = basePrice + addonCostPerItem;
  const totalCost = unitFinalPrice * quantity;

  // Assemble SelectedAddon list
  const getSelectedAddonsList = (): SelectedAddon[] => {
    const list: SelectedAddon[] = [];

    // Size or Pieces Choice
    if (hasSizes && sizeLabels) {
      const selectedSizeInfo = productSizeKey === 'large' ? sizeLabels.large : sizeLabels.small;
      list.push({
        id: `size_${productSizeKey}`,
        name: language === 'ar' ? selectedSizeInfo.ar : selectedSizeInfo.en,
        name_en: selectedSizeInfo.en,
        name_ar: selectedSizeInfo.ar,
        price: 0,
        category: 'size',
      });
    }

    if (isIcedCoffee && selectedSizeObj) {
      list.push({
        id: selectedSizeObj.id,
        name: language === 'ar' 
          ? `${selectedSizeObj.name_ar}${selectedSizeObj.price > 0 ? ` (+${selectedSizeObj.price} ج.م)` : ''}`
          : `${selectedSizeObj.name_en}${selectedSizeObj.price > 0 ? ` (+${selectedSizeObj.price} EGP)` : ''}`,
        name_en: selectedSizeObj.name_en,
        name_ar: selectedSizeObj.name_ar,
        price: selectedSizeObj.price,
        category: 'size',
      });
    }

    FLAVOR_OPTIONS.forEach((flavor) => {
      if (selectedAddonIds.includes(flavor.id)) {
        list.push({
          id: flavor.id,
          name: language === 'ar' ? `${flavor.name_ar} (+${flavor.price} ج.م)` : `${flavor.name_en} (+${flavor.price} EGP)`,
          name_en: flavor.name_en,
          name_ar: flavor.name_ar,
          price: flavor.price,
          category: 'flavor',
        });
      }
    });

    TOPPING_OPTIONS.forEach((topping) => {
      if (selectedAddonIds.includes(topping.id)) {
        list.push({
          id: topping.id,
          name: language === 'ar' ? `${topping.name_ar} (+${topping.price} ج.م)` : `${topping.name_en} (+${topping.price} EGP)`,
          name_en: topping.name_en,
          name_ar: topping.name_ar,
          price: topping.price,
          category: 'topping',
        });
      }
    });

    return list;
  };

  const handleConfirm = () => {
    const addons = getSelectedAddonsList();
    onConfirm(product, quantity, addons, hasSizes ? productSizeKey : undefined);
    onClose();
  };

  const modalContent = (
    <div
      id="product-customize-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[95vw] sm:max-w-lg bg-[#FFFBF5] rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/30 my-4 sm:my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header with Product Preview */}
        <div className="p-4 sm:p-5 bg-[#2B140E] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name_en}
              className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/40 bg-black/20 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2
                className="text-base sm:text-lg font-extrabold text-[#F7E7A9] line-clamp-1 leading-tight"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
              >
                {language === 'ar' ? product.name_ar : product.name_en}
              </h2>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="text-gray-300">
                  {language === 'ar' ? 'السعر الأساسي:' : 'Base Price:'}
                </span>
                <span className="font-extrabold text-white">
                  {basePrice} {t.priceCurrency}
                </span>
                {product.discount_price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {product.price} {t.priceCurrency}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            id="close-customize-modal-btn"
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-[#2B140E]">
          {/* 0. PRODUCT SIZE / PIECES SELECTION */}
          {hasSizes && sizeLabels && (
            <div className="space-y-2.5 pb-5 border-b border-[#D4AF37]/20">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#2B140E]">
                  <Layers className="w-4 h-4 text-[#D4AF37]" />
                  <span>{language === 'ar' ? sizeLabels.sectionTitleAr : sizeLabels.sectionTitleEn}</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6212] font-semibold">
                  {language === 'ar' ? 'حدد الحجم المطلوب' : 'Choose option'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Small / 12 Pieces */}
                <button
                  type="button"
                  id="product-size-small-btn"
                  onClick={() => setProductSizeKey('small')}
                  className={`p-3 sm:p-3.5 min-h-[56px] rounded-2xl border text-center flex flex-col items-center justify-between gap-1 transition-all duration-200 cursor-pointer ${
                    productSizeKey === 'small'
                      ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/40'
                      : 'bg-white text-[#2B140E] border-gray-200 hover:border-[#D4AF37]/50 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {productSizeKey === 'small' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    <span className="font-bold text-sm">
                      {language === 'ar' ? sizeLabels.small.ar : sizeLabels.small.en}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#D4AF37]">
                    {product.price_small} {t.priceCurrency}
                  </span>
                </button>

                {/* Large / 26 Pieces */}
                <button
                  type="button"
                  id="product-size-large-btn"
                  onClick={() => setProductSizeKey('large')}
                  className={`p-3 sm:p-3.5 min-h-[56px] rounded-2xl border text-center flex flex-col items-center justify-between gap-1 transition-all duration-200 cursor-pointer ${
                    productSizeKey === 'large'
                      ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/40'
                      : 'bg-white text-[#2B140E] border-gray-200 hover:border-[#D4AF37]/50 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {productSizeKey === 'large' && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    <span className="font-bold text-sm">
                      {language === 'ar' ? sizeLabels.large.ar : sizeLabels.large.en}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#D4AF37]">
                    {product.price_large} {t.priceCurrency}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 1. SIZE OPTION (ONLY for 'Iced coffee' category) */}
          {isIcedCoffee && (
            <div className="space-y-2.5 pb-5 border-b border-[#D4AF37]/20">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#2B140E]">
                  <CupSoda className="w-4 h-4 text-[#D4AF37]" />
                  <span>{language === 'ar' ? 'طريقة التقديم / الحجم' : 'Serving / Size Choice'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6212] font-semibold">
                    {language === 'ar' ? 'خاص بالقهوة والمشروبات المثلجة' : 'Iced Drinks Only'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {SIZE_OPTIONS.map((size) => {
                  const isSelected = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      id={`size-opt-${size.id}`}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`p-3 sm:p-3.5 min-h-[48px] rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2B140E] text-[#F7E7A9] border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/40'
                          : 'bg-white text-[#2B140E] border-gray-200 hover:border-[#D4AF37]/50 hover:bg-amber-50/40'
                      }`}
                    >
                      <span className="font-bold text-sm">
                        {language === 'ar' ? size.name_ar : size.name_en}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isSelected ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {language === 'ar' ? size.desc_ar : size.desc_en}
                      </span>
                      <span className="text-xs font-bold font-mono text-[#D4AF37]">
                        {size.price === 0 ? (language === 'ar' ? 'السعر العادي' : 'Standard') : `+${size.price} ${t.priceCurrency}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. FLAVOR ADD-ONS (ALL products, multi-select) */}
          <div className="space-y-2.5 pb-4 border-b border-[#D4AF37]/20">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#2B140E]">
                <span>{language === 'ar' ? 'إضافات النكهات (فلافور)' : 'Flavor Add-ons'}</span>
              </label>
              <span className="text-[10px] text-gray-500 font-medium">
                {language === 'ar' ? 'اختيار متعدد (+١٥ ج.م)' : 'Multi-select (+15 EGP)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FLAVOR_OPTIONS.map((flavor) => {
                const isChecked = selectedAddonIds.includes(flavor.id);
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    id={`addon-opt-${flavor.id}`}
                    onClick={() => toggleAddon(flavor.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer text-left ${
                      isChecked
                        ? 'bg-amber-50/90 border-[#D4AF37] shadow-xs text-[#2B140E] font-bold ring-1 ring-[#D4AF37]/50'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-[#2B140E] border-[#2B140E] text-[#F7E7A9]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs sm:text-sm">
                        {language === 'ar' ? flavor.name_ar : flavor.name_en}
                      </span>
                    </div>

                    <span className="text-xs font-bold font-mono text-[#8C6212] shrink-0 ml-1">
                      +{flavor.price} {t.priceCurrency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. TOPPING ADD-ONS (ALL products, multi-select) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#2B140E]">
                <span>{language === 'ar' ? 'إضافات التوبينج والصوصات' : 'Topping Add-ons'}</span>
              </label>
              <span className="text-[10px] text-gray-500 font-medium">
                {language === 'ar' ? 'اختيار متعدد (+٢٠ ج.م)' : 'Multi-select (+20 EGP)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TOPPING_OPTIONS.map((topping) => {
                const isChecked = selectedAddonIds.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    type="button"
                    id={`addon-opt-${topping.id}`}
                    onClick={() => toggleAddon(topping.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer text-left ${
                      isChecked
                        ? 'bg-amber-50/90 border-[#D4AF37] shadow-xs text-[#2B140E] font-bold ring-1 ring-[#D4AF37]/50'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-[#2B140E] border-[#2B140E] text-[#F7E7A9]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-semibold">
                        {language === 'ar' ? topping.name_ar : topping.name_en}
                      </span>
                    </div>

                    <span className="text-xs font-bold font-mono text-[#8C6212] shrink-0 ml-1">
                      +{topping.price} {t.priceCurrency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Quantity Stepper, Live Price Total & Confirm CTA */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#D4AF37]/25 space-y-3 shrink-0 shadow-lg">
          {/* Live Price Summary Line */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="space-y-0.5">
              <span className="text-gray-500 block">
                {language === 'ar' ? 'سعر القطعة بالإضافات:' : 'Item with Add-ons:'}
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="font-extrabold text-[#2B140E] text-base sm:text-lg">
                  {unitFinalPrice}
                </span>
                <span className="text-xs font-bold text-[#8C6212]">{t.priceCurrency}</span>
                {addonCostPerItem > 0 && (
                  <span className="text-[11px] text-gray-400 font-normal">
                    ({basePrice} + {addonCostPerItem} {language === 'ar' ? 'إضافات' : 'addons'})
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                {language === 'ar' ? 'الكمية:' : 'Qty:'}
              </span>
              <div className="flex items-center border border-[#D4AF37]/40 rounded-xl bg-[#FFFBF5] overflow-hidden shadow-xs">
                <button
                  type="button"
                  id="customize-qty-minus"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-[#D4AF37]/20 text-[#2B140E] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs sm:text-sm font-black font-mono text-[#2B140E]">
                  {quantity}
                </span>
                <button
                  type="button"
                  id="customize-qty-plus"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="p-2 hover:bg-[#D4AF37]/20 text-[#2B140E] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Final Total and Action Button */}
          <button
            type="button"
            id="confirm-customize-add-btn"
            onClick={handleConfirm}
            className="w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-between shadow-xl transition-all duration-200 active:scale-98 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
              boxShadow: '0 4px 18px rgba(212, 175, 55, 0.4)',
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{confirmButtonText || (language === 'ar' ? 'تأكيد وإضافة للصينية' : 'Confirm & Add to Tray')}</span>
            </div>
            <div className="flex items-baseline gap-1 font-mono font-black text-base sm:text-lg">
              <span>{totalCost}</span>
              <span className="text-xs font-bold">{t.priceCurrency}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
