#!/usr/bin/env node

const { ROOT_FOLDER, runMain, forkAsync } = require("./lib/utils");

async function typecheck() {
  await forkAsync(require.resolve("typescript/bin/tsc"), ["--noEmit"], { cwd: ROOT_FOLDER });
}

module.exports = {
  typecheck,
};

if (require.main === module) {
  runMain(typecheck);
}
