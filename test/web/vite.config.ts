import { resolve } from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  root: resolve(__dirname),

  define: {
    "process.env": {},
  },

  clearScreen: false,

  // resolve: {
  //   alias: [
  //     // "roaring-wasm-src/lib/roaring-wasm-module/index.js": resolve(ROARING_WASM_EMCC_BUILD_FOLDER, "index.browser.js"),
  //     { find: /,*(\/lib\/roaring-wasm-module\/index.js)$/, replacement: "/lib/roaring-wasm-module/index.browser.js" },
  //   ],
  // },

  plugins: [nodePolyfills()],

  server: {
    port: 3000,
  },
});
