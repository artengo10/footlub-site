'use client';
import { useState } from 'react';
import { faq } from '@/data/faq';
import styles from './FAQ.module.css';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

const VISIBLE = 5;

export default function FAQ() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={styles.section} id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container">
        <h2 className={styles.title}>Вопросы и ответы</h2>
        <div className={styles.inner}>
          <div className={styles.list}>
            {faq.map((item, i) => (
              <details
                key={i}
                className={`${styles.item} ${!expanded && i >= VISIBLE ? styles.hidden : ''}`}
                aria-hidden={!expanded && i >= VISIBLE ? true : undefined}
              >
                <summary className={styles.question}>{item.q}</summary>
                <p className={styles.answer}>{item.a}</p>
              </details>
            ))}
          </div>
          <button
            className={styles.toggle}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? 'Скрыть'
              : `Показать все вопросы (${faq.length - VISIBLE} ещё)`}
          </button>
        </div>
      </div>
    </section>
  );
}
