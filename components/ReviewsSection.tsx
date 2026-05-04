import { reviews } from '@/data/reviews';
import styles from './ReviewsSection.module.css';

export default function ReviewsSection() {
  const featured = reviews.slice(0, 3);

  return (
    <section className={styles.section} id="reviews">
      <div className="container">
        <h2 className={styles.title}>Отзывы</h2>
        <div className={styles.grid}>
          {featured.map((r) => (
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
