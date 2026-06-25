import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg1: 'var(--bg-1)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--border)',
        lineStrong: 'var(--border-strong)',
        ink: 'var(--text)',
        ink2: 'var(--text-2)',
        ink3: 'var(--text-3)',
        accent: 'var(--accent)',
        accent2: 'var(--accent-2)',
        accent3: 'var(--accent-3)',
        accent4: 'var(--accent-4)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        info: 'var(--info)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
      },
      backgroundImage: {
        brand: 'var(--grad)',
        'brand-text': 'var(--grad-text)',
      },
      boxShadow: {
        glow: 'var(--glow)',
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(.16,1,.3,1)',
      },
      keyframes: {
        float: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-16px)' } },
        drift: { '0%': { transform: 'translate3d(0,0,0) scale(1)' }, '100%': { transform: 'translate3d(6vw,5vw,0) scale(1.18)' } },
        scrollx: { to: { transform: 'translateX(-50%)' } },
        sheen: { '0%': { transform: 'translateX(-70%)' }, '56%': { transform: 'translateX(70%)' }, '100%': { transform: 'translateX(70%)' } },
        rise: { to: { transform: 'translateY(0)' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.3' } },
      },
      animation: {
        float: 'float 6s cubic-bezier(.16,1,.3,1) infinite alternate',
        drift: 'drift 22s cubic-bezier(.16,1,.3,1) infinite alternate',
        scrollx: 'scrollx 26s linear infinite',
        sheen: 'sheen 5s cubic-bezier(.16,1,.3,1) infinite',
        pulse2: 'pulse2 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
