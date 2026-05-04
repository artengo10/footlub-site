import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://footlub.ru', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://footlub.ru/shop', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://footlub.ru/reviews', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://footlub.ru/contacts', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://footlub.ru/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ];
}
