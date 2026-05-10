import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) return NextResponse.json({ error: 'Сервис недоступен' }, { status: 503 });
  const store = await cookies();
  const token = store.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
