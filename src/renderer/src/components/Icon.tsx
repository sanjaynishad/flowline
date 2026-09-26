export function Icon({
  name,
  className = '',
  size
}: {
  name: string
  className?: string
  size?: number
}): JSX.Element {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  )
}
