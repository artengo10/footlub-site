'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './register.module.css';

function HomeArrow() {
  return (
    <Link href="/" className={styles.homeLink}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M5 12l7-7M5 12l7 7" />
      </svg>
      Главная
    </Link>
  );
}

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Ошибка регистрации');
        return;
      }
      setStep('otp');
      startCooldown();
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Неверный код');
        return;
      }
      await refresh();
      router.push('/');
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      startCooldown();
    } catch {}
  }

  function startCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(t); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {step === 'form' ? (
          <>
            <HomeArrow />
            <h1 className={styles.title}>Регистрация</h1>
            <p className={styles.sub}>
              Создайте аккаунт для отслеживания заказов и сохранения данных сканирования
            </p>

            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Пароль</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Отправляем код...' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Уже есть аккаунт? Войти →
              </Link>
            </div>
          </>
        ) : (
          <>
            <HomeArrow />
            <h1 className={styles.title}>Подтверждение</h1>
            <p className={styles.sub}>
              Мы отправили 6-значный код на <strong>{email}</strong>. Введите его ниже.
            </p>

            <form className={styles.form} onSubmit={handleVerify}>
              <div className={styles.field}>
                <label className={styles.label}>Код из письма</label>
                <input
                  className={`${styles.input} ${styles.otpInput}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Проверяем...' : 'Подтвердить'}
              </button>
            </form>

            <div className={styles.footer}>
              {resendCooldown > 0 ? (
                <p className={styles.cooldown}>Повторно через {resendCooldown} сек.</p>
              ) : (
                <button className={styles.link} onClick={handleResend}>
                  Отправить код повторно
                </button>
              )}
              <button className={`${styles.link} ${styles.back}`} onClick={() => setStep('form')}>
                ← Изменить email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
