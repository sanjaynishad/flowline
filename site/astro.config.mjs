import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'

// Served from a subpath on the author's domain for SEO authority inheritance:
// https://www.sanjaynishad.com/flowline
export default defineConfig({
  site: 'https://www.sanjaynishad.com',
  base: '/flowline',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets'
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/404')
    }),
    mdx()
  ]
})
