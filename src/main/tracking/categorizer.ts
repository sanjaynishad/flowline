import type { Category, Rule } from '../../shared/types'

export interface Candidate {
  appName: string
  exePath: string | null
  windowTitle: string | null
  domain: string | null
}

export interface Classification {
  category: Category
  thresholdSec: number | null
  matchedRuleId: number | null
}

export function extractDomain(url: string | null): string | null {
  if (!url) {
    return null
  }

  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function exeName(candidate: Candidate): string {
  if (candidate.exePath) {
    const parts = candidate.exePath.split(/[\\/]/)
    return parts[parts.length - 1].toLowerCase()
  }

  return candidate.appName.toLowerCase()
}

function domainMatches(ruleDomain: string, domain: string): boolean {
  const r = ruleDomain.toLowerCase()
  return domain === r || domain.endsWith(`.${r}`)
}

export function classify(candidate: Candidate, rules: Rule[]): Classification {
  const domain = candidate.domain?.toLowerCase() ?? null
  const exe = exeName(candidate)
  const title = (candidate.windowTitle ?? '').toLowerCase()

  // Match precedence: domain (most specific) → exe → title keyword.
  if (domain) {
    for (const rule of rules) {
      if (rule.matchType === 'domain' && domainMatches(rule.matcher, domain)) {
        return { category: rule.category, thresholdSec: rule.thresholdSec, matchedRuleId: rule.id }
      }
    }
  }

  for (const rule of rules) {
    if (rule.matchType === 'exe' && exe === rule.matcher.toLowerCase()) {
      return { category: rule.category, thresholdSec: rule.thresholdSec, matchedRuleId: rule.id }
    }
  }

  for (const rule of rules) {
    if (rule.matchType === 'title' && title.includes(rule.matcher.toLowerCase())) {
      return { category: rule.category, thresholdSec: rule.thresholdSec, matchedRuleId: rule.id }
    }
  }

  return { category: 'neutral', thresholdSec: null, matchedRuleId: null }
}

const KNOWN_BROWSERS = new Set([
  'chrome.exe',
  'msedge.exe',
  'firefox.exe',
  'brave.exe',
  'opera.exe',
  'vivaldi.exe'
])

export function isBrowser(candidate: Candidate): boolean {
  return KNOWN_BROWSERS.has(exeName(candidate))
}
