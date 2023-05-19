#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { ROARING_WASM_OUT_FOLDER, ROOT_FOLDER } = require("./config/paths");
const { runMain, forkAsync } = require("./lib/utils");

if (require.main === module) {
  process.chdir(ROOT_FOLDER);

  require("ts-node").register();

  runMain(() => {
    process.argv.push("--recursive");
    process.argv.push("test/unit/**/*.test.ts");

    if (
      process.argv.includes("--test-package") ||
      (fs.existsSync(path.resolve(ROARING_WASM_OUT_FOLDER, "index.js")) &&
        fs.existsSync(path.resolve(ROARING_WASM_OUT_FOLDER, "index.wasm")))
    ) {
      process.argv.push("test/package-test/*.test.ts");
    }

    require("mocha/bin/mocha");
  }, "test");
} else {
  module.exports = {
    test() {
      return forkAsync(__filename, [], { stdio: "inherit", cwd: ROOT_FOLDER });
    },
  };
}
