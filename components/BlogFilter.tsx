'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './BlogFilter.module.css';

const CATEGORIES = [
  { label: 'Все', value: '' },
  { label: 'Боль', value: 'боль' },
  { label: 'Здоровье', value: 'здоровье' },
  { label: 'Бег', value: 'бег' },
  { label: 'Стельки', value: 'стельки' },
  { label: 'Спорт', value: 'спорт' },
];

export default function BlogFilter({ active }: { active: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/blog?${params.toString()}`, { scroll: false });
  }

  return (
    <div className={styles.wrap}>
      {CATEGORIES.map((c) => (
        <button
          key={c.value}
          className={`${styles.btn} ${active === c.value ? styles.active : ''}`}
          onClick={() => select(c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
