'use client';

import { useState, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from '@/lib/chains';

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const config = createConfig({
  chains: [arcTestnet],
  connectors: [injected(), ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : [])],
  transports: { [arcTestnet.id]: http() },
  ssr: true,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
