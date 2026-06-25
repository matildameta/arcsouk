'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (l: 'en' | 'ar') => {
    router.replace(pathname, { locale: l });
  };

  return (
    <div className="flex gap-[2px] rounded-full border border-line bg-surface p-[3px]">
      {(['en', 'ar'] as const).map((l) => (
        <button
          key={l}
          data-cursor
          onClick={() => switchTo(l)}
          className={cn(
            'rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wider transition',
            locale === l ? 'bg-brand text-white' : 'text-ink2 hover:text-ink',
          )}
        >
          {l === 'en' ? 'EN' : 'عربي'}
        </button>
      ))}
    </div>
  );
}
