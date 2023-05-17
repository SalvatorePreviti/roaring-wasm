#!/usr/bin/env node

const path = require("path");
const logging = require("./lib/logging");
const spawnAsync = require("./lib/spawnAsync");
const emccConfig = require("./config/emcc-config");
const wasmOptConfig = require("./config/wasm-opt-config");
const root = require("./lib/root");
const getFileSizesAsync = require("./lib/getFileSizesAsync");
const executablePathFromEnv = require("./lib/executablePathFromEnv");

async function optimizeWasm() {
  const wasmFile = path.join(root, emccConfig.out.replace(/\.[^.]+$/, ".wasm"));

  await logging.time("wasm optimization", async () => {
    const fszInitial = await getFileSizesAsync(wasmFile);
    if (!fszInitial[0]) {
      throw new Error(`${wasmFile} not found`);
    }

    const wasmOptPath = executablePathFromEnv("BINARYEN_ROOT", "bin", "wasm-opt");

    logging.keyValue("before", fszInitial[0].sizeString);

    for (let repeat = 0; repeat < 2; ++repeat) {
      await spawnAsync(wasmOptPath, [wasmFile, "-o", wasmFile, "-O3", ...wasmOptConfig.args]);
    }

    const fszFinal = await getFileSizesAsync(wasmFile);
    if (!fszFinal[0]) {
      throw new Error(`Failed to generate ${wasmFile}`);
    }
    logging.keyValue("after ", fszFinal[0].sizeString);
  });
}

module.exports = optimizeWasm;

require("./lib/executableModule")(module);
