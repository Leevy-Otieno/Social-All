/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        // ── CSS-variable-linked tokens (match config.js theme) ─────
        primary:    { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE' },
        accent:     '#0EA5E9',
        surface:    '#F8FAFC',
        border:     '#E2E8F0',
        danger:     '#EF4444',
        success:    '#22C55E',
        warning:    '#F59E0B',
        'text-1':   '#0F172A',
        'text-2':   '#64748B',
        'text-3':   '#94A3B8',
        sponsored:  { bg: '#FEF9C3', text: '#A16207' },

        // ── shadcn/ui compatibility (bg-background etc.) ────────────
        background:  '#FFFFFF',
        foreground:  '#0F172A',
        muted:       { DEFAULT: '#F8FAFC', foreground: '#64748B' },
        card:        { DEFAULT: '#FFFFFF', foreground: '#0F172A' },
        popover:     { DEFAULT: '#FFFFFF', foreground: '#0F172A' },
        secondary:   { DEFAULT: '#F8FAFC', foreground: '#0F172A' },
        destructive: { DEFAULT: '#EF4444', foreground: '#FFFFFF' },
        input:       '#E2E8F0',
        ring:        '#2563EB',
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        sm:  '0.5rem',
        md:  '0.75rem',
        lg:  '1rem',
        xl:  '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      maxWidth: {
        feed:  '600px',
        prose: '65ch',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-md': '0 4px 12px -2px rgba(0,0,0,0.08)',
        'card-lg': '0 10px 30px -5px rgba(0,0,0,0.1)',
        'sheet':   '0 -20px 60px -10px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
