/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/renderer/**/*.{js,jsx,ts,tsx}", "./src/renderer/index.html"],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: "#1e1e1e",
          "bg-secondary": "#252526",
          "bg-tertiary": "#2d2d2d",
          "bg-quaternary": "#3e3e42",
          border: "#3e3e42",
          "border-secondary": "#464647",
          text: "#d4d4d4",
          "text-secondary": "#969696",
          "text-tertiary": "#6e7681",
          blue: "#007acc",
          "blue-light": "#1f8dd6",
          green: "#4ec9b0",
          red: "#f48771",
          yellow: "#dcdcaa",
          purple: "#c586c0",
          orange: "#ce9178",
          cyan: "#4dc9c9",
          pink: "#f14c4c",
          brown: "#8b7355",
        },
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: "11px",
        sm: "12px",
        base: "13px",
        lg: "14px",
        xl: "16px",
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
