import type { ReactNode } from "react";

import bagImage from "@/assets/products/bag.webp";
import earbudsImage from "@/assets/products/earbuds.webp";
import watchImage from "@/assets/products/watch.webp";

// Decorative composition for the brand panel. Product names, prices and photos are placeholders.

// Cardboard parcel: lid with a tape strip, body with a shipping label.
const BoxIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
  >
    <rect x="3" y="6" width="18" height="4.5" rx="1" />
    <path d="M4.5 10.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8.5" />
    <path d="M10 6v4.5M14 6v4.5" />
    <path d="M8 15h4" />
  </svg>
);

interface ProductCardProps {
  className: string;
  tile: string;
  /** Product photo (transparent background). */
  image: string;
  name: string;
  oldPrice?: string;
  price: string;
  rating: string;
  badge?: ReactNode;
}

function ProductCard({
  className,
  tile,
  image,
  name,
  oldPrice,
  price,
  rating,
  badge,
}: ProductCardProps) {
  return (
    <div
      className={`absolute w-36 rounded-2xl bg-white p-3 shadow-2xl shadow-black/25 xl:w-44 2xl:w-52 ${className}`}
    >
      {badge}
      <div
        className={`relative flex h-28 items-center justify-center rounded-xl p-2 xl:h-32 2xl:h-40 ${tile}`}
      >
        <img
          src={image}
          alt=""
          className="max-h-full w-auto object-contain drop-shadow-lg"
        />
        <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold whitespace-nowrap 2xl:text-sm text-brand-700 shadow-sm">
          <span aria-hidden>★</span>
          {rating}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold text-ink 2xl:text-base">{name}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          {oldPrice && (
            <span className="text-xs text-gray-500 line-through 2xl:text-sm">
              {oldPrice}
            </span>
          )}
          <span className="text-sm font-bold text-brand-700 2xl:text-base">{price}</span>
        </p>
      </div>
    </div>
  );
}

// 14-point starburst outline for the discount badges.
const STARBURST = Array.from({ length: 28 }, (_, i) => {
  const radius = i % 2 === 0 ? 47 : 41;
  const angle = (Math.PI * 2 * i) / 28 - Math.PI / 2;
  return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

interface DiscountBadgeProps {
  value: string;
  className: string;
}

function DiscountBadge({ value, className }: DiscountBadgeProps) {
  return (
    <div
      className={`absolute z-10 size-20 drop-shadow-xl xl:size-24 2xl:size-28 ${className}`}
    >
      <svg viewBox="0 0 100 100" className="size-full">
        <polygon
          points={STARBURST}
          className="fill-sale stroke-white"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-ink">
        <span className="text-2xl leading-none font-extrabold xl:text-3xl 2xl:text-4xl">
          {value}
        </span>
        <span className="mt-0.5 text-[0.7rem] font-bold tracking-wider xl:text-xs 2xl:text-sm">
          İNDİRİM
        </span>
      </div>
    </div>
  );
}

export function ShoppingVisual() {
  return (
    <div
      aria-hidden
      className="relative mx-auto h-84 w-full max-w-xl xl:h-92 2xl:h-100 2xl:max-w-3xl"
    >
      {/* Soft rings behind the cards */}
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 xl:size-96 2xl:size-128" />
      <div className="absolute top-1/2 left-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 xl:size-72 2xl:size-96" />

      <ProductCard
        className="top-12 left-0 -rotate-6 xl:top-14 2xl:top-16"
        tile="bg-gradient-to-br from-brand-50 to-brand-200"
        image={bagImage}
        name="Omuz Çantası"
        oldPrice="₺2.498"
        price="₺1.249"
        rating="4,8"
        badge={
          <DiscountBadge value="%50" className="-top-6 -left-6 -rotate-6" />
        }
      />
      <ProductCard
        className="top-0 left-1/2 -translate-x-1/2"
        tile="bg-gradient-to-br from-amber-50 to-amber-200"
        image={earbudsImage}
        name="Kulaklık"
        price="₺1.899"
        rating="4,7"
      />
      <ProductCard
        className="top-12 right-0 rotate-6 xl:top-14 2xl:top-16"
        tile="bg-gradient-to-br from-gray-50 to-gray-200"
        image={watchImage}
        name="Akıllı Saat"
        oldPrice="₺4.374"
        price="₺3.499"
        rating="4,9"
        badge={
          <DiscountBadge value="%20" className="-top-7 -right-9 rotate-6" />
        }
      />

      {/* Order tracking chip: centred under the three products */}
      <div className="absolute bottom-0 left-1/2 z-20 w-64 -translate-x-1/2 rounded-2xl bg-white/95 p-3.5 2xl:w-72 2xl:p-4 shadow-2xl shadow-black/25">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <BoxIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink 2xl:text-base">
              Siparişin yolda
            </p>
            <p className="text-xs text-gray-600 2xl:text-sm">
              Tahmini teslimat: yarın
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-2/3 rounded-full bg-brand-600" />
        </div>
      </div>
    </div>
  );
}
