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

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !chatId) {
    return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
  }

  const lines = [
    `❓ <b>Новый вопрос с сайта FootLub</b>`,
    ``,
    `👤 Имя: ${name?.trim() || 'Аноним'}`,
    `📧 Email: ${email}`,
    `🔑 ID: ${userId}`,
    ``,
    `📝 Вопрос:`,
    question.trim(),
    ``,
    `<i>Ответьте на это сообщение — письмо уйдёт на email посетителя.</i>`,
  ];

  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
