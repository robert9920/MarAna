/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cafe: "#2d1f1a",
        dorado: "#b87539",
        crema: "#fffaf5",
        tinta: "#1f1a17"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(45, 31, 26, 0.10)"
      }
    }
  },
  plugins: []
};
