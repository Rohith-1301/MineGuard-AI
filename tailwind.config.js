/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mine: {
          bg: '#0a0e17',
          surface: '#111827',
          card: '#131d2e',
          cardHover: '#182438',
          border: '#1e2d42',
          borderLight: '#2a3d58',
          header: '#0d1422',
          cyan: '#00f0ff',
          blue: '#0284c7',
          teal: '#14b8a6',
          safe: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          dangerDark: '#991b1b',
          offline: '#64748b',
          textMuted: '#94a3b8',
          textBright: '#f8fafc',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
