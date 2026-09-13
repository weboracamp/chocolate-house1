import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryFilter } from './CategoryFilter';
import { ProductCard } from './ProductCard';
import { CategoryType } from '../types';
import heroPinkDrink from '../assets/images/hero-pink-drink.png';
import {
  Search,
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
    features = [],
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

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2B140E]">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col">
        {/* 1. HERO SECTION */}
        <section
          id="hero-section"
          className="relative overflow-hidden text-[#FFF5E1] py-12 sm:py-20 lg:py-24 px-4 sm:px-6 transition-all"
          style={{
            backgroundColor: 'var(--color-chocolate, #1A0A06)',
            background: 'linear-gradient(180deg, #150805 0%, #240E08 50%, #1A0A06 100%)',
          }}
        >
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#8C6212]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-14 relative z-10">
            {/* Left Content Column */}
            <div className="flex-1 text-center lg:text-start space-y-6">
              {/* Hero Main Heading */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#FFF5E1] tracking-tight leading-[1.2] flex flex-col gap-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span>Elevate your day with our coffee</span>
                <span
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F7E7A9] font-bold"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  ارتقي بيومك مع قهوتنا
                </span>
              </h1>

              {/* Hero Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-[#F7E7A9]/85 max-w-xl leading-relaxed mx-auto lg:mx-0">
                {t.heroSubtitle}
              </p>

              {/* Hero CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  id="hero-explore-menu-btn"
                  onClick={scrollToMenu}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm sm:text-base text-[#1A0A06] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-98"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.35)',
                  }}
                >
                  <span>{t.heroCta}</span>
                  <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Right Hero Image (Pink Drink Product Shot on natural dark brown background - no filter/overlay to preserve contrast) */}
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg flex items-center justify-center shrink-0 relative">
              <div className="relative group transition-transform duration-500 hover:scale-[1.02] w-full flex items-center justify-center">
                <img
                  src={heroPinkDrink}
                  alt="Chocolate House Signature Pink Drink"
                  className="w-full h-auto max-h-[360px] sm:max-h-[440px] lg:max-h-[500px] object-contain rounded-2xl select-none pointer-events-none"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. DYNAMIC "FEATURED PRODUCTS" / BEST SELLERS SECTION */}
        {bestSellerProducts.length > 0 && (
          <section
            id="featured-section"
            className="py-14 sm:py-18 px-4 sm:px-6 bg-[#FFFBF5] border-b border-[#D4AF37]/15"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2B140E] tracking-tight"
                    style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
                  >
                    {t.featuredTitle}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#2B140E]/75">
                    {t.featuredSubtitle}
                  </p>
                </div>

                <button
                  onClick={scrollToMenu}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8C6212] hover:text-[#2B140E] transition-colors group"
                >
                  <span>{t.exploreFullMenuBtn}</span>
                  <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </button>
              </div>

              {/* Dynamic 4-Item Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bestSellerProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Centered CTA to full menu */}
              <div className="text-center pt-4">
                <button
                  id="featured-explore-all-btn"
                  onClick={scrollToMenu}
                  className="px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1A0A06] transition-all duration-300 shadow-md hover:shadow-lg active:scale-98"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  }}
                >
                  {t.exploreFullMenuBtn}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 4. SEARCH & 19-CATEGORY MENU SECTION */}
        <section id="menu-section" className="py-10 px-4 sm:px-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Section Heading */}
          <div className="text-center sm:text-left space-y-1">
            <h2
              className="text-2xl sm:text-3xl font-black text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'استكشف قائمة شوكلت هاوس الكاملة' : 'Explore Our Full Cafe Menu'}
            </h2>
            <p className="text-xs sm:text-sm text-[#2B140E]/70">
              {language === 'ar'
                ? '١٩ قسماً متنوعاً من الشوكولاتة البلجيكية، القهوة المختصة، الوافل، والمشروبات الباردة'
                : '19 handcrafted categories of pure Belgian chocolate, artisan coffee & treats'}
            </p>
          </div>

          {/* Sticky Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#D4AF37]/30 shadow-xs p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                {filteredProducts.length} {language === 'ar' ? 'صنف متاح' : 'items available'}
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#8C6212] hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Clear Filter ✕
                </button>
              )}
            </div>
          </div>

          {/* 19 CATEGORIES FILTER SCROLLER */}
          <div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* DYNAMIC PRODUCTS GRID */}
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
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2B140E] text-[#F7E7A9] hover:bg-[#1A0A06] transition-colors"
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
                {totalCartItemCount} {language === 'ar' ? 'أصناف في الصينية' : 'Items in Tray'}
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
