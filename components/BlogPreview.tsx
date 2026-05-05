import Link from 'next/link';
import { posts } from '@/data/posts';
import styles from './BlogPreview.module.css';

export default function BlogPreview() {
  const latest = posts.slice(0, 3);
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title}>Статьи о здоровье стоп</h2>
          <Link href="/blog" className={styles.all}>Все статьи →</Link>
        </div>
        <div className={styles.grid}>
          {latest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
              <div className={styles.meta}>
                <span className={styles.time}>{p.readTime} мин</span>
                <span className={styles.date}>{new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
              </div>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.excerpt}>{p.excerpt}</p>
              <span className={styles.read}>Читать →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
