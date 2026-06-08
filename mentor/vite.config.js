import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || "/",
  define: {
    // API URL — Vercel da VITE_API_URL env var, mahallida proxy
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL || ""),
  },
  server: {
    port: 5174,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
