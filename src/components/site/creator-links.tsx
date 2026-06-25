import { Mail, Send, Twitter, type LucideIcon } from 'lucide-react';
import type { SiteSettings } from '@/lib/store';

function normUrl(kind: 'x' | 'telegram', v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  return kind === 'x' ? `https://x.com/${handle}` : `https://t.me/${handle}`;
}

type Item = { href: string; icon: LucideIcon; label: string; external: boolean };

export function CreatorLinks({ settings, size = 18, className = '' }: { settings: SiteSettings; size?: number; className?: string }) {
  const items: Item[] = [];
  if (settings.creatorEmail) items.push({ href: `mailto:${settings.creatorEmail}`, icon: Mail, label: 'Email', external: false });
  if (settings.creatorX) items.push({ href: normUrl('x', settings.creatorX), icon: Twitter, label: 'X', external: true });
  if (settings.creatorTelegram) items.push({ href: normUrl('telegram', settings.creatorTelegram), icon: Send, label: 'Telegram', external: true });
  if (!items.length) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.external ? '_blank' : undefined}
          rel={it.external ? 'noreferrer' : undefined}
          aria-label={it.label}
          title={it.label}
          data-cursor
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink2 transition hover:border-accent hover:text-ink"
        >
          <it.icon size={size} />
        </a>
      ))}
    </div>
  );
}
