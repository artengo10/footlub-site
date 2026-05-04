import type { NextConfig } from 'next';

const config: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  devIndicators: false,
};

export default config;
