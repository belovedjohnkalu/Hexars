import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";




export default defineConfig(({ mode }) => {
const config = loadEnv(mode, process.cwd(), "HEXARS_");
return {
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/engine": { target: "ws://127.0.0.1:8765", ws: true },
      "/api": {
        target: config.HEXARS_DEV_API || "http://127.0.0.1:8080", changeOrigin: true,
        headers: config.HEXARS_GATEWAY_SECRET ? { "X-Hexars-Gateway": config.HEXARS_GATEWAY_SECRET } : {},
      },
    },
  },
};
});
