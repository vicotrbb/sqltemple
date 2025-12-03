import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/@astrojs/react/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "#1e1e1e",
        "surface-2": "#252526",
        border: "#2f3136",
        accent: "#4ec9b0",
        primary: "#007acc",
        muted: "#a0acc0",
        highlight: "#8ff0df",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', ...fontFamily.sans],
        body: ['"Inter"', ...fontFamily.sans],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(0,0,0,0.35)",
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#cfd8e6",
            "--tw-prose-headings": "#ffffff",
            "--tw-prose-links": "#4ec9b0",
            "--tw-prose-bold": "#ffffff",
            "--tw-prose-counters": "#8b95a9",
            "--tw-prose-bullets": "#4ec9b0",
            "--tw-prose-hr": "#2f3136",
            "--tw-prose-quotes": "#e5ecf5",
            "--tw-prose-code": "#e5ecf5",
            "--tw-prose-pre-code": "#e5ecf5",
            "--tw-prose-pre-bg": "#0f1117",
            "--tw-prose-th-borders": "#2f3136",
            "--tw-prose-td-borders": "#2f3136",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
