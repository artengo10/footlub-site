import type { Metadata } from 'next';
import { reviews } from '@/data/reviews';
import styles from './reviews.module.css';

export const metadata: Metadata = {
  title: 'Отзывы — FootLab',
  description:
    'Отзывы покупателей FootLab: бегуны, футболисты, велосипедисты и другие спортсмены об индивидуальных стельках FootLab.',
  alternates: { canonical: 'https://footlab.ru/reviews' },
};

export default function ReviewsPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Отзывы</h1>
        <div className={styles.grid}>
          {reviews.map((r) => (
            <article key={r.id} className={styles.card}>
              <div className={styles.top}>
                <div className={styles.avatar}>{r.initials}</div>
                <div>
                  <div className={styles.name}>{r.name}</div>
                  <div className={styles.meta}>
                    <span className={styles.sport}>{r.sport}</span>
                    <span className={styles.rating}>★ {r.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <p className={styles.text}>{r.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
