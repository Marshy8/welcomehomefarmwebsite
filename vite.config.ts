import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Relative, so the same build works at https://welcomehomefarm.org/ and at
  // https://marshy8.github.io/welcomehomefarmwebsite/ while the domain is being
  // connected. Safe only because the site is a single page at the root.
  base: "./",
  plugins: [react(), tailwindcss()],
});
