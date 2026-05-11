import { posts as staticPosts } from '@/data/posts';

const BACKEND_URL = process.env.BACKEND_URL;

async function getPosts() {
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/posts/rss`, { next: { revalidate: 3600 } });
      if (res.ok) return res.text();
    } catch {}
  }

  // Fallback — статические посты из data/posts.ts, от новых к старым
  const sorted = [...staticPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = sorted.map((p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://footlub.ru/blog/${p.slug}</link>
      <guid isPermaLink="true">https://footlub.ru/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt}]]></description>
      <content:encoded><![CDATA[
        <p><em>${p.excerpt}</em></p>
        ${p.content}
        <p><a href="https://footlub.ru/blog/${p.slug}">Читать полностью на footlub.ru →</a></p>
      ]]></content:encoded>
      <category>${p.category}</category>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FootLub — Блог о здоровье стоп</title>
    <link>https://footlub.ru/blog</link>
    <atom:link href="https://footlub.ru/rss" rel="self" type="application/rss+xml" />
    <description>Советы по выбору стелек, здоровью стоп и спорту</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

export async function GET() {
  const xml = await getPosts();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
