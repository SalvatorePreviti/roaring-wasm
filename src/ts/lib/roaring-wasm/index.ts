type RoaringWasm = {
  readonly wasmMemory: WebAssembly.Memory

  readonly HEAP8: Int8Array
  readonly HEAP16: Int16Array
  readonly HEAP32: Int32Array
  readonly HEAPU8: Uint8Array
  readonly HEAPU16: Uint16Array
  readonly HEAPU32: Uint32Array
  readonly HEAPF32: Float32Array
  readonly HEAPF64: Float64Array

  _malloc(size: number): number
  _free(pointer: number): void
}

function loadRoaringWasm(): RoaringWasm {
  const cwd: string = process.cwd()
  try {
    process.chdir(__dirname)
    return require('./roaring-wasm-module')({
      noExitRuntime: true
    })
  } finally {
    process.chdir(cwd)
  }
}

/**
 * @module
 * Roaring WASM module instantiation
 */
export = loadRoaringWasm()
