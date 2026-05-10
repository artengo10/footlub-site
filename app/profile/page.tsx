// robots: noindex — профиль не нужен в поиске
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LogoutConfirm from '@/components/LogoutConfirm';
import styles from './profile.module.css';

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  phone: string | null;
  address: string | null;
};

type Section = 'info' | 'address' | 'password';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('info');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        const p: Profile = data.profile ?? {};
        setProfile(p);
        setFirstName(p.firstName ?? '');
        setLastName(p.lastName ?? '');
        setPatronymic(p.patronymic ?? '');
        setPhone(p.phone ?? '');
        setAddress(p.address ?? '');
      })
      .catch(() => {});
  }, [user]);

  function notify(text: string, type: 'ok' | 'err') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, patronymic, phone }),
      });
      const data = await res.json();
      res.ok ? notify('Данные сохранены', 'ok') : notify(data.error ?? 'Ошибка', 'err');
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      res.ok ? notify('Адрес сохранён', 'ok') : notify(data.error ?? 'Ошибка', 'err');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { notify('Пароль минимум 6 символов', 'err'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Пароль изменён', 'ok');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        notify(data.error ?? 'Ошибка', 'err');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (loading || !user) return null;

  const initials = user.email[0].toUpperCase();

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M5 12l7-7M5 12l7 7" />
        </svg>
        Главная
      </Link>
      <div className={styles.inner}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.avatar}>{initials}</div>
          <p className={styles.email}>{user.email}</p>

          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeSection === 'info' ? styles.navActive : ''}`}
              onClick={() => setActiveSection('info')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Личные данные
            </button>
            <button
              className={`${styles.navItem} ${activeSection === 'address' ? styles.navActive : ''}`}
              onClick={() => setActiveSection('address')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Адрес доставки
            </button>
            <button
              className={`${styles.navItem} ${activeSection === 'password' ? styles.navActive : ''}`}
              onClick={() => setActiveSection('password')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Безопасность
            </button>
          </nav>

          <div className={styles.sidebarFooter}>
            {confirmingLogout ? (
              <LogoutConfirm
                onConfirm={handleLogout}
                onCancel={() => setConfirmingLogout(false)}
              />
            ) : (
              <button className={styles.logoutBtn} onClick={() => setConfirmingLogout(true)}>
                Выйти
              </button>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className={styles.content}>
          {message && (
            <div className={`${styles.toast} ${message.type === 'ok' ? styles.toastOk : styles.toastErr}`}>
              {message.text}
            </div>
          )}

          {activeSection === 'info' && (
            <section>
              <h1 className={styles.sectionTitle}>Личные данные</h1>
              <p className={styles.sectionSub}>Используются для оформления заказов</p>
              <form className={styles.form} onSubmit={saveInfo}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Имя</label>
                    <input className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Фамилия</label>
                    <input className={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Отчество</label>
                  <input className={styles.input} value={patronymic} onChange={(e) => setPatronymic(e.target.value)} placeholder="Иванович" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Телефон</label>
                  <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input className={styles.input} value={profile?.email ?? ''} disabled />
                </div>
                <button className={styles.saveBtn} type="submit" disabled={saving}>
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </form>
            </section>
          )}

          {activeSection === 'address' && (
            <section>
              <h1 className={styles.sectionTitle}>Адрес доставки</h1>
              <p className={styles.sectionSub}>Стельки доставляем по всей России через СДЭК и Почту России</p>
              <form className={styles.form} onSubmit={saveAddress}>
                <div className={styles.field}>
                  <label className={styles.label}>Адрес</label>
                  <input
                    className={styles.input}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Нижний Новгород, ул. Ленина, д. 1, кв. 5"
                  />
                  <span className={styles.hint}>Город, улица, дом, квартира</span>
                </div>
                <button className={styles.saveBtn} type="submit" disabled={saving}>
                  {saving ? 'Сохраняем...' : 'Сохранить адрес'}
                </button>
              </form>
            </section>
          )}

          {activeSection === 'password' && (
            <section>
              <h1 className={styles.sectionTitle}>Безопасность</h1>
              <p className={styles.sectionSub}>Смените пароль от аккаунта</p>
              <form className={styles.form} onSubmit={savePassword}>
                <div className={styles.field}>
                  <label className={styles.label}>Текущий пароль</label>
                  <input className={styles.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••" required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Новый пароль</label>
                  <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
                </div>
                <button className={styles.saveBtn} type="submit" disabled={saving}>
                  {saving ? 'Меняем...' : 'Изменить пароль'}
                </button>
              </form>
            </section>
          )}
        </main>

      </div>
    </div>
  );
}
