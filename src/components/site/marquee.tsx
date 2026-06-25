'use client';

import { useTranslations } from 'next-intl';

export function Marquee() {
  const t = useTranslations('marquee');
  const items = [t('handmade'), t('editions'), t('usdc'), t('provenance'), t('worldwide')];

  return (
    <div className="overflow-hidden border-y border-line bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] py-[26px] backdrop-blur-md">
      <div className="mtrack">
        {[0, 1].map((dup) =>
          items.map((it, i) => (
            <span key={`${dup}-${i}`} className="flex items-center gap-[42px] font-display text-[1.7rem] font-semibold">
              <span className={i % 2 === 1 ? 'bg-brand-text bg-clip-text text-transparent' : 'text-ink'}>{it}</span>
              <span className="text-accent">◆</span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
