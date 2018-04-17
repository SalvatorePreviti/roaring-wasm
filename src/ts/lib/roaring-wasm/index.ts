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

  roaring_bitmap_temp_offset: number

  _malloc(size: number): number
  _free(pointer: number): void

  _get_sizeof_roaring_bitmap_t(): number

  _roaring_bitmap_create_js(initialCapacity: number): number
  _roaring_bitmap_free(roaring: number): void

  _roaring_bitmap_get_cardinality(roaring: number): number
  _roaring_bitmap_is_empty(roaring: number): boolean
  _roaring_bitmap_add(roaring: number, value: number): void
  _roaring_bitmap_add_many(roaring: number, count: number, values: number): void
  _roaring_bitmap_remove(roaring: number, value: number): void
  _roaring_bitmap_maximum(roaring: number): number
  _roaring_bitmap_minimum(roaring: number): number
  _roaring_bitmap_contains(roaring: number, value: number): boolean
  _roaring_bitmap_is_subset(roaring1: number, roaring2: number): boolean
  _roaring_bitmap_is_strict_subset(roaring1: number, roaring2: number): boolean
  _roaring_bitmap_to_uint32_array(roaring: number, arrayPtr: number): void
  _roaring_bitmap_equals(roaring1: number, roaring2: number): boolean
  _roaring_bitmap_flip_inplace(roaring: number, start: number, end: number): void
  _roaring_bitmap_remove_run_compression(roaring: number): boolean
  _roaring_bitmap_run_optimize(roaring: number): boolean
  _roaring_bitmap_shrink_to_fit(roaring: number): number
  _roaring_bitmap_select_js(roaring: number, rank: number): number
  _roaring_bitmap_and_cardinality(roaring1: number, roaring2: number): number
  _roaring_bitmap_or_cardinality(roaring1: number, roaring2: number): number
  _roaring_bitmap_andnot_cardinality(roaring1: number, roaring2: number): number
  _roaring_bitmap_xor_cardinality(roaring1: number, roaring2: number): number
  _roaring_bitmap_rank(roaring: number, value: number): number
  _roaring_bitmap_portable_size_in_bytes(roaring: number): number
  _roaring_bitmap_portable_serialize_alloc_js(roaring: number): boolean
  _roaring_bitmap_portable_deserialize_js(roaring: number, buf: number, size: number): number
}

function loadRoaringWasm(): RoaringWasm {
  const cwd: string = process.cwd()
  try {
    process.chdir(__dirname)

    const roaringWasm = require('./roaring-wasm-module')({
      noExitRuntime: true
    }) as RoaringWasm

    roaringWasm.roaring_bitmap_temp_offset = roaringWasm._get_sizeof_roaring_bitmap_t()

    return roaringWasm
  } finally {
    process.chdir(cwd)
  }
}

/**
 * @module
 * Roaring WASM module instantiation
 */
export = loadRoaringWasm()
