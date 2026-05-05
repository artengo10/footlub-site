import type { Metadata } from 'next';
import Link from 'next/link';
import { products } from '@/data/products';
import styles from './shop.module.css';

export const metadata: Metadata = {
  title: 'Магазин — FootLub',
  description: 'Три типа индивидуальных спортивных стелек FootLub: Базовая, Спортивная, Профессиональная. Цены от 3 000 до 4 500 ₽. Доставка по всей России.',
  alternates: { canonical: 'https://footlub.ru/shop' },
};

export default function ShopPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Магазин</h1>
        <p className={styles.sub}>
          Все стельки изготавливаются индивидуально после сканирования стопы в приложении FootLub.
        </p>
        <div className={styles.grid}>
          {products.map((p) => (
            <Link key={p.slug} href={`/shop/${p.slug}`} className={`${styles.card} ${p.highlight ? styles.cardHighlight : ''}`}>
              {p.badge && <div className={styles.badge}>{p.badge}</div>}
              <h2 className={styles.name}>{p.name}</h2>
              <div className={styles.price}>{p.price}</div>
              <p className={styles.desc}>{p.desc}</p>
              <ul className={styles.features}>
                {p.features.slice(0, 3).map((f) => (
                  <li key={f} className={styles.feature}>
                    <span className={styles.check}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className={styles.more}>Подробнее →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
