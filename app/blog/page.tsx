import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { posts } from '@/data/posts';
import BlogFilter from '@/components/BlogFilter';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Блог — FootLub',
  description: 'Статьи о здоровье стоп, выборе стелек, плоскостопии и спортивных нагрузках. Экспертные материалы от FootLub.',
  alternates: { canonical: 'https://footlub.ru/blog' },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = '' } = await searchParams;
  const filtered = category
    ? posts.filter((p) => p.category === category)
    : posts;

  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.title}>Статьи</h1>
        <p className={styles.sub}>О здоровье стоп, выборе стелек и спортивных нагрузках</p>
        <Suspense>
          <BlogFilter active={category} />
        </Suspense>
        {filtered.length === 0 ? (
          <p className={styles.empty}>Статей в этой категории пока нет.</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                <div className={styles.meta}>
                  <span className={styles.time}>{p.readTime} мин чтения</span>
                  <span className={styles.categoryBadge}>{p.category}</span>
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
        )}
      </div>
    </section>
  );
}
