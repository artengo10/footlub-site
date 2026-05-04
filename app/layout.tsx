import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FootLab — индивидуальные спортивные стельки с доставкой по России',
  description:
    'FootLab — первый российский сервис индивидуальных спортивных стелек. Сканируйте стопу за 30 секунд в приложении на iPhone и получите стельки из TPU 95A с доставкой по всей России.',
  keywords: [
    'индивидуальные стельки',
    'спортивные стельки',
    'стельки для бега',
    'стельки FootLab',
    'ортопедические стельки купить',
    'стельки под заказ',
    'TPU стельки',
  ],
  metadataBase: new URL('https://footlab.ru'),
  alternates: { canonical: 'https://footlab.ru' },
  openGraph: {
    title: 'FootLab — индивидуальные спортивные стельки',
    description:
      'Сканируйте стопу за 30 секунд. Стельки под вашу анатомию — с доставкой по всей России.',
    locale: 'ru_RU',
    type: 'website',
    url: 'https://footlab.ru',
    siteName: 'FootLab',
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://footlab.ru/#org',
      name: 'FootLab',
      url: 'https://footlab.ru',
      description:
        'Индивидуальные спортивные стельки с заказом через приложение и доставкой по всей России.',
      areaServed: 'RU',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'Russian',
        url: 'https://t.me/footlab_support',
      },
      sameAs: ['https://t.me/footlab_support'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://footlab.ru/#business',
      name: 'FootLab',
      url: 'https://footlab.ru',
      description:
        'Индивидуальные спортивные стельки из TPU 95A. Сканирование стопы через приложение iPhone за 30 секунд.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Нижний Новгород',
        addressCountry: 'RU',
      },
      priceRange: '₽₽',
      areaServed: 'RU',
    },
  ],
};

/* Runs before React hydration — prevents theme flash */
const themeScript = `(function(){document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'dark');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
