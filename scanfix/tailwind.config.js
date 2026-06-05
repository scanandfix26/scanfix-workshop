/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: { DEFAULT: '#F5B400', dark: '#D9A000', light: '#FFF8E1' },
        dark: { DEFAULT: '#1E1E1E', light: '#333333' },
        success: '#00A651',
        danger: '#E53935',
        bg: '#F4F4F4'
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem'
      }
    }
  },
  plugins: []
}
