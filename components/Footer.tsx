import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.left}>
          <span className={styles.logo}>FootLab</span>
          <p className={styles.copy}>© 2025 FootLab. Нижний Новгород — доставка по всей России</p>
        </div>
        <div className={styles.links}>
          <a
            href="https://t.me/footlab_support"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
          <Link href="#faq">Вопросы и ответы</Link>
        </div>
      </div>
    </footer>
  );
}
