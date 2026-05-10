import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    // Decode JWT payload without verification (backend already validated it on issue)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString()
    );
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      cookieStore.delete('token');
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: { email: payload.email, userId: payload.userId } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
