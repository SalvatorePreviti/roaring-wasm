#!/usr/bin/env node

const { timed, runMain } = require("./lib/utils");
const { compileWasm } = require("./compile-wasm");
const { compileTs } = require("./compile-ts");
const { test } = require("./test");

async function build() {
  await timed("compileWasm", compileWasm);
  await timed("compileTs", compileTs);
  await timed("test", () => test(["--test-package"]));
}

module.exports = { build };

if (require.main === module) {
  runMain(build);
}
