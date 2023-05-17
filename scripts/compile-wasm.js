#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const globby = require("globby");
const root = require("./lib/root");
const logging = require("./lib/logging");
const spawnAsync = require("./lib/spawnAsync");
const emccConfig = require("./config/emcc-config");
const getFileSizesAsync = require("./lib/getFileSizesAsync");
const optimizeWasm = require("./optimize-wasm");
const executablePathFromEnv = require("./lib/executablePathFromEnv");

function emcc(files) {
  const emccPath = executablePathFromEnv("EMSCRIPTEN", null, "emcc");

  return spawnAsync(emccPath, [...files, ...emccConfig.args, "-o", emccConfig.out], {
    stdio: "inherit",
    cwd: root,
    env: Object.assign({}, process.env, {
      EMCC_CLOSURE_ARGS: `${emccConfig.closureArgs.join(" ")} ${process.env.EMCC_CLOSURE_ARGS || ""}`,
      EMCC_CFLAGS: `${emccConfig.cflags.join(" ")} ${process.env.EMCC_CLOSURE_ARGS || ""}`,
      EMMAKEN_CXXFLAGS: `${emccConfig.cflags.join(" ")} ${process.env.EMCC_CLOSURE_ARGS || ""}`,
    }),
  });
}

async function compileWasm() {
  await fs.promises.mkdir(path.join(root, path.dirname(emccConfig.out)), { recursive: true });

  const files = await globby(emccConfig.files, { root });

  await logging.time(`compile ${files.length} .c files`, () => emcc(files));

  const fileSizes = await getFileSizesAsync(`${emccConfig.out.substr(0, emccConfig.out.lastIndexOf("."))}.*`);
  for (const f of fileSizes) {
    logging.keyValue(f.path, f.sizeString);
  }

  await optimizeWasm();
}

module.exports = compileWasm;

require("./lib/executableModule")(module);
