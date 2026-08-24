import React from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { MapPin, Phone, Clock, ExternalLink, MessageCircle, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, t } = useStore();

  const googleMapsUrl = 'https://maps.app.goo.gl/AxWMKsKdfzpvW4gv5?g_st=ic';
  const phoneNumber = '01112437437';

  return (
    <footer
      className="w-full border-t text-[#FFF5E1] pt-12 pb-8"
      style={{
        backgroundColor: 'var(--color-chocolate)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Main 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#D4AF37]/20">
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col items-start gap-4">
            <Logo size="md" showTagline={true} />
            <p className="text-sm text-[#F7E7A9]/80 leading-relaxed max-w-sm mt-2">
              {language === 'ar'
                ? 'شوكلت هاوس - وجهتك الأولى لأرقى أصناف الشوكولاتة البلجيكية، المولتن كيك، الوافل، والمشروبات الساخنة والمثلجة المحضرة يومياً بكل حب.'
                : 'Chocolate House is your premier destination for handcrafted Belgian chocolates, molten lava cakes, crispy waffles, and artisanal specialty brews.'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href={`https://wa.me/201112437437?text=${encodeURIComponent(
                  language === 'ar' ? 'مرحباً، أود الاستفسار عن منيو شوكلت هاوس' : 'Hello Chocolate House!'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F7E7A9] hover:bg-[#D4AF37]/30 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>{phoneNumber}</span>
              </a>
            </div>
          </div>

          {/* Column 2: Exact Address & Location (Strictly Required) */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-base sm:text-lg font-bold text-[#F7E7A9] flex items-center gap-2 border-b border-[#D4AF37]/20 pb-2"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              <MapPin className="w-5 h-5 text-[#D4AF37]" />
              <span>{t.addressTitle}</span>
            </h3>

            <div className="bg-[#1A0A06] rounded-xl p-4 border border-[#D4AF37]/25 space-y-3">
              <div>
                <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
                  {language === 'ar' ? 'العنوان باللغة الإنجليزية' : 'Address (English)'}
                </p>
                <p className="text-sm text-white font-medium">
                  {t.addressEn}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
                  {language === 'ar' ? 'العنوان باللغة العربية' : 'Address (Arabic)'}
                </p>
                <p className="text-sm text-white font-medium" dir="rtl">
                  {t.addressAr}
                </p>
              </div>

              {/* Direct Clickable Google Maps Link */}
              <a
                id="footer-google-maps-link"
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full mt-2 py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  color: '#1A0A06',
                  boxShadow: '0 3px 10px rgba(212, 175, 55, 0.25)',
                }}
              >
                <span>{t.openGoogleMaps}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#1A0A06]" />
              </a>
            </div>
          </div>

          {/* Column 3: Hours & Phone Details */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-base sm:text-lg font-bold text-[#F7E7A9] flex items-center gap-2 border-b border-[#D4AF37]/20 pb-2"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
            >
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <span>{t.openingHours}</span>
            </h3>

            <div className="bg-[#1A0A06] rounded-xl p-4 border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t.hoursText}
                  </p>
                  <p className="text-xs text-[#F7E7A9]/70 mt-0.5">
                    {language === 'ar' ? 'نستقبلكم طوال أيام الأسبوع' : 'Open 7 days a week for dine-in & delivery'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D4AF37]/20 flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-xs text-[#D4AF37] font-semibold">
                    {t.phoneTitle}
                  </p>
                  <a
                    href={`tel:${phoneNumber}`}
                    className="text-base font-bold text-[#F7E7A9] hover:underline"
                  >
                    {phoneNumber}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & subtle indicator */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F7E7A9]/60 gap-3">
          <p>© {new Date().getFullYear()} Chocolate House - شوكلت هاوس. {t.allRightsReserved}</p>
          <div className="flex items-center gap-1">
            <span>Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
            <span>in Al Hawamdeya, Giza</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
