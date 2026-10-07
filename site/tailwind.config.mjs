/** @type {import('tailwindcss').Config} */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withVar('--bg'),
        'bg-soft': withVar('--bg-soft'),
        surface: withVar('--surface'),
        'surface-high': withVar('--surface-high'),
        border: withVar('--border'),
        fg: withVar('--fg'),
        muted: withVar('--muted'),
        primary: withVar('--primary'),
        'primary-strong': withVar('--primary-strong'),
        'on-primary': withVar('--on-primary'),
        secondary: withVar('--secondary'),
        danger: withVar('--danger')
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      maxWidth: {
        content: '72rem'
      },
      boxShadow: {
        glow: '0 0 40px rgba(0, 240, 118, 0.18)'
      }
    }
  },
  plugins: []
}
