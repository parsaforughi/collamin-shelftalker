import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: "#f8fbff",
          100: "#eef5fb",
          200: "#d6e3f3",
          500: "#7ba4d0"
        }
      }
    }
  },
  plugins: []
};

export default config;
