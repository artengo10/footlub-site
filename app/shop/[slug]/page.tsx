import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { products } from '@/data/products';
import styles from './product.module.css';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = products.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: `Стелька «${p.name}» — FootLub`,
    description: `${p.tagline}. ${p.desc} Цена ${p.price}. Доставка по всей России.`,
    alternates: { canonical: `https://footlub.ru/shop/${p.slug}` },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = products.find((x) => x.slug === params.slug);
  if (!p) notFound();

  const others = products.filter((x) => x.slug !== p.slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `FootLub ${p.name}`,
    description: p.longDesc,
    brand: { '@type': 'Brand', name: 'FootLub' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: p.priceMin,
      availability: 'https://schema.org/InStock',
      url: `https://footlub.ru/shop/${p.slug}`,
    },
  };

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container">
        <Link href="/shop" className={styles.back}>← Все стельки</Link>

        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            {p.badge && <div className={styles.badge}>{p.badge}</div>}
            <h1 className={styles.name}>Стелька «{p.name}»</h1>
            <p className={styles.tagline}>{p.tagline}</p>
            <div className={styles.price}>{p.price}</div>
            <p className={styles.desc}>{p.longDesc}</p>
            <a
              href="https://apps.apple.com"
              className={styles.cta}
              target="_blank"
              rel="noopener noreferrer"
            >
              Заказать в приложении
            </a>
            <p className={styles.hint}>Скачайте FootLub, отсканируйте стопу — стелька придёт за 5–7 дней</p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.features}>
              <h2 className={styles.featuresTitle}>Характеристики</h2>
              <ul className={styles.featuresList}>
                {p.features.map((f) => (
                  <li key={f} className={styles.featureItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.sports}>
              <h2 className={styles.sportsTitle}>Виды спорта</h2>
              <div className={styles.sportsTags}>
                {p.sports.map((s) => (
                  <span key={s} className={styles.tag}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.steps}>
          <h2 className={styles.stepsTitle}>Как получить стельки</h2>
          <div className={styles.stepsGrid}>
            {[
              { n: '1', text: 'Скачайте приложение FootLub на iPhone' },
              { n: '2', text: 'Отсканируйте стопу за 30 секунд' },
              { n: '3', text: 'Выберите тип стельки и обувь' },
              { n: '4', text: 'Получите заказ за 5–7 дней' },
            ].map((s) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNum}>{s.n}</div>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {others.length > 0 && (
          <div className={styles.related}>
            <h2 className={styles.relatedTitle}>Другие стельки</h2>
            <div className={styles.relatedGrid}>
              {others.map((o) => (
                <Link key={o.slug} href={`/shop/${o.slug}`} className={styles.relatedCard}>
                  {o.badge && <span className={styles.relatedBadge}>{o.badge}</span>}
                  <div className={styles.relatedName}>{o.name}</div>
                  <div className={styles.relatedPrice}>{o.price}</div>
                  <p className={styles.relatedDesc}>{o.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
