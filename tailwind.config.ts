import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          darkest: '#1e1f22',
          darker: '#2b2d31',
          sidebar: '#313338',
          chat: '#383a40',
          hover: '#404249',
          accent: '#5865f2',
          success: '#23a55a',
          warning: '#f0b232',
          danger: '#f23f43'
        }
      }
    },
  },
  plugins: [],
};
export default config;
