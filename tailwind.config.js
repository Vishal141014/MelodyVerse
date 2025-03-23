/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
          light: 'rgb(236, 64, 122)',
          dark: 'rgb(194, 24, 91)',
        },
        background: 'rgb(var(--background))',
        darker: 'rgb(var(--darker))',
        foreground: 'rgb(var(--text-color-rgb))',
        pink: {
          light: '#FFD1DC',
          medium: '#FFB7CA',
          dark: '#C2185B',
        },
      },
      animation: {
        spin: 'spin 1s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(var(--primary), 0.3)',
        'pink-sm': '0 2px 5px rgba(194, 24, 91, 0.1)',
        'pink-md': '0 4px 10px rgba(194, 24, 91, 0.15)',
      },
    },
  },
  plugins: [],
}; 