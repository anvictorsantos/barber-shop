/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        shell: 'var(--shell)',
        surface: 'var(--surface)',
        'surface-input': 'var(--surface-input)',
        'surface-subtle': 'var(--surface-subtle)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-ink': 'var(--accent-ink)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        subtle: 'var(--subtle)',
        inactive: 'var(--inactive)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        shell: 'var(--radius-shell)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        primary: 'var(--shadow-primary)',
      },
      backgroundImage: {
        loyalty: 'var(--loyalty-gradient)',
      },
      fontSize: {
        micro: ['11px', '14px'],
        caption: ['12px', '16px'],
        label: ['12px', '16px'],
        body: ['14px', '20px'],
        lead: ['16px', '24px'],
        title: ['18px', '24px'],
        page: ['24px', '30px'],
        metric: ['28px', '32px'],
        brand: ['32px', '40px'],
      },
      minHeight: {
        touch: '44px',
      },
      maxWidth: {
        shell: '1440px',
        prose: '680px',
        narrow: '480px',
        mid: '540px',
      },
      zIndex: {
        toast: '60',
      },
    },
  },
  plugins: [],
}
