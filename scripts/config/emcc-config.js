#!/usr/bin/env node

const exportedFunctions = require('./exportedFunctions')
function buildEmccArgs() {
  const args = []

  args.push('--memory-init-file', '1')

  // optimizations
  args.push('-O3')
  args.push('--llvm-lto', '3')
  args.push('--llvm-opts', '3')

  // js optimizations
  args.push('--js-opts', '1')
  args.push('--closure', '1')
  args.push('--minify', '0')

  // see https://github.com/kripken/emscripten/blob/master/src/settings.js

  // settings
  args.push('-s', 'BINARYEN=1')
  args.push('-s', 'BINARYEN_ASYNC_COMPILATION=0')
  args.push('-s', "BINARYEN_METHOD='native-wasm'")
  args.push('-s', `EXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`)
  args.push('-s', 'EXPORT_NAME="roaring_wasm_module"')
  args.push('-s', 'INVOKE_RUN=0')
  args.push('-s', 'MODULARIZE=1')
  args.push('-s', 'NO_EXIT_RUNTIME=1')
  args.push('-s', 'NO_FILESYSTEM=1')
  args.push('-s', 'NODEJS_CATCH_EXIT=0')
  args.push('-s', 'ALLOW_MEMORY_GROWTH=1')
  args.push('-s', 'ABORTING_MALLOC=0')
  args.push('-s', 'DISABLE_EXCEPTION_CATCHING=1')

  // optimizations
  args.push('-s', 'EVAL_CTORS=1')
  args.push('-s', 'ASSERTIONS=0')
  args.push('-s', 'AGGRESSIVE_VARIABLE_ELIMINATION=1')

  //args.push('-s', 'WARN_UNALIGNED=1')

  return args
}

function buildEmccClosureArgs() {
  const args = []
  args.push('--warning_level', 'VERBOSE')
  args.push('--compilation_level', 'ADVANCED_OPTIMIZATIONS')
  args.push('--module_resolution', 'NODE')
  args.push('--assume_function_wrapper')
  args.push('--manage_closure_dependencies')
  args.push('--use_types_for_optimization')
  return args
}

const config = {
  emcc: {
    sources: ['src/**/*.c', 'src/**/*.cpp'],
    out: 'dist/lib/roaring-wasm/roaring-wasm-module.js',
    args: buildEmccArgs(),
    closureArgs: buildEmccClosureArgs()
  }
}

module.exports = config
