'use client';

import { useRef, type PointerEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { type Product, toneStyles } from '@/lib/mock-data';
import { formatUsdc } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations();
  const tone = toneStyles[product.tone];
  const cover = product.images?.[0];
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.transform = `rotateX(${((0.5 - py) * 12).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg)`;
    if (glareRef.current) {
      glareRef.current.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      glareRef.current.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    }
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'rotateX(0) rotateY(0)';
  };

  // The whole card is a link to the product page — clicking anywhere opens it.
  return (
    <Link
      href={`/product/${product.slug}`}
      data-cursor
      aria-label={`${product.name} — ${t('home.viewPiece')}`}
      className="group block"
      style={{ perspective: '1100px' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[18px] border border-line bg-surface backdrop-blur transition-transform duration-500 ease-lux sm:rounded-[20px]"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <span className="absolute left-3 top-3 z-[2] rounded-full border border-line bg-white/70 px-2.5 py-1 font-mono text-[10px] tracking-wide text-ink backdrop-blur dark:bg-black/40 dark:text-white sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]">
          {product.edition}
        </span>
        <div className="relative grid h-[180px] place-items-center overflow-hidden sm:h-[260px] lg:h-[320px]" style={{ background: tone.art }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105"
            />
          ) : product.video ? (
            <video src={product.video} className="absolute inset-0 h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata" />
          ) : (
            <div
              className="h-[120px] w-[84px] sm:h-[200px] sm:w-[140px]"
              style={{
                borderRadius: '50% 50% 8% 8%/66% 66% 8% 8%',
                background: tone.obj,
                boxShadow: 'inset -16px -12px 40px rgba(0,0,0,.32),inset 12px 10px 30px rgba(255,255,255,.6)',
                transform: 'translateZ(60px)',
              }}
            />
          )}
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: 'radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.26),transparent 45%)' }}
          />
        </div>
        <div className="p-4 sm:p-6" style={{ transform: 'translateZ(40px)' }}>
          <div className="truncate font-display text-[1.05rem] font-medium tracking-tight sm:text-[1.45rem]">{product.name}</div>
          <div className="mb-3 mt-1 truncate text-[11px] text-ink3 sm:mb-[18px] sm:text-[13px]">{product.category}</div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono">
              <span className="text-[1.15rem] font-semibold sm:text-[1.7rem]">{formatUsdc(product.priceUsdc)}</span>{' '}
              <span className="text-[.7rem] tracking-wide text-accent sm:text-[.8rem]">{t('common.price')}</span>
            </span>
            <span className="inline-block rounded-full bg-brand px-3 py-2 text-[11px] font-semibold text-white transition group-hover:scale-105 sm:px-5 sm:py-2.5 sm:text-[13px]">
              {t('home.viewPiece')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
