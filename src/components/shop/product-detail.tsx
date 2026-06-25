'use client';

import { useState } from 'react';
import { Play, ArrowLeft, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { type Product, toneStyles } from '@/lib/mock-data';
import { formatUsdc } from '@/lib/utils';
import { BuyButton } from '@/components/shop/buy-button';
import { Lightbox } from '@/components/site/lightbox';

type Media = { type: 'image' | 'video' | 'ph' | 'phv'; url?: string };

export function ProductDetail({ product, usdcDecimals }: { product: Product; usdcDecimals: number }) {
  const tone = toneStyles[product.tone];
  const real: Media[] = [
    ...product.images.map((url) => ({ type: 'image' as const, url })),
    ...(product.video ? [{ type: 'video' as const, url: product.video }] : []),
  ];
  const media: Media[] = real.length > 0 ? real : [{ type: 'ph' }, { type: 'ph' }, { type: 'ph' }, { type: 'phv' }];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = media[active];
  const canZoom = current.type === 'image' && !!current.url;

  // Only real images feed the zoom lightbox (video / placeholders are skipped).
  const imageMedia = media
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.type === 'image' && !!m.url);
  const zoomUrls = imageMedia.map(({ m }) => m.url as string);
  const zoomPos = Math.max(0, imageMedia.findIndex(({ i }) => i === active));

  const openZoom = () => {
    if (canZoom) setZoom(true);
  };
  // Keep the gallery thumbnail in sync while paging through the lightbox.
  const onZoomIndex = (pos: number) => {
    const target = imageMedia[pos];
    if (target) setActive(target.i);
  };

  return (
    <div className="px-9 pb-32 pt-[130px]">
      <div className="mx-auto max-w-[1220px]">
        <Link href="/shop" className="mb-8 inline-flex items-center gap-2 font-mono text-[12px] text-ink2 transition hover:text-ink">
          <ArrowLeft size={15} /> Back to the souk
        </Link>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative grid h-[460px] place-items-center overflow-hidden rounded-[24px] border border-line" style={{ background: tone.art }}>
              {current.type === 'image' && current.url ? (
                <button
                  type="button"
                  onClick={openZoom}
                  aria-label="Zoom image"
                  className="group/zoom absolute inset-0 h-full w-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-lux group-hover/zoom:scale-110"
                  />
                  <span className="pointer-events-none absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover/zoom:opacity-100">
                    <ZoomIn size={16} />
                  </span>
                </button>
              ) : current.type === 'video' && current.url ? (
                <video src={current.url} controls className="h-full w-full object-cover" />
              ) : current.type === 'phv' ? (
                <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-white/80 text-ink shadow-xl backdrop-blur">
                  <Play size={26} className="ml-1" />
                </div>
              ) : (
                <div style={{ height: 260, width: 180, borderRadius: '50% 50% 8% 8%/66% 66% 8% 8%', background: tone.obj, boxShadow: 'inset -18px -14px 44px rgba(0,0,0,.32),inset 14px 12px 32px rgba(255,255,255,.6)' }} />
              )}
              <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-line bg-white/70 px-3 py-1.5 font-mono text-[11px] text-ink backdrop-blur dark:bg-black/40 dark:text-white">
                {product.edition}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {media.map((m, i) => (
                <button
                  key={i}
                  data-cursor
                  onClick={() => setActive(i)}
                  className={`relative grid h-20 w-20 place-items-center overflow-hidden rounded-xl border-2 transition ${active === i ? 'border-accent' : 'border-line'}`}
                  style={{ background: tone.art }}
                  aria-label={`View ${m.type} ${i + 1}`}
                >
                  {m.type === 'image' && m.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  ) : m.type === 'video' || m.type === 'phv' ? (
                    <Play size={16} className="text-ink" />
                  ) : (
                    <span className="h-10 w-7" style={{ borderRadius: '40% 40% 8% 8%/60% 60% 8% 8%', background: tone.obj }} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            className="lg:pt-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            <div className="font-mono text-[12px] uppercase tracking-[.2em] text-accent">{product.category}</div>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-.025em]">{product.name}</h1>
            <p className="mt-5 max-w-[52ch] text-[1.05rem] text-ink2">{product.description}</p>

            <div className="mt-8 flex items-end gap-3 font-mono">
              <span className="text-[2.6rem] font-semibold leading-none">{formatUsdc(product.priceUsdc)}</span>
              <span className="pb-1 text-sm tracking-wide text-accent">USDC</span>
            </div>
            <div className="mt-2 font-mono text-[12px] text-ink3">
              {product.inventory > 0 ? `${product.inventory} available · edition ${product.edition}` : 'Sold out'}
            </div>

            <div className="mt-8">
              {product.inventory > 0 ? (
                <BuyButton productId={product.id} priceUsdc={product.priceUsdc} usdcDecimals={usdcDecimals} />
              ) : (
                <div className="inline-flex rounded-full border border-line px-7 py-4 font-semibold text-ink3">Sold out</div>
              )}
            </div>

            <p className="mt-4 font-mono text-[11px] text-ink3">
              Checkout runs on the Arc Network testnet · ships worldwide after payment confirms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Zoom lightbox — portaled to <body> so it sits above the navbar.
          Arrow keys / buttons page through every image, with a live counter. */}
      <Lightbox
        open={zoom}
        images={zoomUrls}
        index={zoomPos}
        onClose={() => setZoom(false)}
        onIndexChange={onZoomIndex}
        alt={product.name}
      />
    </div>
  );
}
