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
        surface: "#0f1117",
        "surface-2": "#141824",
        border: "#1f2433",
        accent: "#61dafb",
        primary: "#316192",
        purple: "#412991",
        muted: "#9ea7b8",
        highlight: "#c3f0ff",
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
            "--tw-prose-links": "#61dafb",
            "--tw-prose-bold": "#ffffff",
            "--tw-prose-counters": "#8b95a9",
            "--tw-prose-bullets": "#61dafb",
            "--tw-prose-hr": "#1f2433",
            "--tw-prose-quotes": "#e5ecf5",
            "--tw-prose-code": "#e5ecf5",
            "--tw-prose-pre-code": "#e5ecf5",
            "--tw-prose-pre-bg": "#0c0e14",
            "--tw-prose-th-borders": "#1f2433",
            "--tw-prose-td-borders": "#1f2433",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
