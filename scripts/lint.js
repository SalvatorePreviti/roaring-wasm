#!/usr/bin/env node

const { isCI, forkAsync, spawnAsync, timed, runMain } = require("./lib/utils");
const { typecheck } = require("./typecheck.js");

async function lint(args = process.argv.slice(2)) {
  const isFix = (args.includes("--fix") || !isCI) && !args.includes("--no-fix");

  let typecheckError;
  let typecheckPromise = timed("typecheck", typecheck);
  if (isFix) {
    await typecheckPromise;
  } else {
    typecheckPromise = typecheckPromise.catch((e) => (typecheckError = e || "typecheckError"));
  }

  let eslintPromise = timed(isFix ? "eslint fix" : "eslint check", () =>
    spawnAsync("npx", ["eslint", ".", "--no-error-on-unmatched-pattern", isFix ? "--fix" : "--max-warnings=0"], {
      title: isFix ? "eslint fix" : "eslint check",
      showStack: false,
    }),
  );

  let eslintError;
  if (isFix) {
    await eslintPromise;
  } else {
    eslintPromise = eslintPromise.catch((e) => (eslintError = e || "eslintError"));
  }

  const prettierPromise = timed(isFix ? "prettier fix" : "prettier check", () =>
    forkAsync(require.resolve("prettier/bin-prettier.js"), ["--loglevel=warn", isFix ? "--write" : "--check", "."]),
  );

  await Promise.all([typecheckPromise, eslintPromise, prettierPromise]);

  if (typecheckError) {
    throw typecheckError;
  }
  if (eslintError) {
    throw eslintError;
  }
}

module.exports = {
  lint,
};

if (require.main === module) {
  runMain(lint);
}
