#!/usr/bin/env node

const exportedFunctions = require("./exportedFunctions");

function buildEmccArgs() {
  const args = [];

  // optimizations
  args.push("-Isubmodules/CRoaring/include");

  args.push("-O3");

  // js optimizations
  args.push("--output_eol", "linux");
  args.push("--closure", "0");
  args.push("--minify", "0");

  // see https://github.com/kripken/emscripten/blob/master/src/settings.js

  // settings

  args.push("-s", "SINGLE_FILE");

  args.push("-s", `EXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`);

  args.push("-s", "BINARYEN_ASYNC_COMPILATION=0");
  args.push("-s", "BINARYEN_METHOD='native-wasm'");
  args.push("-s", "ALLOW_MEMORY_GROWTH=1");
  args.push("-s", "DISABLE_EXCEPTION_CATCHING=1");
  args.push("-s", "INVOKE_RUN=0");
  args.push("-s", "MODULARIZE=0");
  args.push("-s", "EXIT_RUNTIME=0");
  args.push("-s", "FILESYSTEM=0");
  args.push("-s", "NODEJS_CATCH_EXIT=0");
  args.push("-s", "NODEJS_CATCH_REJECTION=0");
  args.push("-s", "ABORTING_MALLOC=0");
  args.push("-s", "SUPPORT_LONGJMP=0");

  // optimizations
  args.push("-s", "EVAL_CTORS=1");
  args.push("-s", "AGGRESSIVE_VARIABLE_ELIMINATION=1");

  args.push("-s", "ASSERTIONS=0");
  args.push("-s", "WARN_UNALIGNED=0");

  return args;
}

function buildCflags() {
  const args = [];
  args.push("-O3");
  args.push("-Wall");
  args.push("-Wno-error=unused-local-typedefs");
  args.push("-flto=full");
  args.push("-ffast-math");
  return args;
}

const config = {
  out: "build/wasm/roaring-wasm-module.js",
  args: buildEmccArgs(),
  cflags: buildCflags(),
  files: ["src/cpp/roaring.c", "src/cpp/roaring-js.c"],
};

module.exports = config;
