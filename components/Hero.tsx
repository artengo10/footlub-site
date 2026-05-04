import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>
          Индивидуальные спортивные стельки,{' '}
          <span className={styles.accent}>созданные под вашу стопу</span>
        </h1>
        <p className={styles.sub}>
          Сканируйте стопу за 30 секунд в приложении FootLub на iPhone — получите стельки из
          TPU&nbsp;95A с доставкой по всей России.
        </p>
        <a href="#" className={styles.cta}>
          Скачать приложение
        </a>
      </div>
    </section>
  );
}
