#!/usr/bin/env node

const { ROOT_FOLDER } = require("./config/paths");
const { runMain, forkAsync } = require("./lib/utils");

if (require.main === module) {
  process.chdir(ROOT_FOLDER);

  require("ts-node").register();

  runMain(() => {
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
