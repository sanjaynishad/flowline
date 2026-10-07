export const SITE = {
  name: 'Flowline',
  tagline: 'See your focus. Stay in flow.',
  description:
    'Flowline is a free automatic time tracker for Windows. It logs apps and browser tabs on your PC, with no account and no cloud upload.',
  url: 'https://www.sanjaynishad.com',
  base: '/flowline',
  author: 'Sanjay Nishad',
  authorUrl: 'https://www.sanjaynishad.com',
  repo: 'https://github.com/sanjaynishad/flowline',
  releases: 'https://github.com/sanjaynishad/flowline/releases',
  issues: 'https://github.com/sanjaynishad/flowline/issues',
  discussions: 'https://github.com/sanjaynishad/flowline/discussions',
  // GA4 measurement ID (reuses the existing sanjaynishad.com property).
  // Override at build time with PUBLIC_GA4_ID.
  ga4: import.meta.env.PUBLIC_GA4_ID ?? ''
} as const

export const NAV = [
  { label: 'Features', href: '/#features', external: false },
  { label: 'Compare', href: '/compare', external: false },
  { label: 'Docs', href: '/docs', external: false },
  { label: 'Download', href: '/download', external: false },
  { label: 'Blog', href: '/blog', external: false },
  { label: 'FAQ', href: '/faq', external: false },
  { label: 'Community', href: SITE.discussions, external: true }
] as const

// Resolves a NAV item to its final href: external links pass through, in-page
// anchors and internal paths get the base prefix.
export function navHref(item: { href: string; external: boolean }): string {
  if (item.external) {
    return item.href
  }

  if (item.href.startsWith('/#')) {
    return href('/') + item.href.slice(1)
  }

  return href(item.href)
}

// Prefixes an app-relative path with the configured base ('/flowline').
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  return (base + path).replace(/([^:]\/)\/+/g, '$1')
}
