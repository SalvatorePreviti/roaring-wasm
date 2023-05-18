#!/usr/bin/env node

const { execSync } = require("child_process");
const { runMain } = require("./lib/utils");

runMain(() => {
  execSync("npx lint-staged", { stdio: "inherit" });
  execSync("npx pretty-quick --staged", { stdio: "inherit" });
}, "precommit");
