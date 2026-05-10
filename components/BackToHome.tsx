import Link from 'next/link';
import styles from './BackToHome.module.css';

export default function BackToHome() {
  return (
    <Link href="/" className={styles.link}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M5 12l7-7M5 12l7 7" />
      </svg>
      Главная
    </Link>
  );
}
