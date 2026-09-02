import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://grantisom.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  integrations: [mdx()],
});
