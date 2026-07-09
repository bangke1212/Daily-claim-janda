/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    IAMHC_API_KEY: process.env.IAMHC_API_KEY || '',
    IAMHC_BASE_URL: process.env.IAMHC_BASE_URL || 'https://api.iamhc.cn',
  },
};

module.exports = nextConfig;
