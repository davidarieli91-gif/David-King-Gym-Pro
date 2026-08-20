/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./fitness-crm.html",
    "./client.html",
    "./index.html",
    "./src/**/*.{js,html}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg:          'rgb(var(--c-bg) / <alpha-value>)',
        surface:     'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        border:      'rgb(var(--c-border) / <alpha-value>)',
        text:        'rgb(var(--c-text) / <alpha-value>)',
        muted:       'rgb(var(--c-muted) / <alpha-value>)',
        primary:     'rgb(var(--c-primary) / <alpha-value>)',
        'primary-2': 'rgb(var(--c-primary-2) / <alpha-value>)',
        accent:      'rgb(var(--c-accent) / <alpha-value>)',
        success:     'rgb(var(--c-success) / <alpha-value>)',
        warning:     'rgb(var(--c-warning) / <alpha-value>)',
        danger:      'rgb(var(--c-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px -12px rgba(0,0,0,.35)',
        float: '0 8px 32px rgba(0,0,0,.45)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  safelist: [
    // Dynamic class patterns used in JS templates
    { pattern: /bg-(primary|accent|success|warning|danger|surface|surface-2)(\/\d+)?/ },
    { pattern: /text-(primary|accent|success|warning|danger|muted|white|slate-\d+)/ },
    { pattern: /border-(primary|success|warning|danger|border)/ },
  ],
}
