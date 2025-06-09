/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./thankyou.html", 
    "./fail.html",
    "./test-payment.html",
    "./src/**/*.{html,js}",
    "./*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#f97316',
          'orange-dark': '#ea580c', 
          'orange-light': '#fb923c',
          blue: '#1e40af',
          'blue-dark': '#1e3a8a',
          slate: '#64748b',
          'slate-light': '#94a3b8',
          'slate-dark': '#475569'
        }
      },
      screens: {
        'xxs': '320px',
        'xs': '375px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px', 
          lg: '1024px',
          xl: '1140px',
          '2xl': '1140px',
        },
      },
      boxShadow: {
        'brand': '0 8px 24px rgba(249, 115, 22, 0.15)',
        'brand-hover': '0 12px 32px rgba(249, 115, 22, 0.25)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
} 