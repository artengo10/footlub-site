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
  title: 'FootLub — индивидуальные спортивные стельки с доставкой по России',
  description:
    'FootLub — первый российский сервис индивидуальных спортивных стелек. Сканируйте стопу за 30 секунд в приложении на iPhone и получите стельки из TPU 95A с доставкой по всей России.',
  keywords: [
    'индивидуальные стельки',
    'спортивные стельки',
    'стельки для бега',
    'стельки FootLub',
    'ортопедические стельки купить',
    'стельки под заказ',
    'TPU стельки',
  ],
  metadataBase: new URL('https://footlub.ru'),
  alternates: { canonical: 'https://footlub.ru' },
  openGraph: {
    title: 'FootLub — индивидуальные спортивные стельки',
    description:
      'Сканируйте стопу за 30 секунд. Стельки под вашу анатомию — с доставкой по всей России.',
    locale: 'ru_RU',
    type: 'website',
    url: 'https://footlub.ru',
    siteName: 'FootLub',
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://footlub.ru/#org',
      name: 'FootLub',
      url: 'https://footlub.ru',
      description:
        'Индивидуальные спортивные стельки с заказом через приложение и доставкой по всей России.',
      areaServed: 'RU',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'Russian',
        url: 'https://t.me/footlub_support',
      },
      sameAs: ['https://t.me/footlub_support'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://footlub.ru/#business',
      name: 'FootLub',
      url: 'https://footlub.ru',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109060079','ym');ym(109060079,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`,
          }}
        />
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/109060079" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
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
