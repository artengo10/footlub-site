'use client';
import { useState } from 'react';
import { faq } from '@/data/faq';
import AskForm from './AskForm';
import styles from './FAQ.module.css';

declare global {
  function ym(id: number, action: string, goal: string): void;
}

const VISIBLE = 3;

function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
  if (e.currentTarget.open && typeof ym !== 'undefined') {
    ym(109060079, 'reachGoal', 'faq_open');
  }
}

export default function FAQ() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={styles.section} id="faq">
      <div className="container">
        <h2 className={styles.title}>Вопросы и ответы</h2>
        <div className={styles.inner}>
          <div className={styles.list}>
            {faq.map((item, i) => (
              <details
                key={i}
                className={`${styles.item} ${!expanded && i >= VISIBLE ? styles.hidden : ''}`}
                onToggle={handleToggle}
              >
                <summary className={styles.question}>{item.q}</summary>
                <p className={styles.answer}>{item.a}</p>
              </details>
            ))}
          </div>
          <button className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Скрыть' : `Посмотреть все вопросы (${faq.length - VISIBLE} ещё)`}
          </button>
          <AskForm />
        </div>
      </div>
    </section>
  );
}
