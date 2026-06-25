'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { HelpCircle, Info, UserCircle, Store, Gavel, LayoutDashboard, Menu, X, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { AccountButton } from './account-button';
import { ConnectWallet } from '@/components/web3/connect-wallet';

function ArchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" className="h-4 w-4">
      <path d="M5 20V12a7 7 0 0 1 14 0v8" />
    </svg>
  );
}

export function Navbar() {
  const t = useTranslations('nav');
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user?.isAdmin);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const links: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/how-it-works', label: t('howItWorks'), icon: HelpCircle },
    { href: '/about', label: t('about'), icon: Info },
    { href: '/profile', label: t('profile'), icon: UserCircle },
    { href: '/shop', label: t('shop'), icon: Store },
    { href: '/bids', label: t('bids'), icon: Gavel },
  ];
  if (isAdmin) links.push({ href: '/admin', label: t('admin'), icon: LayoutDashboard });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-[18px] z-50 px-4" ref={ref}>
      <nav className="mx-auto flex h-16 max-w-[1220px] items-center justify-between rounded-full border border-line bg-[color-mix(in_srgb,var(--bg)_62%,transparent)] pl-[18px] pr-[10px] shadow-[0_8px_40px_-16px_rgba(20,30,60,.22)] backdrop-blur-xl sm:pl-[22px] sm:pr-[14px]">
        <Link href="/" data-cursor onClick={() => setOpen(false)} className="flex items-center gap-[11px] font-display text-[21px] font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand shadow-glow">
            <ArchGlyph />
          </span>
          Arc&nbsp;<span className="bg-brand-text bg-clip-text text-transparent">Souk</span>
        </Link>

        <div className="hidden gap-6 text-sm text-ink2 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-1.5 whitespace-nowrap transition hover:text-ink">
              <l.icon size={16} className="opacity-70" /> {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-[7px] sm:gap-[9px]">
          <div className="hidden items-center gap-[9px] lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <ConnectWallet className="!px-3 !py-2.5 text-[12.5px] sm:!px-4" />
          <AccountButton />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-line text-ink2 transition hover:text-ink lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="mx-auto mt-2 max-w-[1220px] overflow-hidden rounded-3xl border border-line bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] p-2 shadow-2xl backdrop-blur-xl lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-ink2 transition hover:bg-surface hover:text-ink"
            >
              <l.icon size={18} className="opacity-70" /> {l.label}
            </Link>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t border-line px-3 pt-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
