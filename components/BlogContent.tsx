'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Post } from '@/data/posts';
import styles from './BlogContent.module.css';

const CATEGORIES = [
  { label: 'Все', value: '' },
  { label: 'Боль', value: 'боль' },
  { label: 'Здоровье', value: 'здоровье' },
  { label: 'Бег', value: 'бег' },
  { label: 'Стельки', value: 'стельки' },
  { label: 'Спорт', value: 'спорт' },
];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className={styles.mark}>{part}</mark> : part
  );
}

export default function BlogContent({
  posts,
  initialCategory,
}: {
  posts: Post[];
  initialCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);

  const contentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of posts) {
      map.set(p.slug, stripHtml(p.content));
    }
    return map;
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (category) {
      result = result.filter((p) => p.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((p) => {
        const inTitle = p.title.toLowerCase().includes(q);
        const inExcerpt = p.excerpt.toLowerCase().includes(q);
        const inContent = (contentMap.get(p.slug) ?? '').toLowerCase().includes(q);
        return inTitle || inExcerpt || inContent;
      });
    }
    return result;
  }, [posts, category, query, contentMap]);

  const selectCategory = useCallback((value: string) => {
    setCategory(value);
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/blog?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.search}
            type="search"
            placeholder="Поиск по статьям..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clear} onClick={() => setQuery('')} aria-label="Очистить">
              ×
            </button>
          )}
        </div>
        <div className={styles.filters}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`${styles.btn} ${category === c.value && !query ? styles.active : ''}`}
              onClick={() => selectCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>По запросу <strong>«{query || category}»</strong> ничего не найдено.</p>
        </div>
      ) : (
        <>
          {query && (
            <p className={styles.resultCount}>
              Найдено: {filtered.length} {filtered.length === 1 ? 'статья' : filtered.length < 5 ? 'статьи' : 'статей'}
            </p>
          )}
          <div className={styles.grid}>
            {filtered.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                <div className={styles.meta}>
                  <span className={styles.time}>{p.readTime} мин чтения</span>
                  <span className={styles.catBadge}>{p.category}</span>
                  {p.isNew && <span className={styles.newBadge}>Новинка</span>}
                  <span className={styles.date}>
                    {new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 className={styles.cardTitle}>
                  {highlight(p.title, query)}
                </h2>
                <p className={styles.excerpt}>
                  {highlight(p.excerpt, query)}
                </p>
                <span className={styles.read}>Читать статью →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
