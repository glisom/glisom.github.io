import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import preservedHeadingIds from './src/lib/markdown/preserved-heading-ids.ts';

export default defineConfig({
  site: 'https://grantisom.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  markdown: { remarkPlugins: [preservedHeadingIds] },
  integrations: [mdx()],
});
