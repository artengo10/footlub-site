'use client';
import { useState } from 'react';
import type { Review } from '@/data/reviews';
import styles from './ReviewCard.module.css';

export default function ReviewCard({ r }: { r: Review }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={styles.card}>
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
      <div className={styles.textWrap}>
        <p className={`${styles.text} ${expanded ? styles.textExpanded : ''}`}>{r.text}</p>
        <button
          className={`${styles.expandBtn} ${expanded ? styles.expandBtnOpen : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Свернуть' : 'Читать полностью'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </article>
  );
}
