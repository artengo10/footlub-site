import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, question } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Вопрос не может быть пустым' }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
  }

  const text =
    `❓ <b>Новый вопрос с сайта FootLub</b>\n\n` +
    `👤 Имя: ${name?.trim() || 'Аноним'}\n\n` +
    `📝 Вопрос:\n${question.trim()}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
