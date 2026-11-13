// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [
    sanity({
      projectId: '9qf0gufo',
      dataset: 'production',
      useCdn: false,
      studioBasePath: '/studio',
    }),
    react(),
  ],
});
