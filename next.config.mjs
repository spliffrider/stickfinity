import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@supabase/supabase-js'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/supabase-js$': path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist/main/index.js'),
    };
    return config;
  },
};

export default nextConfig;