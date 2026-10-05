import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

export async function GET(req: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const scanId = req.nextUrl.searchParams.get('scanId');
  const file = req.nextUrl.searchParams.get('file') ?? 'right';
  if (!token || !scanId) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const res = await fetch(
    `${BACKEND}/admin/scans/${encodeURIComponent(scanId)}/download-url?file=${encodeURIComponent(file)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );
  if (!res.ok) return NextResponse.json({ error: 'Файл недоступен' }, { status: res.status });

  const { url } = (await res.json()) as { url: string };
  return NextResponse.redirect(url);
}
