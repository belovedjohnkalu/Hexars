import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { HttpsProxyAgent } from "https-proxy-agent";

// Cloud workspaces may require outbound traffic to use their configured proxy.
const outboundProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const cloudAgent = outboundProxy ? new HttpsProxyAgent(outboundProxy) : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/engine": { target: "ws://127.0.0.1:8765", ws: true },
      "/_api": { target: "https://hexars.floot.app", changeOrigin: true, agent: cloudAgent },
      "/_cdn": { target: "https://hexars.floot.app", changeOrigin: true, agent: cloudAgent },
    },
  },
});
