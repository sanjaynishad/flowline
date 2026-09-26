import { useEffect, useMemo, useState } from 'react'
import type { Category, MatchType, Rule } from '@shared/types'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { categoryLabel, categoryTextClass } from '../lib/format'

const CATEGORIES: Category[] = ['productive', 'neutral', 'distracted']
const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'exe', label: 'App (.exe)' },
  { value: 'domain', label: 'Domain' },
  { value: 'title', label: 'Title keyword' }
]

export function Rules(): JSX.Element {
  const [rules, setRules] = useState<Rule[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')
  const [matcher, setMatcher] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('domain')
  const [category, setCategory] = useState<Category>('distracted')

  useEffect(() => {
    window.api.listRules().then(setRules)
  }, [])

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (filter !== 'all' && r.category !== filter) {
        return false
      }

      if (search && !r.matcher.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      return true
    })
  }, [rules, filter, search])

  async function handleAdd(): Promise<void> {
    const value = matcher.trim()
    if (!value) {
      return
    }

    await window.api.addRule({ matcher: value, matchType, category })
    setRules(await window.api.listRules())
    setMatcher('')
  }

  async function handleCategoryChange(rule: Rule, next: Category): Promise<void> {
    const updated = await window.api.updateRule(rule.id, { category: next })
    setRules(updated)
  }

  async function handleDelete(id: number): Promise<void> {
    const updated = await window.api.deleteRule(id)
    setRules(updated)
  }

  const counts = useMemo(() => {
    return {
      all: rules.length,
      productive: rules.filter((r) => r.category === 'productive').length,
      neutral: rules.filter((r) => r.category === 'neutral').length,
      distracted: rules.filter((r) => r.category === 'distracted').length
    }
  }, [rules])

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-primary">
          <Icon name="rule" size={20} />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">
            Rules &amp; Categorization
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Decide what counts as productive, neutral, or distracting
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="add_circle" size={20} className="text-primary" />
          <span className="font-headline-md text-headline-md">Add a Rule</span>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={matcher}
            onChange={(e) => setMatcher(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. reddit.com, Code.exe, invoice"
            className="flex-1 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 font-code-data text-code-data px-space-md py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as MatchType)}
            className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-space-md py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MATCH_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm px-space-md py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-1 px-space-lg py-2 rounded bg-primary-container text-on-primary-container font-body-md font-semibold shadow-[0_0_12px_rgba(0,240,118,0.25)] hover:shadow-[0_0_18px_rgba(0,240,118,0.4)] transition-all"
          >
            <Icon name="add" size={18} />
            Add
          </button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg">
            {(['all', 'productive', 'neutral', 'distracted'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {f === 'all' ? 'All' : categoryLabel[f]} ({counts[f]})
              </button>
            ))}
          </div>
          <div className="relative">
            <Icon
              name="search"
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules..."
              className="bg-surface-container-lowest text-on-surface font-code-data text-code-data pl-8 pr-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary w-56"
            />
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-surface-variant/20">
          <div className="grid grid-cols-12 gap-3 px-space-lg py-space-sm bg-surface-container-lowest font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
            <div className="col-span-5">Matcher</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-1 text-right">Del</div>
          </div>
          <div className="divide-y divide-surface-variant/20">
            {filtered.map((rule) => (
              <div
                key={rule.id}
                className="grid grid-cols-12 gap-3 px-space-lg py-space-md items-center hover:bg-surface-container/40 transition-colors"
              >
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      rule.category === 'productive'
                        ? 'bg-primary-container'
                        : rule.category === 'neutral'
                          ? 'bg-secondary'
                          : 'bg-tertiary-fixed-dim'
                    }`}
                  />
                  <span className="font-code-data text-code-data truncate">{rule.matcher}</span>
                </div>
                <div className="col-span-3 font-label-caps text-label-caps uppercase text-on-surface-variant">
                  {MATCH_TYPES.find((m) => m.value === rule.matchType)?.label}
                </div>
                <div className="col-span-3">
                  <select
                    value={rule.category}
                    onChange={(e) => handleCategoryChange(rule, e.target.value as Category)}
                    className={`bg-surface-container-lowest font-label-caps text-label-caps uppercase px-2 py-1 rounded focus:outline-none ${categoryTextClass[rule.category]}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabel[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
                    title="Delete rule"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-8 text-center">
                No rules match.
              </p>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
