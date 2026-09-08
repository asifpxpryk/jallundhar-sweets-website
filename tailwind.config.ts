import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#fdf3f2",
          100: "#fbe4e1",
          200: "#f5c3bd",
          300: "#e9968c",
          400: "#d9635a",
          500: "#c13f37",
          600: "#a52b2a",
          700: "#7a1f25",
          800: "#5e1a1e",
          900: "#4a151a",
        },
        gold: {
          50: "#fdf8ed",
          100: "#faedc8",
          200: "#f4d98d",
          300: "#edc158",
          400: "#e3a934",
          500: "#d4941f",
          600: "#b3741a",
          700: "#8f571b",
          800: "#75461c",
          900: "#5f3a1b",
        },
        cream: "#fff8f0",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
