import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Inter, JetBrains_Mono, Space_Grotesk, Tajawal, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/site/navbar';
import { Footer } from '@/components/site/footer';
import { MeshBackground } from '@/components/site/mesh-background';
import { Cursor } from '@/components/site/cursor';
import { getSiteSettings } from '@/lib/store';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['500', '700', '900'], variable: '--font-tajawal', display: 'swap' });
const plexAr = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-plex-ar', display: 'swap' });

export const metadata: Metadata = {
  title: 'Arc Souk — handmade art, on-chain',
  description:
    'A bilingual souk of one-of-a-kind handmade gypsum sculptures, paid in USDC on the Arc Network testnet.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const settings = await getSiteSettings();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${grotesk.variable} ${tajawal.variable} ${plexAr.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <MeshBackground />
            <Cursor />
            <Navbar />
            <main className="relative z-[4]">{children}</main>
            <Footer settings={settings} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
