const path = require("path");

const ROOT_FOLDER = path.resolve(__dirname, "../../");
const ROARING_WASM_OUT_FOLDER = path.resolve(ROOT_FOLDER, "packages/roaring-wasm");
const ROARING_WASM_CPP_SRC_FOLDER = path.resolve(ROOT_FOLDER, "src/cpp");
const ROARING_WASM_SRC_FOLDER = path.resolve(ROOT_FOLDER, "src/ts");
const ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER = path.resolve(ROARING_WASM_SRC_FOLDER, "lib/roaring-wasm-module");
const ROARING_WASM_EMCC_BUILD_FOLDER = path.resolve(ROARING_WASM_SRC_FOLDER, "build/emcc");

module.exports = {
  ROOT_FOLDER,
  ROARING_WASM_OUT_FOLDER,
  ROARING_WASM_SRC_FOLDER,
  ROARING_WASM_SRC_WASM_MODULE_OUT_FOLDER,
  ROARING_WASM_EMCC_BUILD_FOLDER,
  ROARING_WASM_CPP_SRC_FOLDER,
};
