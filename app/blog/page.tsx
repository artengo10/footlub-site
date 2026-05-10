import type { Metadata } from 'next';
import { Suspense } from 'react';
import { posts } from '@/data/posts';
import BlogContent from '@/components/BlogContent';
import BackToHome from '@/components/BackToHome';
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
  const { category = '__new__' } = await searchParams;

  return (
    <section className={styles.section}>
      <div className="container">
        <BackToHome />
        <h1 className={styles.title}>Статьи</h1>
        <p className={styles.sub}>О здоровье стоп, выборе стелек и спортивных нагрузках</p>
        <Suspense>
          <BlogContent posts={posts} initialCategory={category} />
        </Suspense>
      </div>
    </section>
  );
}
