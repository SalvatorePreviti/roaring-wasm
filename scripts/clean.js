#!/usr/bin/env node

const path = require("path");
const del = require("del");
const deleteEmpty = require("delete-empty");
const logging = require("./lib/logging");
const root = require("./lib/root");

async function clean() {
  const distFiles = ["*.js", "*.ts", "*.wasm"].map((x) => path.join(root, "dist", "**", x));

  const deletedFiles = (await del([...distFiles])).length;
  const deletedDirectories = (await deleteEmpty(path.join(root, "dist"))).length;

  const message = `deleted ${deletedFiles} files, ${deletedDirectories} directories`;
  if (deletedFiles || deletedDirectories) {
    logging.success(message);
  } else {
    logging.info(message);
  }
}

module.exports = clean;

require("./lib/executableModule")(module);
