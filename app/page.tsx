import Hero from '@/components/Hero';
import ReviewsSection from '@/components/ReviewsSection';
import FAQ from '@/components/FAQ';
import { faq } from '@/data/faq';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Hero />
      <ReviewsSection />
      <FAQ />
    </>
  );
}
