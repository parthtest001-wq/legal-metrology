/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F4EE',
        ink: '#12233B',
        seal: '#0F2A43',
        brass: '#B08D4F',
        'brass-light': '#D9C08C',
        verified: '#2F6B4F',
        line: '#DCD5C3',
      },
      fontFamily: {
        display: ['"Newsreader"', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-fine': 'linear-gradient(to right, rgba(15,42,67,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,42,67,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
