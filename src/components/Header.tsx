import React from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { ShoppingBag, Globe, Phone, Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, t, cartCount, setIsCartOpen } = useStore();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b transition-all"
      style={{
        backgroundColor: 'var(--color-chocolate)',
        borderColor: 'rgba(212, 175, 55, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Top micro-bar for hours & phone */}
      <div className="w-full bg-[#1A0A06] border-b border-[#D4AF37]/15 px-4 py-1 text-xs text-[#F7E7A9]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-medium">{t.hoursText}</span>
          </div>
          <a
            href="tel:01112437437"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-[#D4AF37]" />
            <span className="font-semibold tracking-wider">01112437437</span>
          </a>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Left: Brand Identity with Authentic Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <Logo size="sm" />
            <div className="flex flex-col">
              <span
                className="text-lg sm:text-2xl font-bold tracking-tight text-[#FFF5E1] group-hover:text-[#F7E7A9] transition-colors leading-tight"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
              >
                {language === 'ar' ? 'شوكلت هاوس' : 'Chocolate House'}
              </span>
              <span className="text-[10px] sm:text-xs text-[#D4AF37] font-medium tracking-wide">
                {language === 'ar' ? 'كافيه وحلويات فاخرة' : 'Handcrafted Cafe & Desserts'}
              </span>
            </div>
          </a>
        </div>

        {/* Right: Language Switcher & Cart */}
        <div className="flex items-center gap-2 sm:gap-4">
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
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full font-semibold text-sm transition-all duration-200 shadow-md active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
            }}
          >
            <ShoppingBag className="w-4 h-4 text-[#1A0A06]" />
            <span className="hidden sm:inline font-bold">{t.cart}</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#1A0A06] text-[#F7E7A9] text-xs font-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
