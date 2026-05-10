import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;

async function getToken() {
  const store = await cookies();
  return store.get('token')?.value ?? null;
}

export async function GET() {
  if (!BACKEND_URL) return NextResponse.json({ error: 'Сервис недоступен' }, { status: 503 });
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const res = await fetch(`${BACKEND_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest) {
  if (!BACKEND_URL) return NextResponse.json({ error: 'Сервис недоступен' }, { status: 503 });
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
