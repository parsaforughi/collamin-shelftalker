/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
