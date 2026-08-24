import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryFilter } from './CategoryFilter';
import { ProductCard } from './ProductCard';
import { CategoryType } from '../types';
import {
  Search,
  Flame,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  ShoppingBag,
  Coffee,
} from 'lucide-react';

export const StoreFront: React.FC = () => {
  const {
    language,
    t,
    cart = [],
    cartTotal = 0,
    setIsCartOpen,
    products = [],
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');

  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((product) => {
      // 1. Category Filter
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      // 2. Search Query (Bilingual & Multi-field)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (product.name_en && product.name_en.toLowerCase().includes(q)) ||
        (product.name_ar && product.name_ar.toLowerCase().includes(q)) ||
        (product.category && product.category.toLowerCase().includes(q)) ||
        (product.description_en && product.description_en.toLowerCase().includes(q)) ||
        (product.description_ar && product.description_ar.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const bestSellerProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((p) => p.is_best_seller);
  }, [products]);

  const totalCartItemCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2B140E]">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1A0A06] via-[#2B140E] to-[#3B1E15] text-[#FFF5E1] py-10 sm:py-16 px-4 sm:px-6">
          {/* Subtle Background Art / Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8C6212]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F7E7A9]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Salah Salem ST, Al Hawamdeya Giza</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#FFF5E1] tracking-tight leading-tight"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
              >
                {t.heroTitle || (language === 'ar' ? 'أشهى الشوكولاتة البلجيكية والقهوة المختصة' : 'Belgian Chocolate & Specialty Coffee')}
              </h1>

              <p className="text-sm sm:text-base text-[#F7E7A9]/80 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                {t.heroSubtitle || (language === 'ar' ? 'طازجة يومياً، محضرة بأرقى معايير الشوكولاتة والحلويات في الحوامدية' : 'Freshly prepared daily with the finest chocolate and artisanal recipes in Al Hawamdeya')}
              </p>

              {/* Branch Highlights bar */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-[#FFF5E1]/90">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span>Open Daily: 10:00 AM - 02:00 AM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span>Order Hotline: 01112437437</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <a
                    href="https://maps.app.goo.gl/AxWMKsKdfzpvW4gv5?g_st=ic"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[#D4AF37] hover:text-[#FFF5E1] transition-colors"
                  >
                    Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-sm shrink-0">
              <div className="relative rounded-3xl p-3 bg-white/5 backdrop-blur-md border border-[#D4AF37]/30 shadow-2xl overflow-hidden group">
                <div className="aspect-4/3 rounded-2xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80"
                    alt="Chocolate House Signature"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-wider">
                      Signature Masterpiece
                    </span>
                    <h3 className="text-base font-bold">
                      {language === 'ar' ? 'مولتن كيك الشوكولاتة البلجيكية' : 'Belgian Molten Chocolate Cake'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & LIVE FILTER BAR */}
        <section className="bg-white border-y border-[#D4AF37]/25 sticky top-16 z-30 shadow-xs py-3 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                id="store-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#D4AF37]/40 bg-[#FFFBF5] text-xs sm:text-sm text-[#2B140E] placeholder-[#2B140E]/50 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              <Search className="w-4 h-4 text-[#8C6212] absolute left-3.5 top-3" />
            </div>

            {/* Quick Filter Status */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span className="text-[#2B140E]/70 font-medium">
                {filteredProducts.length} {t.stockCount || 'items'}
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#8C6212] hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Clear Filter ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 19 CATEGORIES FILTER SCROLLER */}
        <section className="py-4 max-w-7xl w-full mx-auto px-4 sm:px-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* BEST SELLERS SPOTLIGHT (If no specific category filter is active) */}
        {selectedCategory === 'all' && !searchQuery.trim() && bestSellerProducts.length > 0 && (
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#D4AF37]/20">
              <div className="p-1.5 rounded-lg bg-[#D4AF37] text-[#1A0A06]">
                <Flame className="w-4 h-4 fill-[#1A0A06]" />
              </div>
              <div>
                <h2
                  className="text-lg sm:text-xl font-bold text-[#2B140E]"
                  style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
                >
                  {t.bestSellers}
                </h2>
                <p className="text-xs text-[#8C6212]">
                  {language === 'ar' ? 'أكثر الأصناف طلباً في الحوامدية' : 'Most ordered handcrafted favorites'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellerProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* MAIN PRODUCT GRID */}
        <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl sm:text-2xl font-black text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              {selectedCategory === 'all'
                ? language === 'ar'
                  ? 'جميع الحلويات والمشروبات'
                  : 'Full Cafe & Dessert Menu'
                : t.categories[selectedCategory] || selectedCategory}
            </h2>
            <span className="text-xs font-semibold text-[#8C6212]">
              {filteredProducts.length} {language === 'ar' ? 'صنف' : 'items'}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-[#D4AF37]/20 p-8 shadow-xs">
              <Coffee className="w-12 h-12 text-[#D4AF37] mx-auto opacity-50" />
              <h3 className="text-lg font-bold text-[#2B140E]">
                {language === 'ar' ? 'لم نتمكن من العثور على نتائج' : 'No items match your search'}
              </h3>
              <p className="text-xs text-[#2B140E]/70 max-w-sm mx-auto">
                {language === 'ar'
                  ? 'جرب البحث بكلمة أخرى أو اختر من الأقسام الـ ١٩ المتاحة في القائمة أعلاه.'
                  : 'Try adjusting your search terms or browse our 19 categories in the menu bar.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06]"
              >
                {t.allCategories}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MOBILE FLOATING CART ACTION BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-between shadow-2xl transition-transform active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
              boxShadow: '0 8px 25px rgba(212, 175, 55, 0.5)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-[#1A0A06] text-[#D4AF37]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-bold">
                {totalCartItemCount} {language === 'ar' ? 'أصناف في السلة' : 'Items in Tray'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black">
                {cartTotal} {t.priceCurrency}
              </span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};
