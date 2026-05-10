'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BurgerMenu from './BurgerMenu';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import LogoutConfirm from './LogoutConfirm';
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

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setConfirmingLogout(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    setConfirmingLogout(false);
    await logout();
    router.push('/');
  }

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

            {!loading && (
              user ? (
                <div className={styles.avatarWrap} ref={dropdownRef}>
                  <button
                    className={styles.avatar}
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-label="Меню аккаунта"
                  >
                    {user.email[0].toUpperCase()}
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      {confirmingLogout ? (
                        <LogoutConfirm
                          onConfirm={handleLogout}
                          onCancel={() => setConfirmingLogout(false)}
                        />
                      ) : (
                        <>
                          <p className={styles.dropEmail}>{user.email}</p>
                          <hr className={styles.dropDivider} />
                          <Link href="/profile" className={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                            Профиль
                          </Link>
                          <button className={styles.dropItem} onClick={() => setConfirmingLogout(true)}>
                            Выйти
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={styles.profile} aria-label="Войти">
                  <UserIcon />
                </Link>
              )
            )}
          </div>
        </div>
      </header>
      <BurgerMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
