import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import partytown from '@astrojs/partytown';

import { externalLink } from './plugin/externalLink';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    partytown({
      // Adds dataLayer.push as a forwarding-event.
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  site: 'https://patrick-kw-chiu.github.io',
  markdown: {
    rehypePlugins: [
      [
        externalLink,
        { domains: ['patrick-kw-chiu.github.io', 'localhost:4321'] },
      ],
    ],
  },
});
