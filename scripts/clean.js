#!/usr/bin/env node

const { colors, runMain, removeTrailingSlash } = require("./lib/utils");
const {
  ROOT_FOLDER,
  ROARING_WASM_OUT_FOLDER,
  ROARING_WASM_EMCC_BUILD_FOLDER,
  ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER,
} = require("./config/paths");

const fs = require("fs");
const globby = require("fast-glob");

async function cleanDistFiles() {
  const distFiles = await globby([`${removeTrailingSlash(ROARING_WASM_OUT_FOLDER)}/**/*.{js,mjs,cjs,ts,wasm}`], {
    ignore: ["**/node_modules/**"],
    cwd: ROOT_FOLDER,
    onlyFiles: true,
  });

  let deletedFiles = 0;

  const deleteFile = (file) =>
    fs.promises
      .unlink(file)
      .then(() => ++deletedFiles)
      .catch(() => {});

  const promises = [];
  for (const file of distFiles) {
    promises.push(deleteFile(file));
  }

  await Promise.all(promises);

  if (deletedFiles) {
    console.log(colors.yellow(`• cleaned ${deletedFiles} dist files`));
  }

  return deletedFiles;
}

async function clean() {
  console.log();
  const promises = [];

  let deletedDirectories = 0;

  const deleteDir = (dir) =>
    fs.promises
      .rm(dir, { force: true, recursive: true })
      .then(() => ++deletedDirectories)
      .catch(() => {});

  promises.push(cleanDistFiles());
  promises.push(deleteDir(ROARING_WASM_EMCC_BUILD_FOLDER));
  promises.push(deleteDir(ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER));

  await Promise.all(promises);

  if (deletedDirectories) {
    console.log(colors.yellow(`• cleaned ${deletedDirectories} build directories`));
  }
  console.log();
}

module.exports = { cleanDistFiles, clean };

if (require.main === module) {
  runMain(clean);
}
