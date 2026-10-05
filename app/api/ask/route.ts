import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  // Берём email из JWT-куки (только для авторизованных)
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  let email = '';
  let userId = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    email = payload.email ?? '';
    userId = payload.userId ?? '';
  } catch {
    return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  const { name, question } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Вопрос не может быть пустым' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  if (!resendKey || !adminEmail) {
    return NextResponse.json({ error: 'Почта не настроена' }, { status: 500 });
  }

  const text = [
    `Новый вопрос с сайта FootLub`,
    ``,
    `Имя: ${name?.trim() || 'Аноним'}`,
    `Email: ${email}`,
    `ID: ${userId}`,
    ``,
    `Вопрос:`,
    question.trim(),
    ``,
    `Чтобы ответить, нажмите «Ответить» — письмо уйдёт на email посетителя.`,
  ];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FootLub <noreply@footlub.ru>',
      to: adminEmail,
      reply_to: email,
      subject: `Вопрос с сайта FootLub: ${name?.trim() || 'Аноним'}`,
      text: text.join('\n'),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
