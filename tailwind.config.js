/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'custom': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backdropBlur: {
        'custom': '8.5px',
      },
      keyframes: {
        skeleton: {
          '0%': { backgroundColor: 'hsl(200, 20%, 80%)' },
          '100%': { backgroundColor: 'hsl(200, 20%, 95%)' },
        }
      },
      animation: {
        skeleton: 'skeleton 1s linear infinite alternate',
      }
    },
  },
  plugins: [],
}

