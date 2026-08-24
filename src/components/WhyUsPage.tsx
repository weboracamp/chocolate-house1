import React from 'react';
import { useStore } from '../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { Star, ArrowRight, ShieldCheck, Heart, Sparkles, Coffee } from 'lucide-react';

export const WhyUsPage: React.FC = () => {
  const { language, t, features, testimonials, siteConfig, setActiveView } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2B140E]">
      <Header />

      <main className="flex-1 w-full">
        {/* 1. HERO BANNER */}
        <section
          className="relative py-16 sm:py-24 px-4 sm:px-6 text-[#FFF5E1] text-center overflow-hidden"
          style={{
            backgroundColor: 'var(--color-chocolate, #1A0A06)',
            background: 'linear-gradient(180deg, #150805 0%, #240E08 50%, #1A0A06 100%)',
          }}
        >
          <div className="absolute inset-0 m-auto w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F7E7A9]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'ar' ? 'قصتنا وفلسفتنا في صناعة السعادة' : 'Our Story & Culinary Philosophy'}</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-black text-[#FFF5E1] tracking-tight leading-tight"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'لماذا شوكلت هاوس؟' : 'Why Chocolate House?'}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#F7E7A9]/85 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'رحلة شغف بدأت في الحوامدية لتقديم تجربة شوكولاتة وقهوة بمعايير عالمية لا تقبل المساومة على الجودة والبهجة.'
                : 'A passionate journey in Al Hawamdeya, crafted to bring world-class Belgian chocolate and artisanal specialty brews to every cup and plate.'}
            </p>
          </div>
        </section>

        {/* 2. OUR PILLARS / DYNAMIC FEATURES (ICON-FREE MINIMALIST) */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'ركائز تميزنا' : 'Our Core Standards'}
            </h2>
            <p className="text-xs sm:text-sm text-[#2B140E]/75 leading-relaxed">
              {language === 'ar'
                ? 'ثلاثة مبادئ أساسية تصنع الفارق في كل قضمة ورشفة تتذوقها في شوكلت هاوس'
                : 'Three foundational principles that define every bite and sip at Chocolate House'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                id={`why-feature-${feature.id}`}
                className="flex flex-col justify-between rounded-2xl bg-white border border-[#D4AF37]/30 p-8 shadow-sm hover:shadow-md hover:border-[#D4AF37]/60 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#8C6212] tracking-wider uppercase">
                      {language === 'ar' ? `المعيار ٠${idx + 1}` : `Standard 0${idx + 1}`}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#8C6212] text-xs font-bold">
                      ✓
                    </div>
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-bold text-[#2B140E] group-hover:text-[#8C6212] transition-colors leading-snug"
                    style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
                  >
                    {language === 'ar' ? feature.title_ar : feature.title_en}
                  </h3>

                  <div className="w-12 h-0.5 bg-[#D4AF37]/40 group-hover:w-20 transition-all duration-300" />

                  <p className="text-xs sm:text-sm text-[#2B140E]/75 leading-relaxed">
                    {language === 'ar' ? feature.description_ar : feature.description_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. CRAFTSMANSHIP & STATS HIGHLIGHTS */}
        <section className="py-14 sm:py-18 bg-[#1A0A06] text-[#FFF5E1] border-y border-[#D4AF37]/25 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight">100%</span>
              <p className="text-xs sm:text-sm text-[#F7E7A9] font-medium">
                {language === 'ar' ? 'شوكولاتة بلجيكية صافية' : 'Pure Belgian Chocolate'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight">19</span>
              <p className="text-xs sm:text-sm text-[#F7E7A9] font-medium">
                {language === 'ar' ? 'قسماً متنوعاً للمشروبات والحلويات' : 'Artisan Menu Categories'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight">Fresh</span>
              <p className="text-xs sm:text-sm text-[#F7E7A9] font-medium">
                {language === 'ar' ? 'خبز وإعداد يومي فريش' : 'Fresh Daily Baking'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight">4.9 ★</span>
              <p className="text-xs sm:text-sm text-[#F7E7A9] font-medium">
                {language === 'ar' ? 'تقييم زوارنا وسكان الحوامدية' : 'Customer Satisfaction'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. DYNAMIC CUSTOMER REVIEWS & TESTIMONIALS */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'آراء وتجارب عملائنا' : 'What Our Guests Say'}
            </h2>
            <p className="text-xs sm:text-sm text-[#2B140E]/75">
              {language === 'ar'
                ? 'ثقة روادنا وزوارنا في الحوامدية هي الدافع المستمر للإبداع والتطوير'
                : 'Hear from our beloved chocolate lovers and coffee regulars in Al Hawamdeya'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-[#D4AF37]/25 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#2B140E]/85 leading-relaxed italic">
                    "{language === 'ar' ? review.comment_ar : review.comment_en}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-[#2B140E]">
                      {language === 'ar' ? review.author_ar : review.author_en}
                    </h4>
                    <p className="text-[11px] text-[#8C6212]">
                      {language === 'ar' ? review.role_ar : review.role_en}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#2B140E]/50">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. CALL TO ACTION TO MENU */}
        <section className="py-14 px-4 sm:px-6 bg-gradient-to-r from-[#2B140E] to-[#1A0A06] text-[#FFF5E1] text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'جاهز لتجربة مذاق الشوكولاتة والقهوة الفاخرة؟' : 'Ready to Experience Handcrafted Goodness?'}
            </h2>
            <p className="text-xs sm:text-sm text-[#F7E7A9]/80 max-w-xl mx-auto">
              {language === 'ar'
                ? 'استعرض منيو شوكلت هاوس واطلب حلوياتك ومشروباتك المفضلة لتصلك ساخنة وطازجة.'
                : 'Browse our full 19-category cafe menu and order your favorite treats online with ease.'}
            </p>
            <div>
              <button
                onClick={() => setActiveView('store')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1A0A06] shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                }}
              >
                <span>{language === 'ar' ? 'استكشف المنيو واطلب الآن' : 'Explore Full Menu & Order'}</span>
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
