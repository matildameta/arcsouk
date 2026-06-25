'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wallet, Store, HandCoins, Package, Gavel, TrendingUp, Timer, Trophy, type LucideIcon } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

function Step({ n, icon: Icon, text, tone, delay }: { n: number; icon: LucideIcon; text: string; tone: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className="relative flex gap-4 rounded-2xl border border-line bg-surface p-5 backdrop-blur"
    >
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-glow" style={{ background: tone }}>
        <Icon size={22} />
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-line bg-bg font-mono text-[11px] font-semibold text-ink">
          {n}
        </span>
      </div>
      <p className="self-center text-[15px] leading-snug text-ink2">{text}</p>
    </motion.div>
  );
}

function Track({
  title,
  steps,
  accent,
}: {
  title: string;
  steps: { icon: LucideIcon; text: string }[];
  accent: string;
}) {
  return (
    <div className="relative">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
        <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">{title}</h2>
      </div>
      {/* connecting line */}
      <div className="absolute left-[2.9rem] top-[5.2rem] bottom-6 hidden w-px sm:block" style={{ background: `linear-gradient(${accent},transparent)` }} />
      <div className="space-y-3">
        {steps.map((s, i) => (
          <Step key={i} n={i + 1} icon={s.icon} text={s.text} tone={accent} delay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const t = useTranslations('how');

  const buy = [
    { icon: Wallet, text: t('buy1') },
    { icon: Store, text: t('buy2') },
    { icon: HandCoins, text: t('buy3') },
    { icon: Package, text: t('buy4') },
  ];
  const auction = [
    { icon: Gavel, text: t('a1') },
    { icon: TrendingUp, text: t('a2') },
    { icon: Timer, text: t('a3') },
    { icon: Trophy, text: t('a4') },
  ];

  return (
    <div className="px-6 pb-32 pt-[150px] sm:px-9">
      <div className="mx-auto max-w-[1040px]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-accent">Arc Souk</div>
          <h1 className="mx-auto max-w-[16ch] font-display text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-.03em]">
            {t('title')}
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1.05rem] text-ink2">{t('subtitle')}</p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8">
          <Track title={t('buyTitle')} steps={buy} accent="var(--accent)" />
          <Track title={t('auctionTitle')} steps={auction} accent="var(--accent-4)" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-14 overflow-hidden rounded-3xl border border-line bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] p-7 text-center backdrop-blur"
        >
          <p className="mx-auto max-w-[62ch] text-[1.02rem] text-ink2">{t('note')}</p>
        </motion.div>
      </div>
    </div>
  );
}
