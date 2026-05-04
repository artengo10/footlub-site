'use client';
import { useState } from 'react';
import Link from 'next/link';
import BurgerMenu from './BurgerMenu';
import { useTheme } from './ThemeProvider';
import styles from './Header.module.css';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.left}>
            <button
              className={styles.burger}
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={open}
            >
              <span />
              <span />
              <span />
            </button>
            <Link href="/" className={styles.logo} aria-label="FootLub — на главную">
              <span className={styles.logoText}>FootLub</span>
            </Link>
          </div>
          <div className={styles.right}>
            <button
              className={styles.themeToggle}
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link href="/login" className={styles.profile} aria-label="Личный кабинет">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      <BurgerMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
