#!/usr/bin/env node

const { ROOT_FOLDER, colors, runMain } = require("./lib/utils");

const fs = require("fs");
const path = require("path");
const globby = require("fast-glob");
const deleteEmpty = require("delete-empty");

async function clean() {
  const distFiles = await globby(["*.js", "*.ts", "*.wasm"], { cwd: path.resolve(ROOT_FOLDER, "dist") });

  // Remove all distFiles

  let deletedFiles = 0;

  const deleteFile = (file) =>
    fs.promises
      .unlink(path.join(ROOT_FOLDER, "dist", file))
      .then(() => ++deletedFiles)
      .catch(() => {});

  const promises = [];
  for (const file of distFiles) {
    promises.push(deleteFile(file));
  }

  await Promise.all(promises);

  const deletedDirectories = (await deleteEmpty(path.resolve(ROOT_FOLDER, "dist"))).length;

  console.log(`• ${colors.cyan(`deleted ${deletedFiles} files, ${deletedDirectories} directories`)}`);
}

module.exports = { clean };

if (require.main === module) {
  runMain(clean);
}
