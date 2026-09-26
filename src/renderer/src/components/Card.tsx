import type { ReactNode } from 'react'

export function Card({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div
      className={`rounded-xl bg-surface-container-low/90 backdrop-blur-md border border-surface-variant/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  icon,
  title,
  accent = 'text-primary'
}: {
  icon?: ReactNode
  title: string
  accent?: string
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className={accent}>{icon}</span>}
      <span className="font-headline-md text-headline-md text-on-surface">{title}</span>
    </div>
  )
}
