/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcddff",
          300: "#8ec5ff",
          400: "#59a1ff",
          500: "#3380fc",
          600: "#1f62f0",
          700: "#184ddc",
          800: "#1a3fb2",
          900: "#1c398c",
        },
      },
    },
  },
  plugins: [],
};
