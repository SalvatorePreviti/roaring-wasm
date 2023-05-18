#!/usr/bin/env node

const { runMain, forkAsync } = require("./lib/utils");

if (require.main === module) {
  require("ts-node").register();

  runMain(() => {
    process.argv.push("test/**/*.test.ts");
    process.argv.push("test/*.test.ts");

    require("mocha/bin/mocha");
  }, "test");
} else {
  module.exports = {
    test() {
      return forkAsync(__filename, []);
    },
  };
}
