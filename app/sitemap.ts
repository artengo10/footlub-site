import type { MetadataRoute } from 'next';
import { posts } from '@/data/posts';
import { products } from '@/data/products';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://footlub.ru', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://footlub.ru/shop', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...products.map((p) => ({
      url: `https://footlub.ru/shop/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    { url: 'https://footlub.ru/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...posts.map((p) => ({
      url: `https://footlub.ru/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    { url: 'https://footlub.ru/reviews', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://footlub.ru/contacts', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
