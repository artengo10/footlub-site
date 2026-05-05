import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { posts } from '@/data/posts';
import styles from './article.module.css';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — FootLub`,
    description: post.excerpt,
    alternates: { canonical: `https://footlub.ru/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'FootLub' },
    publisher: { '@type': 'Organization', name: 'FootLub', url: 'https://footlub.ru' },
  };

  return (
    <article className={styles.article}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container">
        <div className={styles.inner}>
          <Link href="/blog" className={styles.back}>← Все статьи</Link>
          <div className={styles.meta}>
            <span className={styles.time}>{post.readTime} мин чтения</span>
            <span className={styles.date}>
              {new Date(post.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.excerpt}>{post.excerpt}</p>
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className={styles.cta}>
            <p className={styles.ctaText}>Подберите стельки под вашу стопу — сканирование за 30 секунд в приложении</p>
            <Link href="/shop" className={styles.ctaBtn}>Выбрать стельки</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
