import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ActiveViewType } from '../types';
import { Mail, Check, ArrowRight, MessageCircle, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, activeView, setActiveView, subscribeNewsletter } = useStore();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (email.trim() && email.includes('@')) {
      setIsSubmitting(true);
      try {
        const ok = await subscribeNewsletter(email);
        if (ok) {
          setIsSubscribed(true);
          setEmail('');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleNavClick = (view: ActiveViewType, sectionId?: string) => {
    setActiveView(view);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const socialLinks = [
    {
      name: 'Facebook',
      nameAr: 'فيسبوك',
      url: 'https://www.facebook.com/shwklt.haws',
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      nameAr: 'إنستغرام',
      url: 'https://www.instagram.com/chocolate_house778?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==',
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      nameAr: 'تيك توك',
      url: 'https://www.tiktok.com/@chocolate.houset?_r=1&_t=ZS-999gWQ1QYdO',
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      nameAr: 'واتساب',
      url: 'https://wa.me/201112437437',
      icon: <MessageCircle className="w-4.5 h-4.5" />,
    },
  ];

  return (
    <footer
      id="footer-section"
      className="w-full border-t text-[#FFF5E1] pt-14 pb-8 transition-all"
      style={{
        backgroundColor: 'var(--color-chocolate, #1A0A06)',
        borderColor: 'rgba(212, 175, 55, 0.22)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3 Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pb-12">
          {/* Column 1: Newsletter */}
          <div className="space-y-4">
            <div>
              <h3
                className="text-lg sm:text-xl font-bold text-[#F7E7A9] tracking-tight"
                style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
              >
                {language === 'ar' ? 'النشرة البريدية' : 'Newsletter'}
              </h3>
              <p className="text-xs sm:text-sm text-[#FFF5E1]/75 mt-1.5 leading-relaxed">
                {language === 'ar'
                  ? 'اشترك معنا ليصلك أحدث العروض والحلويات والمشروبات الحصرية.'
                  : 'Sign up to receive exclusive offers and sweet updates.'}
              </p>
            </div>

            {isSubscribed ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F7E7A9] text-xs font-semibold">
                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'شكراً لاشتراكك! ستصلك أحدث العروض قريباً.'
                    : 'Thank you for subscribing! Exclusive offers on the way.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني...' : 'Enter your email address...'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#FFF5E1] bg-[#120603] border border-[#D4AF37]/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] placeholder-[#FFF5E1]/40 transition-all"
                  />
                  <Mail className="absolute left-3 w-4 h-4 text-[#D4AF37]/70 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#1A0A06] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  }}
                >
                  <span>{isSubmitting ? (language === 'ar' ? 'جارٍ الاشتراك...' : 'Subscribing...') : (language === 'ar' ? 'اشتراك' : 'Subscribe')}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </form>
            )}
          </div>

          {/* Column 2: Quick Links (Directly Synced with Header Navigation) */}
          <div className="space-y-4">
            <h3
              className="text-lg sm:text-xl font-bold text-[#F7E7A9] tracking-tight"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  id="footer-link-home"
                  onClick={() => handleNavClick('store')}
                  className={`flex items-center gap-2 transition-all group ${
                    activeView === 'store'
                      ? 'text-[#D4AF37] font-extrabold tracking-wide'
                      : 'text-[#FFF5E1]/80 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  id="footer-link-menu"
                  onClick={() => handleNavClick('store', 'menu-section')}
                  className="flex items-center gap-2 text-[#FFF5E1]/80 hover:text-white transition-all group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{language === 'ar' ? 'المنيو والطلب' : 'Menu & Shop'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  id="footer-link-why-us"
                  onClick={() => handleNavClick('why-us')}
                  className={`flex items-center gap-2 transition-all group ${
                    activeView === 'why-us'
                      ? 'text-[#D4AF37] font-extrabold tracking-wide'
                      : 'text-[#FFF5E1]/80 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{language === 'ar' ? 'عن الكافيه والتقييمات' : 'Reviews & Story'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  id="footer-link-contact"
                  onClick={() => handleNavClick('contact')}
                  className={`flex items-center gap-2 transition-all group ${
                    activeView === 'contact'
                      ? 'text-[#D4AF37] font-extrabold tracking-wide'
                      : 'text-[#FFF5E1]/80 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Direct Contact (High Contrast Gold Icons) */}
          <div className="space-y-4">
            <h3
              className="text-lg sm:text-xl font-bold text-[#F7E7A9] tracking-tight"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'تواصل معنا' : 'Connect With Us'}
            </h3>
            <p className="text-xs sm:text-sm text-[#FFF5E1]/75 leading-relaxed">
              {language === 'ar'
                ? 'تابع صفحاتنا الرسمية أو تحدث معنا مباشرة على واتساب.'
                : 'Follow our official channels or reach out directly on WhatsApp.'}
            </p>

            {/* Social Icons Row with 100% Solid Gold High-Contrast Background */}
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  title={language === 'ar' ? social.nameAr : social.name}
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D4AF37] text-[#1A0A06] border border-[#F7E7A9]/40 hover:bg-[#FFF5E1] hover:text-[#1A0A06] hover:scale-110 active:scale-95 transition-all shadow-md shadow-black/20"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Direct WhatsApp Action Link with Crisp Contrast */}
            <div className="pt-2">
              <a
                href="https://wa.me/201112437437"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#25D366] text-white hover:bg-[#20b858] transition-all shadow-sm hover:scale-[1.02] active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-current text-white" />
                <span>WhatsApp: 01112437437</span>
                <ExternalLink className="w-3 h-3 opacity-90" />
              </a>
            </div>
          </div>
        </div>

        {/* Minimalist Centered Bottom Bar */}
        <div className="border-t border-[#D4AF37]/15 pt-6 text-center">
          <p className="text-xs text-[#F7E7A9]/70 tracking-wide font-normal">
            © 2026 Chocolate House - شوكلت هاوس. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};


