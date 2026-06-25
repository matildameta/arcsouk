'use client';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { Web3Provider } from '@/components/web3/web3-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Web3Provider>{children}</Web3Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
