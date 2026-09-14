import React, { useRef } from 'react';
import { CategoryType } from '../types';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: CategoryType | 'all';
  onSelectCategory: (cat: CategoryType | 'all') => void;
}

export const EXACT_CATEGORIES: CategoryType[] = [
  'Iced coffee',
  'Matcha',
  'Beverage Bottle',
  'Frappe',
  'Mojito',
  'Milk Check',
  'Turkish coffee',
  'Nutella',
  'Molten Cake',
  'Ice Cream',
  'Tart Waffles',
  'Cheese Cake',
  'Ban Cake',
  'Waffle Stick',
  'Tiramisu',
  'Cuisson',
  'Donuts',
  'Fadge',
  'Hot coffee',
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { language, t, products } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Get item counts per category
  const getCount = (cat: CategoryType | 'all') => {
    if (cat === 'all') return products.length;
    return products.filter((p) => p.category === cat).length;
  };

  return (
    <div className="w-full relative py-3">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <h2
            className="text-base sm:text-lg font-bold text-[#2B140E]"
            style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
          >
            {language === 'ar' ? 'تصنيفات المنيو' : 'Menu Categories'}
          </h2>
        </div>

        {/* Scroll arrows for quick desktop navigation */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white border border-[#D4AF37]/30 text-[#2B140E] hover:bg-[#D4AF37]/20 transition-colors shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white border border-[#D4AF37]/30 text-[#2B140E] hover:bg-[#D4AF37]/20 transition-colors shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Pills Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 'All' Category */}
        <button
          id="category-all-btn"
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'shadow-md scale-102'
              : 'hover:bg-[#F5EDE0] opacity-85 hover:opacity-100'
          }`}
          style={{
            backgroundColor:
              selectedCategory === 'all' ? 'var(--color-chocolate)' : '#FFFFFF',
            color: selectedCategory === 'all' ? '#F7E7A9' : '#2B140E',
            border:
              selectedCategory === 'all'
                ? '1px solid #D4AF37'
                : '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <span>{t.allCategories}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF37] text-[#1A0A06]'
                : 'bg-[#F4ECDF] text-[#2B140E]'
            }`}
          >
            {getCount('all')}
          </span>
        </button>

        {/* 19 Exact Categories */}
        {EXACT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = getCount(cat);
          const localizedName = t.categories[cat] || cat;

          return (
            <button
              key={cat}
              id={`cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                isSelected
                  ? 'shadow-md scale-102'
                  : 'hover:bg-[#F5EDE0] opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor:
                  isSelected ? 'var(--color-chocolate)' : '#FFFFFF',
                color: isSelected ? '#F7E7A9' : '#2B140E',
                border:
                  isSelected
                    ? '1px solid #D4AF37'
                    : '1px solid rgba(212, 175, 55, 0.25)',
              }}
            >
              <span>{localizedName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-[#D4AF37] text-[#1A0A06]'
                    : 'bg-[#F4ECDF] text-[#2B140E]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
