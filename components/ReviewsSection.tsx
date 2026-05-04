import Link from 'next/link';
import { reviews } from '@/data/reviews';
import ReviewCard from './ReviewCard';
import styles from './ReviewsSection.module.css';

export default function ReviewsSection() {
  const featured = reviews.slice(0, 3);

  return (
    <section className={styles.section} id="reviews">
      <div className="container">
        <h2 className={styles.title}>Отзывы</h2>
        <div className={styles.grid}>
          {featured.map((r) => (
            <div key={r.id} className={styles.cardWrap}>
              <ReviewCard r={r} />
            </div>
          ))}
        </div>
        <div className={styles.allWrap}>
          <Link href="/reviews" className={styles.allLink}>
            Посмотреть все отзывы
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
