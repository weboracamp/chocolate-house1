import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Send,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export const ContactUsPage: React.FC = () => {
  const { language, t, siteConfig, faqs, submitContactMessage } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await submitContactMessage({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        subject: formData.subject || (language === 'ar' ? 'استفسار عام' : 'General Inquiry'),
        message: formData.message,
      });

      if (ok) {
        setSubmittedSuccess(true);
        setFormData({
          name: '',
          phone: '',
          email: '',
          subject: '',
          message: '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2B140E]">
      <Header />

      <main className="flex-1 w-full">
        {/* 1. HERO BANNER */}
        <section
          className="relative py-14 sm:py-20 px-4 sm:px-6 text-[#FFF5E1] text-center overflow-hidden"
          style={{
            backgroundColor: 'var(--color-chocolate, #1A0A06)',
            background: 'linear-gradient(180deg, #150805 0%, #240E08 50%, #1A0A06 100%)',
          }}
        >
          <div className="absolute inset-0 m-auto w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F7E7A9]">
              <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'ar' ? 'نسعد بخدمتكم والتواصل معكم دائماً' : 'We are always delighted to connect with you'}</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-black text-[#FFF5E1] tracking-tight leading-tight"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'تواصل مع شوكلت هاوس' : 'Contact Chocolate House'}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#F7E7A9]/85 max-w-xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'استفسارات الطلبات، المناسبات، خدمة التوصيل، والاقتراحات في فرع الحوامدية، الجيزة.'
                : 'Order inquiries, special catering, delivery support & feedback in Al Hawamdeya, Giza.'}
            </p>
          </div>
        </section>

        {/* 2. CONTACT CHANNELS GRID */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone Hotline */}
            <div className="bg-white rounded-2xl p-6 border border-[#D4AF37]/25 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#8C6212]">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#2B140E]">
                  {language === 'ar' ? 'الخط الساخن والطلبات' : 'Order Hotline'}
                </h3>
                <p className="text-xs text-[#2B140E]/70">
                  {language === 'ar' ? 'للطلبات السريعة وخدمة التوصيل' : 'Direct line for phone orders & delivery'}
                </p>
              </div>
              <a
                href={`tel:${siteConfig.phone}`}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1A0A06] text-[#F7E7A9] hover:bg-[#2B140E] transition-colors"
              >
                <span>{siteConfig.phone}</span>
              </a>
            </div>

            {/* WhatsApp Direct */}
            <div className="bg-white rounded-2xl p-6 border border-[#D4AF37]/25 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#2B140E]">
                  {language === 'ar' ? 'محادثة واتساب' : 'WhatsApp Support'}
                </h3>
                <p className="text-xs text-[#2B140E]/70">
                  {language === 'ar' ? 'تواصل شات مباشر مع الكافيه' : 'Instant chat & order confirmation'}
                </p>
              </div>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                  language === 'ar' ? 'مرحباً، أود التواصل مع كافيه شوكلت هاوس' : 'Hello Chocolate House!'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:bg-[#20b858] transition-colors"
              >
                <span>{language === 'ar' ? 'فتح المحادثة' : 'Chat on WhatsApp'}</span>
              </a>
            </div>

            {/* Store Location */}
            <div className="bg-white rounded-2xl p-6 border border-[#D4AF37]/25 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#8C6212]">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#2B140E]">
                  {language === 'ar' ? 'موقع الفرع' : 'Cafe Location'}
                </h3>
                <p className="text-xs text-[#2B140E]/70">
                  {language === 'ar' ? siteConfig.address_ar : siteConfig.address_en}
                </p>
              </div>
              <a
                href={siteConfig.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#1A0A06] hover:bg-[#B8911F] transition-colors"
              >
                <span>{language === 'ar' ? 'خرائط جوجل' : 'Google Maps'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-2xl p-6 border border-[#D4AF37]/25 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#8C6212]">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#2B140E]">
                  {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                </h3>
                <p className="text-xs text-[#2B140E]/70 font-semibold">
                  {language === 'ar' ? siteConfig.openingHours_ar : siteConfig.openingHours_en}
                </p>
              </div>
              <div className="py-2.5 px-4 rounded-xl text-xs text-center font-bold bg-[#FFF5E1] text-[#8C6212] border border-[#D4AF37]/30">
                {language === 'ar' ? 'مفتوح طوال أيام الأسبوع' : 'Open 7 Days a Week'}
              </div>
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE CONTACT FORM & MAP VIEW */}
        <section className="py-8 sm:py-14 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2
                  className="text-2xl sm:text-3xl font-extrabold text-[#2B140E]"
                  style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
                >
                  {language === 'ar' ? 'أرسل لنا رسالة أو استفساراً' : 'Send Us a Message'}
                </h2>
                <p className="text-xs sm:text-sm text-[#2B140E]/70">
                  {language === 'ar'
                    ? 'فريق إدارة شوكلت هاوس يسعد بالرد على جميع استفساراتكم وملاحظاتكم.'
                    : 'Our team is ready to respond to your orders, suggestions, or special requests.'}
                </p>
              </div>

              {submittedSuccess ? (
                <div className="p-6 rounded-2xl bg-[#FFF5E1] border border-[#D4AF37] text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#D4AF37] mx-auto" />
                  <h3 className="text-lg font-bold text-[#1A0A06]">
                    {language === 'ar' ? 'تم استلام رسالتك بنجاح!' : 'Message Received Successfully!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#2B140E]/80 max-w-md mx-auto">
                    {language === 'ar'
                      ? 'شكراً لتواصلك مع شوكلت هاوس. سنقوم بمراجعة رسالتك والتواصل معك قريباً.'
                      : 'Thank you for contacting Chocolate House. We will review your message and reach out promptly.'}
                  </p>
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="mt-2 px-6 py-2 rounded-full text-xs font-bold bg-[#1A0A06] text-[#F7E7A9] hover:bg-[#2B140E]"
                  >
                    {language === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2B140E] mb-1.5">
                        {language === 'ar' ? 'الاسم بالكامل *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'ar' ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                        className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs sm:text-sm bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B140E] mb-1.5">
                        {language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01112437437"
                        className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs sm:text-sm bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2B140E] mb-1.5">
                        {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs sm:text-sm bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B140E] mb-1.5">
                        {language === 'ar' ? 'موضوع الرسالة' : 'Subject'}
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder={language === 'ar' ? 'طلب مناسبة خاصة، توصيل، اقتراح...' : 'Order inquiry, feedback, catering...'}
                        className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs sm:text-sm bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B140E] mb-1.5">
                      {language === 'ar' ? 'نص الرسالة أو الاستفسار *' : 'Your Message *'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={
                        language === 'ar'
                          ? 'اكتب تفاصيل طلبك أو استفسارك هنا وسنقوم بالرد عليك سريعاً...'
                          : 'Write the details of your inquiry or feedback here...'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs sm:text-sm bg-[#FFFBF5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1A0A06] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                    }}
                  >
                    <Send className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    <span>
                      {isSubmitting
                        ? language === 'ar'
                          ? 'جاري الإرسال...'
                          : 'Sending...'
                        : language === 'ar'
                        ? 'إرسال الرسالة الآن'
                        : 'Submit Message'}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* Direct Location Map & Address Box (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#1A0A06] text-[#FFF5E1] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#F7E7A9]"
                    style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
                  >
                    {language === 'ar' ? 'العنوان وتفاصيل الوصول' : 'Store Location & Directions'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#FFF5E1]/90">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-[#D4AF37]/20">
                    <p className="text-[11px] font-bold text-[#D4AF37] uppercase">
                      {language === 'ar' ? 'العنوان بالعربية' : 'Arabic Address'}
                    </p>
                    <p className="font-semibold text-white mt-0.5" dir="rtl">
                      {siteConfig.address_ar}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-[#D4AF37]/20">
                    <p className="text-[11px] font-bold text-[#D4AF37] uppercase">
                      {language === 'ar' ? 'العنوان بالإنجليزية' : 'English Address'}
                    </p>
                    <p className="font-semibold text-white mt-0.5">
                      {siteConfig.address_en}
                    </p>
                  </div>

                  <p className="text-xs text-[#F7E7A9]/75 leading-relaxed">
                    {language === 'ar' ? siteConfig.deliveryNotice_ar : siteConfig.deliveryNotice_en}
                  </p>
                </div>

                <a
                  href={siteConfig.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#1A0A06] shadow-lg transition-all active:scale-98"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
                  }}
                >
                  <span>{language === 'ar' ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. DYNAMIC FAQS ACCORDION */}
        <section className="py-14 sm:py-18 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#8C6212]">
              <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[#2B140E]"
              style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Playfair Display', serif" }}
            >
              {language === 'ar' ? 'إجابات عن استفساراتكم' : 'Quick Help & Answers'}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[#D4AF37]/25 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#2B140E] hover:text-[#8C6212] transition-colors"
                  >
                    <span>{language === 'ar' ? faq.question_ar : faq.question_en}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#2B140E]/80 leading-relaxed border-t border-[#D4AF37]/10">
                      {language === 'ar' ? faq.answer_ar : faq.answer_en}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
