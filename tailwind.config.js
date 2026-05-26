/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:            '#2c1810',
        accent:         '#a85432',
        'accent-light': '#fdf0e8',
        muted:          '#7c6057',
        surface:        '#faf6f0',
        border:         '#f0e6d3',
      },
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      }
    },
  },
  plugins: [],
}
