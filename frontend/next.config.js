/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Cloudflare Pagesでは画像最適化が利用できないため無効化
    unoptimized: true,
  },
}

module.exports = nextConfig
