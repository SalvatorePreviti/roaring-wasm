#!/usr/bin/env node

const exportedFunctions = require("./exportedFunctions");

function buildEmccArgs() {
  const args = [];

  // optimizations
  args.push("-O3");
  args.push("--llvm-lto", "2");
  args.push(
    "--llvm-opts",
    JSON.stringify([
      "-O3",
      "-thread-model=single",
      "-always-inline",
      "-consthoist",
      "-tailcallopt",
      "-constprop",
      "-std-link-opts",
      "-ipconstprop",
      "-sink",
      "-simple-loop-unswitch",
      "-partially-inline-libcalls",
      "-nary-reassociate",
      "-loop-predication",
      "-loop-interchange",
      "-loop-data-prefetch",
      "-mldst-motion",
      "-irce",
      "-gvn-sink",
      "-gvn-hoist",
      "-unreachableblockelim",
      "-global-merge",
      "-speculative-execution",
      "-slsr",
      "-dce",
      "-die",
      "-dse",
      "-loop-versioning-licm",
      "-iv-users",
      "-enable-unsafe-fp-math",
    ]),
  );

  // js optimizations
  args.push("--output_eol", "linux");
  args.push("--js-opts", "1");
  args.push("--closure", "1");
  args.push("--minify", "0");

  // see https://github.com/kripken/emscripten/blob/master/src/settings.js

  // settings

  args.push("--pre-js", "src/cpp/pre-js.js");
  args.push("--post-js", "src/cpp/post-js.js");

  args.push("--memory-init-file", "1");

  args.push("-s", "BINARYEN=1");
  args.push("-s", "BINARYEN_ASYNC_COMPILATION=0");
  args.push("-s", "BINARYEN_METHOD='native-wasm'");
  args.push("-s", `EXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`);
  args.push("-s", 'EXPORT_NAME="roaring_wasm_module"');
  args.push("-s", "INVOKE_RUN=0");
  args.push("-s", "MODULARIZE=1");
  args.push("-s", "NO_EXIT_RUNTIME=1");
  args.push("-s", "NO_FILESYSTEM=1");
  args.push("-s", "NODEJS_CATCH_EXIT=0");
  args.push("-s", "ALLOW_MEMORY_GROWTH=1");
  args.push("-s", "ABORTING_MALLOC=0");
  args.push("-s", "DISABLE_EXCEPTION_CATCHING=1");

  // optimizations
  args.push("-s", "EVAL_CTORS=1");
  args.push("-s", "AGGRESSIVE_VARIABLE_ELIMINATION=1");

  args.push("-s", "ASSERTIONS=0");
  args.push("-s", "SAFE_HEAP=0");
  args.push("-s", "SAFE_HEAP_LOG=0");
  args.push("-s", "WARN_UNALIGNED=0");

  return args;
}

function buildEmccClosureArgs() {
  const args = [];
  args.push("--warning_level", "VERBOSE");
  args.push("--compilation_level", "ADVANCED_OPTIMIZATIONS");
  args.push("--module_resolution", "NODE");
  args.push("--assume_function_wrapper");
  args.push("--dependency_mode", "PRUNE_LEGACY");
  args.push("--use_types_for_optimization");
  args.push("--jscomp_off=checkVars");
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
  out: "dist/lib/roaring-wasm/roaring-wasm-module.js",
  args: buildEmccArgs(),
  closureArgs: buildEmccClosureArgs(),
  cflags: buildCflags(),
  files: ["src/cpp/roaring.c", "src/cpp/roaring-js.c"],
};

module.exports = config;
