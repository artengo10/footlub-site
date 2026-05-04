import type { Metadata } from 'next';
import { reviews } from '@/data/reviews';
import ReviewCard from '@/components/ReviewCard';
import styles from './reviews.module.css';

export const metadata: Metadata = {
  title: 'Отзывы — FootLub',
  description:
    'Отзывы покупателей FootLub: бегуны, футболисты, велосипедисты и другие спортсмены об индивидуальных стельках FootLub.',
  alternates: { canonical: 'https://footlub.ru/reviews' },
};

export default function ReviewsPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Отзывы</h1>
        <div className={styles.grid}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
