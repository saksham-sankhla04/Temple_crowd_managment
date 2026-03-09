/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: "#fff8ed",
          100: "#ffefd3",
          200: "#ffd79d",
          300: "#ffbc66",
          400: "#ffa53f",
          500: "#ff8f1f",
          600: "#f17410",
          700: "#c8570d",
          800: "#a04512",
          900: "#813b12",
        },
      },
      boxShadow: {
        temple: "0 8px 30px rgba(255, 143, 31, 0.22)",
      },
    },
  },
  plugins: [],
};
