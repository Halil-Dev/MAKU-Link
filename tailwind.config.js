/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primaryBlue: '#468BE6',
        softBlue: '#93BFEF',
        darkNavy: '#092F64',
        darkBackground: '#1F1F1F',
        lightAccent: '#E9F5FF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'blue-glow': '0 0 44px rgba(70, 139, 230, 0.36)',
      },
    },
  },
  plugins: [],
}
