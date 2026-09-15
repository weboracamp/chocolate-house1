import { Product, SizeLabelType } from '../types';

export type SizeKey = 'small' | 'large';
export type { SizeLabelType };

export interface SizeConfigOption {
  key: SizeKey;
  label_en: string;
  label_ar: string;
  short_label_en: string;
  short_label_ar: string;
  price: number;
}

/**
 * Checks if a category belongs to the Pancakes / Ban Cake group.
 */
export function isPancakesCategory(category?: string): boolean {
  if (!category) return false;
  const c = category.trim().toLowerCase();
  return c === 'ban cake' || c === 'pancake' || c === 'pancakes';
}

/**
 * Returns the appropriate labels for product sizes.
 * If size_label_type is 'pieces' | 'pancake_pieces' OR the product is in 'Ban Cake' category,
 * it returns "12 Pieces" / "26 Pieces" labels.
 * Otherwise, it returns "Small" / "Large" labels.
 */
export function getProductSizeLabels(product: { category?: string; size_label_type?: SizeLabelType }) {
  const isPieces =
    product.size_label_type === 'pieces' ||
    product.size_label_type === 'pancake_pieces' ||
    (!product.size_label_type && isPancakesCategory(product.category));

  if (isPieces) {
    return {
      type: 'pieces' as const,
      sectionTitleEn: 'Serving Size / Quantity',
      sectionTitleAr: 'الحجم / عدد القطع',
      small: {
        en: '12 Pieces',
        ar: '١٢ قطعة',
        shortEn: '12 Pcs',
        shortAr: '١٢ ق',
      },
      large: {
        en: '26 Pieces',
        ar: '٢٦ قطعة',
        shortEn: '26 Pcs',
        shortAr: '٢٦ ق',
      },
    };
  }

  return {
    type: 'standard' as const,
    sectionTitleEn: 'Choose Size',
    sectionTitleAr: 'اختر الحجم',
    small: {
      en: 'Small',
      ar: 'صغير',
      shortEn: 'Small',
      shortAr: 'صغير',
    },
    large: {
      en: 'Large',
      ar: 'كبير',
      shortEn: 'Large',
      shortAr: 'كبير',
    },
  };
}

/**
 * Validates whether a product has the size system properly configured and enabled.
 * Default is FALSE if not explicitly enabled or if prices are missing.
 */
export function isProductSizeEnabled(product?: Partial<Product> | null): boolean {
  if (!product || !product.has_sizes) return false;
  const small = Number(product.price_small);
  const large = Number(product.price_large);
  return !isNaN(small) && small > 0 && !isNaN(large) && large > 0;
}

/**
 * Returns the two size options with their resolved prices and bilingual labels.
 */
export function getProductSizeOptions(product: Product): SizeConfigOption[] {
  if (!isProductSizeEnabled(product)) return [];

  const labels = getProductSizeLabels(product);
  const priceSmall = Number(product.price_small) || product.price;
  const priceLarge = Number(product.price_large) || product.price;

  return [
    {
      key: 'small',
      label_en: labels.small.en,
      label_ar: labels.small.ar,
      short_label_en: labels.small.shortEn,
      short_label_ar: labels.small.shortAr,
      price: priceSmall,
    },
    {
      key: 'large',
      label_en: labels.large.en,
      label_ar: labels.large.ar,
      short_label_en: labels.large.shortEn,
      short_label_ar: labels.large.shortAr,
      price: priceLarge,
    },
  ];
}

/**
 * Gets the price for a specific size of a product.
 * Falls back to standard product price if sizes are not enabled.
 */
export function getProductEffectivePrice(product: Product, size?: SizeKey): number {
  if (isProductSizeEnabled(product) && size) {
    if (size === 'large') return Number(product.price_large) || product.price;
    return Number(product.price_small) || product.price;
  }
  return product.discount_price && product.discount_price < product.price
    ? product.discount_price
    : product.price;
}
