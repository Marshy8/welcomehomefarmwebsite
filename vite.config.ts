import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Served from https://marshy8.github.io/welcomehomefarmwebsite/ on GitHub
  // Pages. Change to "/" if the site moves to a custom domain (public/CNAME).
  base: "/welcomehomefarmwebsite/",
  plugins: [react(), tailwindcss()],
});
