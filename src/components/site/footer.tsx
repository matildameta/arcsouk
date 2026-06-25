'use client';

import { useTranslations } from 'next-intl';
import type { SiteSettings } from '@/lib/store';
import { CreatorLinks } from './creator-links';

export function Footer({ settings }: { settings: SiteSettings }) {
  const t = useTranslations('footer');
  return (
    <footer className="relative z-[4] border-t border-line py-14 font-mono text-xs text-ink3">
      <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-4 px-9">
        <span>{t('rights')}</span>
        <CreatorLinks settings={settings} size={16} />
        <span>{t('tagline')}</span>
      </div>
    </footer>
  );
}
