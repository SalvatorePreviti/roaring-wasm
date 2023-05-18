#!/usr/bin/env node

const { forkAsync, timed, runMain, ROOT_FOLDER } = require("./lib/utils");

async function compileTs() {
  await timed("compileTS", async () => {
    await Promise.all([forkAsync(require.resolve("typescript/bin/tsc"), ["-p", "tsconfig-build.json"])], {
      cwd: ROOT_FOLDER,
    });
  });
}

module.exports = { compileTs };

if (require.main === module) {
  runMain(compileTs);
}
