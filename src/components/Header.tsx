import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { ShoppingCart, Globe, Menu as MenuIcon, X } from 'lucide-react';
import { ActiveViewType } from '../types';

export const Header: React.FC = () => {
  const { language, setLanguage, t, cartCount, setIsCartOpen, activeView, setActiveView, siteConfig } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: { view: ActiveViewType; label_en: string; label_ar: string }[] = [
    { view: 'store', label_en: 'Home', label_ar: 'الرئيسية' },
    { view: 'why-us', label_en: 'Why Us', label_ar: 'عن الكافيه' },
    { view: 'contact', label_en: 'Contact Us', label_ar: 'تواصل معنا' },
  ];

  const handleNavClick = (view: ActiveViewType) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full border-b transition-all"
      style={{
        backgroundColor: 'var(--color-chocolate, #1A0A06)',
        borderColor: 'rgba(212, 175, 55, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
        {/* Left: Brand Identity with Authentic Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('store')}
            className="flex items-center gap-2.5 group text-left"
          >
            <Logo size="sm" />
            <div className="flex flex-col">
              <span
                className="text-lg sm:text-2xl font-bold tracking-tight text-[#FFF5E1] group-hover:text-[#F7E7A9] transition-colors leading-tight"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
              >
                {language === 'ar' ? siteConfig.name_ar : siteConfig.name_en}
              </span>
              <span className="text-[10px] sm:text-xs text-[#D4AF37] font-medium tracking-wide">
                {language === 'ar' ? siteConfig.slogan_ar : siteConfig.slogan_en}
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Links for Independent Pages */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold text-[#F7E7A9]">
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                id={`nav-link-${link.view}`}
                onClick={() => handleNavClick(link.view)}
                className={`pb-1 transition-all border-b-2 ${
                  isActive
                    ? 'text-white border-[#D4AF37] font-extrabold'
                    : 'border-transparent text-[#F7E7A9]/80 hover:text-white hover:border-[#D4AF37]/50'
                }`}
              >
                {language === 'ar' ? link.label_ar : link.label_en}
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher, Cart & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Language Toggle Button */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderColor: 'rgba(212, 175, 55, 0.4)',
              color: '#F7E7A9',
            }}
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Cart Trigger */}
          <button
            id="cart-trigger-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 min-h-[40px] rounded-full font-bold text-xs sm:text-sm transition-all duration-200 shadow-md active:scale-95 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
            }}
            aria-label="Open cart"
          >
            <ShoppingCart className="w-4 h-4 text-[#1A0A06] shrink-0" />
            <span className="hidden sm:inline">My Cart | طلباتي</span>
            <span className="sm:hidden">{language === 'ar' ? 'السلة' : 'Cart'}</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 rounded-full bg-[#1A0A06] text-[#F7E7A9] text-[10px] sm:text-xs font-black">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[#F7E7A9] hover:bg-white/10 transition-colors border border-[#D4AF37]/30 flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/20 bg-[#1A0A06] px-4 py-3 space-y-1.5 animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => handleNavClick(link.view)}
                className={`w-full min-h-[44px] text-left py-2.5 px-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#D4AF37]/20 text-[#F7E7A9] border border-[#D4AF37]/40'
                    : 'text-[#FFF5E1]/80 hover:bg-white/5'
                }`}
              >
                <span>{language === 'ar' ? link.label_ar : link.label_en}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
              </button>
            );
          })}

          {/* Quick Staff & Owner Navigation inside Mobile Menu */}
          <div className="pt-2 mt-2 border-t border-[#D4AF37]/15 flex items-center gap-2">
            <button
              onClick={() => handleNavClick('cashier')}
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-center bg-white/5 hover:bg-white/10 text-[#F7E7A9] border border-[#D4AF37]/30 transition-colors"
            >
              {t.cashierPortal}
            </button>
            <button
              onClick={() => handleNavClick('owner')}
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold text-center bg-white/5 hover:bg-white/10 text-[#F7E7A9] border border-[#D4AF37]/30 transition-colors"
            >
              {t.ownerPortal}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
