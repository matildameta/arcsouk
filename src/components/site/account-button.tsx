'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { User, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function AccountButton() {
  const { data: session, status } = useSession();
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape — NOT on mouse-leave, which used
  // to fire the instant the pointer crossed the gap toward the menu.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status !== 'authenticated') {
    return (
      <Link
        href="/auth/signin"
        data-cursor
        className="flex items-center gap-2 rounded-full bg-brand px-3 py-2.5 font-mono text-[12.5px] font-medium text-white shadow-glow transition hover:-translate-y-0.5 sm:px-4"
      >
        <User size={15} /> <span className="hidden sm:inline">{t('signIn')}</span>
      </Link>
    );
  }

  const u = session.user;
  const initial = (u?.name || u?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        data-cursor
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-[38px] w-[38px] place-items-center rounded-full bg-brand font-semibold text-white"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface2 p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="truncate px-3 py-2 font-mono text-[12px] text-ink3">{u?.email}</div>
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-surface">
            <UserCircle size={16} /> {t('profile')}
          </Link>
          {u?.isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-surface">
              <LayoutDashboard size={16} /> {t('admin')}
            </Link>
          )}
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[color:var(--warn)] transition hover:bg-surface"
          >
            <LogOut size={16} /> {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
