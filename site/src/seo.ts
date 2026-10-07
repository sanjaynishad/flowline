import { SITE } from './consts'

export const VERSION = '0.1.0'

export const HOME_TITLE = 'Automatic Time Tracker for Windows'

export const HOME_DESCRIPTION =
  'Flowline is a free, open-source automatic time tracker for Windows. It logs apps and browser tabs on your PC, with no account and no cloud upload.'

export const OG_IMAGE = `${SITE.base}/screenshots/dashboard-dark.png`
export const OG_IMAGE_WIDTH = 1440
export const OG_IMAGE_HEIGHT = 900
export const OG_IMAGE_ALT =
  'Flowline dashboard with deep-work total, distraction time, a time-allocation ring, and top applications'

export function absoluteUrl(path: string): string {
  const base = SITE.base.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE.url}${base}${normalized}`.replace(/([^:]\/)\/+/g, '$1')
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: absoluteUrl('/'),
    description: HOME_DESCRIPTION,
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: SITE.author,
      url: SITE.authorUrl
    }
  }
}

export function softwareJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Time Tracking',
    operatingSystem: 'Windows 10, Windows 11',
    description: HOME_DESCRIPTION,
    url: absoluteUrl('/'),
    downloadUrl: SITE.releases,
    softwareVersion: VERSION,
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  }
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  }
}

export function techArticleJsonLd(input: {
  title: string
  description: string
  path: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    inLanguage: 'en',
    mainEntityOfPage: absoluteUrl(input.path),
    author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
    publisher: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl }
  }
}

export function blogPostingJsonLd(input: {
  title: string
  description: string
  date: Date
  id: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    datePublished: input.date.toISOString(),
    dateModified: input.date.toISOString(),
    inLanguage: 'en',
    image: new URL(OG_IMAGE, SITE.url).href,
    author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
    mainEntityOfPage: absoluteUrl(`/blog/${input.id}`)
  }
}
