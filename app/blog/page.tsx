import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/data/posts';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Блог — FootLub',
  description: 'Статьи о здоровье стоп, выборе стелек, плоскостопии и спортивных нагрузках. Экспертные материалы от FootLub.',
  alternates: { canonical: 'https://footlub.ru/blog' },
};

export default function BlogPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Статьи</h1>
        <p className={styles.sub}>О здоровье стоп, выборе стелек и спортивных нагрузках</p>
        <div className={styles.grid}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
              <div className={styles.meta}>
                <span className={styles.time}>{p.readTime} мин чтения</span>
                <span className={styles.date}>
                  {new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <p className={styles.excerpt}>{p.excerpt}</p>
              <span className={styles.read}>Читать статью →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
