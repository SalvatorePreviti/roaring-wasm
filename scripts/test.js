#!/usr/bin/env node

const { ROOT_FOLDER, ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER } = require("./config/paths");
const { runMain, forkAsync } = require("./lib/utils");
const fs = require("fs");
const path = require("path");

if (require.main === module) {
  process.chdir(ROOT_FOLDER);

  require("ts-node").register();

  runMain(() => {
    if (!fs.existsSync(path.resolve(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER, "index.wasm"))) {
      throw new Error("Please run `npm run build` before running tests");
    }

    process.argv.push("--recursive");
    process.argv.push("test/unit/**/*.test.ts");

    if (process.argv.includes("--test-package")) {
      process.argv.push("test/package-test/*.test.ts");
    }

    require("mocha/bin/mocha");
  }, "test");
} else {
  module.exports = {
    test(args = []) {
      return forkAsync(__filename, args, { stdio: "inherit", cwd: ROOT_FOLDER });
    },
  };
}
