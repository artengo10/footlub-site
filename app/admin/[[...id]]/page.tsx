import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

type Scan = {
  id: string;
  right: boolean;
  left: boolean;
  raw: boolean;
  photos: number;
  lengthMm: number | null;
  widthMm: number | null;
  uploadedAt: string | null;
};

type Order = {
  id: string;
  createdAt: string;
  status: string;
  email: string | null;
  shoeSize: string | null;
  insoleType: string | null;
  price: number | null;
  scan: Scan | null;
};

const box: React.CSSProperties = { maxWidth: 1100, margin: '40px auto', padding: '0 16px', color: '#eee', fontFamily: 'system-ui, sans-serif' };
const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #333', verticalAlign: 'top', fontSize: 14 };
const link: React.CSSProperties = { color: '#C9FF40', marginRight: 10 };

function Denied({ text }: { text: string }) {
  return (
    <div style={box}>
      <h1>Админка</h1>
      <p>{text}</p>
      <p>
        <a href="/login" style={link}>Войти</a>
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const token = (await cookies()).get('token')?.value;
  if (!token) return <Denied text="Нужно войти в аккаунт администратора." />;

  const res = await fetch(`${BACKEND}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) return <Denied text="Сессия истекла. Войдите снова." />;
  if (res.status === 403) return <Denied text="Этот аккаунт не администратор." />;
  if (!res.ok) return <Denied text={`Не удалось загрузить заказы (ошибка ${res.status}).`} />;

  const { orders } = (await res.json()) as { orders: Order[] };

  return (
    <div style={box}>
      <h1>Заказы</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cell}>Дата</th>
            <th style={cell}>Почта</th>
            <th style={cell}>Заказ</th>
            <th style={cell}>Статус</th>
            <th style={cell}>Размер / тип</th>
            <th style={cell}>Скан</th>
            <th style={cell}>Файлы</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td style={cell}>{new Date(o.createdAt).toLocaleString('ru-RU')}</td>
              <td style={cell}>{o.email ?? '—'}</td>
              <td style={cell}><code>{o.id}</code></td>
              <td style={cell}>{o.status}</td>
              <td style={cell}>{o.shoeSize ?? '—'} · {o.insoleType ?? '—'}</td>
              <td style={cell}>
                {o.scan
                  ? `длина ${o.scan.lengthMm ? Math.round(o.scan.lengthMm) : '—'} мм, ширина ${o.scan.widthMm ? Math.round(o.scan.widthMm) : '—'} мм`
                  : 'нет скана'}
              </td>
              <td style={cell}>
                {o.scan && (
                  <>
                    {o.scan.right && <a style={link} href={`/api/admin/download?scanId=${o.scan.id}&file=right`}>правая STL</a>}
                    {o.scan.left && <a style={link} href={`/api/admin/download?scanId=${o.scan.id}&file=left`}>левая STL</a>}
                    {o.scan.raw && <a style={link} href={`/api/admin/download?scanId=${o.scan.id}&file=raw`}>данные</a>}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p>Заказов пока нет.</p>}
    </div>
  );
}
