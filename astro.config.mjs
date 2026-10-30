// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://r3s3arcmsureness.github.io',
  base: '/blog',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
