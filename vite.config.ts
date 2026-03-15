import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "",
  define: {
    "import.meta.env.VERCEL_ENV": JSON.stringify(process.env.VERCEL_ENV),
  },
  server: {
    port: 5000,
  },
  build: {
    sourcemap: true,
  },
});
