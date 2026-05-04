import type { Metadata } from 'next';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Войти — FootLub',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Войти в FootLub</h1>
        <p className={styles.sub}>
          Личный кабинет в разработке. Заказы оформляются через приложение FootLub для iPhone.
        </p>
        <form className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            disabled
            aria-label="Email"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Пароль"
            disabled
            aria-label="Пароль"
          />
          <button className={styles.btn} disabled type="submit">
            Войти
          </button>
        </form>
      </div>
    </section>
  );
}
