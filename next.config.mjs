import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['@supabase/supabase-js$'] = require.resolve('@supabase/supabase-js');
    return config;
  },
};

export default nextConfig;

