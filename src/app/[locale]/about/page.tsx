import { getTranslations } from 'next-intl/server';
import { getSiteSettings } from '@/lib/store';
import { CreatorLinks } from '@/components/site/creator-links';
import { PixelCanvas } from '@/components/ui/pixel-canvas';
import { Reveal } from '@/components/site/reveal';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const s = await getSiteSettings();
  const t = await getTranslations('about');
  const hasCreator = s.creatorName || s.creatorEmail || s.creatorX || s.creatorTelegram;

  return (
    <div className="px-9 pb-32 pt-[140px]">
      <div className="mx-auto max-w-[820px]">
        <Reveal>
          <div className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-accent">{t('eyebrow')}</div>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-[-.03em]">
            {s.aboutTitle || t('titleFallback')}
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          {s.aboutBody ? (
            <div className="mt-7 space-y-4 text-[1.05rem] leading-relaxed text-ink2">
              {s.aboutBody.split('\n').map((p) => p.trim()).filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="mt-7 text-ink3">{t('empty')}</p>
          )}
        </Reveal>

        {hasCreator && (
          <Reveal delay={0.16} className="relative mt-12 block overflow-hidden rounded-3xl border border-line bg-surface p-7 backdrop-blur">
            <PixelCanvas gap={8} speed={30} colors={['#93c5fd', '#c4b5fd', '#f5d0fe']} variant="default" />
            <div className="relative z-10">
              <div className="font-mono text-[11px] uppercase tracking-[.2em] text-ink3">{t('createdBy')}</div>
              {s.creatorName && <div className="mt-2 font-display text-[1.3rem] font-semibold">{s.creatorName}</div>}
              <div className="mt-4">
                <CreatorLinks settings={s} />
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
