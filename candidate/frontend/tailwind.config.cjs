/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
        'sm': ['1rem', { lineHeight: '1.5rem' }],          // 16px (기존 14px에서 증가)
        'base': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px (기존 16px에서 증가)
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],      // 20px
        'xl': ['1.5rem', { lineHeight: '2rem' }],          // 24px
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],      // 36px
        '4xl': ['3rem', { lineHeight: '1' }],              // 48px
        '5xl': ['3.75rem', { lineHeight: '1' }],           // 60px
        '6xl': ['4.5rem', { lineHeight: '1' }],            // 72px
      },
    },
  },
  plugins: [],
}; 