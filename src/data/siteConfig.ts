import { SiteConfig, Testimonial, FAQItem } from '../types';

export const INITIAL_SITE_CONFIG: SiteConfig = {
  name_en: 'Chocolate House',
  name_ar: 'شوكلت هاوس',
  slogan_en: 'Crafted Treats, Artisan Drinks & Sweet Moments',
  slogan_ar: 'حلويات فاخرة، مشروبات مميزة ولحظات لا تُنسى',
  tagline_en: 'Artisanal Belgian Chocolates & Specialty Brews',
  tagline_ar: 'أشهى الشوكولاتة البلجيكية والقهوة المختصة',
  phone: '01112437437',
  whatsapp: '201112437437',
  email: 'info@chocolatehouse.cafe',
  address_en: 'Salah Salem ST, Al Hawamdeya Giza',
  address_ar: 'شارع صلاح سالم، الحوامدية، محافظة الجيزة',
  googleMapsUrl: 'https://maps.app.goo.gl/AxWMKsKdfzpvW4gv5?g_st=ic',
  openingHours_en: 'Daily: 11:00 AM – 4:00 AM (next day)',
  openingHours_ar: 'يومياً: ١١:٠٠ ص – ٤:٠٠ ص (اليوم التالي)',
  deliveryNotice_en: 'Fast local delivery across Al Hawamdeya and nearby areas in Giza',
  deliveryNotice_ar: 'توصيل سريع لكافة أنحاء الحوامدية والمناطق المجاورة بمحافظة الجيزة',
};

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author_en: 'Ahmed M. El-Sayed',
    author_ar: 'أحمد م. السيد',
    role_en: 'Coffee Enthusiast',
    role_ar: 'عاشق للقهوة',
    comment_en:
      'The best Spanish Iced Latte in Al Hawamdeya! The rich Belgian chocolate molten cake is pure perfection.',
    comment_ar:
      'أفضل سبانيش آيس لاتيه في الحوامدية بلا منازع! والمولتن كيك بالشوكولاتة البلجيكية طعمها خيالي ولا يُعلى عليه.',
    rating: 5,
    date: '2026-08-15',
  },
  {
    id: 'test-2',
    author_en: 'Nourhan K.',
    author_ar: 'نورهان ك.',
    role_en: 'Dessert Lover',
    role_ar: 'عشاق الحلويات',
    comment_en:
      'The waffle stick and Nutella ban cakes are always fresh and generously coated with Belgian chocolate.',
    comment_ar:
      'الوافل ستيك والبان كيك بالنوتيلا دايماً فريش وغرقانين بأحلى صوصات شوكولاتة بلجيكية. تجربة ممتازة دائماً.',
    rating: 5,
    date: '2026-08-18',
  },
  {
    id: 'test-3',
    author_en: 'Mahmoud Hassan',
    author_ar: 'محمود حسن',
    role_en: 'Regular Customer',
    role_ar: 'زبون دائم',
    comment_en:
      'Exceptional service, friendly staff, and very fast delivery. The Matcha and Mojitos are super refreshing.',
    comment_ar:
      'خدمة راقية جداً ومعاملة ممتازة وسرعة في التوصيل. الماتشا والموهيتو منعشين ولذيذين جداً.',
    rating: 5,
    date: '2026-08-20',
  },
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question_en: 'Where is Chocolate House located?',
    question_ar: 'أين يقع فرع شوكلت هاوس؟',
    answer_en:
      'We are located on Salah Salem Street, Al Hawamdeya, Giza. You can easily find us on Google Maps using the link on this page.',
    answer_ar:
      'فرعنا يقع في شارع صلاح سالم، الحوامدية، محافظة الجيزة. يمكنك الوصول إلينا بسهولة عبر خرائط جوجل من الرابط المتوفر بالصفحة.',
    category: 'Location',
  },
  {
    id: 'faq-2',
    question_en: 'What kind of chocolate do you use in your desserts?',
    question_ar: 'ما هو نوع الشوكولاتة المستخدم في الحلويات؟',
    answer_en:
      'We exclusively use 100% authentic Belgian chocolate, premium Nutella, and lotus spreads with no artificial additives.',
    answer_ar:
      'نستخدم حصرياً شوكولاتة بلجيكية صافية فاخرة ١٠٠٪، بالإضافة إلى النوتيلا الأصلية وزبدة اللوتس بدون أي زيوت مهدرجة أو نكهات صناعية.',
    category: 'Ingredients',
  },
  {
    id: 'faq-3',
    question_en: 'Do you offer home delivery and takeaway in Al Hawamdeya?',
    question_ar: 'هل يتوفر لديكم توصيل منزلي وخدمة تيك أواي في الحوامدية؟',
    answer_en:
      'Yes! We offer fast direct delivery across all neighborhoods of Al Hawamdeya as well as convenient pickup and dine-in seating.',
    answer_ar:
      'نعم بالتأكيد! نوفر خدمة التوصيل السريع لجميع مناطق وأحياء الحوامدية، بالإضافة لخدمة الاستلام والتيك أواي والجلسات المريحة بالصالة.',
    category: 'Delivery',
  },
  {
    id: 'faq-4',
    question_en: 'What payment methods do you accept?',
    question_ar: 'ما هي طرق الدفع المتاحة لديكم؟',
    answer_en:
      'We accept Cash on Delivery / Dine-in Cash, as well as electronic payment via InstaPay and mobile digital wallets (Vodafone Cash, Orange Cash, etc.).',
    answer_ar:
      'نقبل الدفع نقداً (كاش) عند الاستلام أو بالصالة، وكذلك الدفع الإلكتروني عبر تطبيق إنستاباي (InstaPay) ومحافظ الهواتف الذكية (فودافون كاش، أورنج كاش وغيرها).',
    category: 'Payment',
  },
];
