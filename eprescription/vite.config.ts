import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Import the correct PostCSS plugin for Tailwind CSS
import tailwindcssPlugin from "@tailwindcss/postcss";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcssPlugin()], // Use the correct Tailwind CSS plugin for PostCSS
    },
  },
});