/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Yaban Color Palette
        'yaban-darkest': '#232625',
        'yaban-dark': '#35403A',
        'yaban-mid': '#4C594F',
        'yaban-light': '#A4A69C',
        'yaban-lightest': '#BFBFB8',

        // Semantic Colors - Light Mode
        'background-light': '#F4F6F8',
        'card-light': '#FFFFFF',
        'text-light-primary': '#1C1C1E',
        'text-light-secondary': '#8A8A8F',
        'border-light': '#E5E5EA',

        // Semantic Colors - Dark Mode
        'background-dark': '#232625',
        'card-dark': '#35403A',
        'text-dark-primary': '#BFBFB8',
        'text-dark-secondary': '#A4A69C',
        'border-dark': '#4C594F',

        // Accent & Interactive
        'primary': '#A4A69C',
        'accent': '#4C594F',
        'accent-text': '#FFFFFF',

        // Legacy (keep for backward compatibility)
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
