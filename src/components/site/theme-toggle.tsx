'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = theme === 'dark';

  return (
    <button
      data-cursor
      aria-label="Toggle theme"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="grid h-[38px] w-[38px] place-items-center rounded-full border border-line bg-surface text-ink transition hover:-translate-y-px hover:border-lineStrong"
    >
      {mounted ? dark ? <Sun size={17} /> : <Moon size={17} /> : <span className="h-[17px] w-[17px]" />}
    </button>
  );
}
