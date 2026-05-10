import { posts as staticPosts } from '@/data/posts';

const BACKEND_URL = process.env.BACKEND_URL;

async function getPosts() {
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/posts/rss`, { next: { revalidate: 3600 } });
      if (res.ok) return res.text();
    } catch {}
  }
  // Fallback — статические посты из data/posts.ts
  const items = staticPosts.map((p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://footlub.ru/blog/${p.slug}</link>
      <guid>https://footlub.ru/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt}]]></description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>FootLub — Блог о здоровье стоп</title>
    <link>https://footlub.ru/blog</link>
    <description>Советы по выбору стелек, здоровью стоп и спорту</description>
    <language>ru</language>
    ${items}
  </channel>
</rss>`;
}

export async function GET() {
  const xml = await getPosts();
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
