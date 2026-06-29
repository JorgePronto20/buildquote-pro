/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#1e3a5f',
          blue: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}
