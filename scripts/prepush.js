#!/usr/bin/env node

const { execSync } = require("child_process");

const { runMain } = require("./lib/utils");

runMain(() => {
  execSync("npm run lint", { stdio: "inherit" });
  execSync("npm run test", { stdio: "inherit" });
}, "prepush");
