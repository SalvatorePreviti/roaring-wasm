import { resolve } from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  clearScreen: false,

  root: resolve(__dirname),
  define: { "process.env": {} },
  plugins: [nodePolyfills()],
  server: {
    port: 3000,
    host: "127.0.0.1",
    strictPort: true,
  },
});
