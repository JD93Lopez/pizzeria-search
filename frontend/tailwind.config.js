/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pizza: {
          red: "#D32F2F",
          orange: "#FF5722",
          yellow: "#FFC107",
          cream: "#FFF8E1",
        },
      },
    },
  },
  plugins: [],
};
