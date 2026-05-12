'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AskForm.module.css';

export default function AskForm() {
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    if (!user) {
      // Форма видна всем, но отправка только для авторизованных
      window.location.href = '/login';
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, question }),
      });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) { setName(''); setQuestion(''); }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.success}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Вопрос отправлен — ответим на {user?.email} в течение дня
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Не нашли ответ?</h3>
      <p className={styles.sub}>
        {loading
          ? 'Задайте свой вопрос — ответим по email'
          : user
            ? `Ответ придёт на ${user.email}`
            : 'Задайте вопрос — нужен аккаунт для ответа на email'}
      </p>
      <input
        className={styles.input}
        type="text"
        placeholder="Ваше имя (необязательно)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <textarea
        className={styles.textarea}
        placeholder="Напишите ваш вопрос..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
        rows={4}
        maxLength={1000}
      />
      {status === 'error' && (
        <p className={styles.error}>Ошибка отправки. Попробуйте ещё раз или напишите в Telegram.</p>
      )}
      <button
        className={styles.btn}
        type="submit"
        disabled={status === 'loading' || !question.trim()}
      >
        {status === 'loading'
          ? 'Отправляем...'
          : user
            ? 'Отправить вопрос'
            : 'Войти и отправить вопрос'}
      </button>
    </form>
  );
}
