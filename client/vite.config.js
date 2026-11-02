import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Mọi request /api được chuyển tới backend Express
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": process.env.API_URL || "http://localhost:5000" },
  },
});
