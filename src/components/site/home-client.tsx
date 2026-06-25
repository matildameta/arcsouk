'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Gavel } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { HeroSculpture } from '@/components/site/hero-sculpture';
import { Marquee } from '@/components/site/marquee';
import { ProductCard } from '@/components/ui/product-card';
import { Reveal } from '@/components/site/reveal';
import { type Product } from '@/lib/mock-data';

const EASE = [0.16, 1, 0.3, 1] as const;

export type HomeBanner = { title: string; body: string };

export function HomeClient({ banner, featured, auctionLive }: { banner: HomeBanner | null; featured: Product[]; auctionLive: boolean }) {
  const t = useTranslations('home');
  const tb = useTranslations('bids');
  const hasTop = Boolean(banner) || auctionLive;

  return (
    <>
      {hasTop && (
        <div className="space-y-2 px-4 pt-[90px]">
          {auctionLive && (
            <Link
              href="/bids"
              data-cursor
              className="mx-auto flex max-w-[1220px] items-center gap-3 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--accent-4)_13%,var(--surface))] px-5 py-3 backdrop-blur transition hover:border-accent"
            >
              <Gavel size={16} className="shrink-0 text-accent" />
              <span className="text-[14px] font-semibold text-ink">{tb('bannerLive')}</span>
              <ArrowRight size={15} className="ms-auto shrink-0 text-ink3" />
            </Link>
          )}
          {banner && (
            <div className="mx-auto flex max-w-[1220px] items-center gap-3 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] px-5 py-3 backdrop-blur">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent2 animate-pulse2" style={{ boxShadow: '0 0 12px var(--accent-2)' }} />
              <p className="text-[14px] leading-snug">
                {banner.title && <span className="font-semibold text-ink">{banner.title}</span>}
                {banner.title && banner.body && <span className="mx-2 text-ink3">·</span>}
                {banner.body && <span className="text-ink2">{banner.body}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      <section className={`relative flex px-9 ${hasTop ? 'items-start pt-[40px] pb-[80px]' : 'min-h-screen items-center pt-[120px] pb-[60px]'}`}>
        <div className="pointer-events-none absolute inset-0 z-[6] hidden md:block">
          <div
            className="absolute grid h-[42px] w-[42px] place-items-center rounded-full bg-accent font-semibold text-white animate-float"
            style={{ top: '6%', left: '52%', boxShadow: '0 10px 30px -6px var(--accent)' }}
          >
            +
          </div>
          <div
            className="absolute grid h-[42px] w-[42px] place-items-center rounded-full font-semibold text-white animate-float"
            style={{ bottom: '24%', right: '7%', background: 'var(--accent-4)', animationDelay: '-2s', boxShadow: '0 10px 30px -6px var(--accent-4)' }}
          >
            +
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 items-center gap-11 lg:grid-cols-[1.02fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="mb-6 inline-flex items-center gap-[10px] font-mono text-[12.5px] uppercase tracking-[.2em] text-accent"
            >
              <span className="h-[7px] w-[7px] rounded-full bg-accent2 animate-pulse2" style={{ boxShadow: '0 0 12px var(--accent-2)' }} />
              {t('eyebrow')}
            </motion.div>

            <h1 className="font-display text-[clamp(3rem,6.4vw,5.6rem)] font-semibold leading-[.94] tracking-[-.035em]">
              <span className="block overflow-hidden">
                <motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
                  {t('title1')}
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block bg-brand-text bg-clip-text text-transparent"
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.12 }}
                >
                  {t('title2')}
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-9 mt-7 max-w-[46ch] text-[clamp(1.02rem,1.4vw,1.22rem)] text-ink2"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.68, duration: 1 }} className="flex flex-wrap gap-[14px]">
              <Link href="/shop" data-cursor className="inline-flex items-center gap-[10px] rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-glow transition hover:-translate-y-[3px]">
                {t('cta')} <ArrowRight size={17} />
              </Link>
              <Link href="/#about" data-cursor className="inline-flex items-center gap-[10px] rounded-full border border-line bg-surface px-7 py-4 font-semibold backdrop-blur transition hover:-translate-y-[3px] hover:border-lineStrong">
                {t('howPay')}
              </Link>
            </motion.div>
          </div>

          <div className="grid place-items-center">
            <HeroSculpture />
          </div>
        </div>
      </section>

      <Marquee />

      <section id="shop" className="relative px-9 py-[120px]">
        <div className="mx-auto max-w-[1220px]">
          <Reveal>
            <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-ink3">{t('featuredLabel')}</div>
          </Reveal>
          <Reveal>
            <h2 className="mb-4 max-w-[18ch] font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold tracking-[-.025em]">{t('featuredTitle')}</h2>
          </Reveal>
          <Reveal>
            <p className="mb-14 max-w-[56ch] text-[1.08rem] text-ink2">{t('featuredSub')}</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-12">
              <Link href="/shop" data-cursor className="inline-flex items-center gap-2 rounded-full border border-lineStrong px-6 py-3 font-semibold transition hover:bg-surface">
                {t('viewAll')} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="about" className="relative px-9 py-[150px] text-center">
        <div className="mx-auto max-w-[1220px]">
          <Reveal>
            <h2 className="font-display text-[clamp(2.4rem,8vw,7rem)] font-semibold leading-[.98] tracking-[-.03em]">
              {t('statement1')}
              <br />
              <em className="bg-brand-text bg-clip-text not-italic text-transparent">{t('statement2')}</em>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mt-[30px] font-mono text-[13px] uppercase tracking-[.18em] text-ink3">{t('statementSub')}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
