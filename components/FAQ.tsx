import { faq } from '@/data/faq';
import styles from './FAQ.module.css';

export default function FAQ() {
  return (
    <section className={styles.section} id="faq">
      <div className="container">
        <h2 className={styles.title}>Вопросы и ответы</h2>
        <div className={styles.inner}>
          <div className={styles.list}>
            {faq.map((item, i) => (
              <details key={i} className={styles.item}>
                <summary className={styles.question}>{item.q}</summary>
                <p className={styles.answer}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
