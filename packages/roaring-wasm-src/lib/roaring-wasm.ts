import roaring_wasm_module_init from "./roaring-wasm-module";

export type NullablePtr = number | false;

export type Ptr = number;

export type RoaringWasm = {
  readonly HEAP8: Int8Array;
  readonly HEAP16: Int16Array;
  readonly HEAP32: Int32Array;
  readonly HEAPU8: Uint8Array;
  readonly HEAPU16: Uint16Array;
  readonly HEAPU32: Uint32Array;
  readonly HEAPF32: Float32Array;
  readonly HEAPF64: Float64Array;

  _malloc(size: number): Ptr;
  _free(pointer: NullablePtr): void;
  _roaring_bitmap_create_with_capacity(capacity: number): number;
  _roaring_bitmap_free(roaring: number): void;
  _roaring_bitmap_get_cardinality(roaring: number): number;
  _roaring_bitmap_is_empty(roaring: number): boolean;
  _roaring_bitmap_add(roaring: number, value: number): void;
  _roaring_bitmap_add_checked(roaring: number, value: number): boolean;
  _roaring_bitmap_add_many(roaring: number, count: number, values: number): void;
  _roaring_bitmap_remove(roaring: number, value: number): void;
  _roaring_bitmap_remove_checked(roaring: number, value: number): boolean;
  _roaring_bitmap_maximum(roaring: number): number;
  _roaring_bitmap_minimum(roaring: number): number;
  _roaring_bitmap_contains(roaring: number, value: number): boolean;
  _roaring_bitmap_is_subset(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_is_strict_subset(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_to_uint32_array(roaring: number, arrayPtr: number): void;
  _roaring_bitmap_equals(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_optimize_js(roaring: number): boolean;
  _roaring_bitmap_select_js(roaring: number, rank: number): number;
  _roaring_bitmap_get_index(roaring: number, rank: number): number;
  _roaring_bitmap_and_cardinality(roaring1: number, roaring2: number): number;
  _roaring_bitmap_or_cardinality(roaring1: number, roaring2: number): number;
  _roaring_bitmap_andnot_cardinality(roaring1: number, roaring2: number): number;
  _roaring_bitmap_xor_cardinality(roaring1: number, roaring2: number): number;
  _roaring_bitmap_rank(roaring: number, value: number): number;
  _roaring_bitmap_and_inplace(roaring1: number, roaring2: number): void;
  _roaring_bitmap_or_inplace(roaring1: number, roaring2: number): void;
  _roaring_bitmap_xor_inplace(roaring1: number, roaring2: number): void;
  _roaring_bitmap_andnot_inplace(roaring1: number, roaring2: number): void;
  _roaring_bitmap_intersect(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_jaccard_index(roaring1: number, roaring2: number): number;

  _roaring_bitmap_portable_size_in_bytes(roaring: number): number;
  _roaring_bitmap_portable_serialize(roaring: number, buf: number): number;
  _roaring_bitmap_portable_deserialize(buf: number): number;

  _roaring_bitmap_size_in_bytes(roaring: number): number;
  _roaring_bitmap_serialize(roaring: number, buf: number): number;
  _roaring_bitmap_deserialize(buf: number): number;

  _roaring_bitmap_from_range_js(min: number, max: number, step: number): number;
  _roaring_bitmap_contains_range_js(roaring: NullablePtr, min: number, max: number): number | boolean;
  _roaring_bitmap_add_range_js(roaring: number, min: number, max: number): number;
  _roaring_bitmap_remove_range_js(roaring: NullablePtr, min: number, max: number): number;
  _roaring_bitmap_flip_range_inplace_js(roaring: number, start: number, end: number): void;
  _roaring_bitmap_range_cardinality_js(roaring: NullablePtr, start: number, end: number): number;
  _roaring_bitmap_add_offset_js(roaring: NullablePtr, offset: number): number;
  _roaring_bitmap_copy(roaring: number): number;
  _roaring_bitmap_overwrite(roaring: number, other: number): void;
  _roaring_bitmap_clear(roaring: number): void;

  _roaring_bitmap_run_optimize(roaring: number): number | boolean;
  _roaring_bitmap_shrink_to_fit_js(roaring: NullablePtr): number;
  _roaring_bitmap_remove_run_compression(roaring: number): number | boolean;
};

const _loadedModule = roaring_wasm_module_init<RoaringWasm>();
let _initializePromise: Promise<void>;

export let roaringWasm: RoaringWasm;

/**
 * In browser, roaring library initialization is done asynchronously, this method returns true after roaring library WASM is initialized.
 * The library cannot be used until this function returns true.
 * You can await initialization with roaringLibraryInitialize function that returns a promise.
 * @returns true if roaring library WASM is initialized.
 */
export const roaringLibraryIsReady = (): boolean => !!roaringWasm;

/**
 * In browser, roaring library initialization is done asynchronously, this method returns a promise that resolves when roaring library WASM is initialized.
 * The library cannot be used until this promise is resolved.
 * @returns a promise that resolves when roaring library WASM is initialized.
 * @example
 * await roaringLibraryInitialize();
 * const bitmap = new RoaringBitmap32([123]);
 * console.log(bitmap.toArray()); // [123]
 */
export const roaringLibraryInitialize = (): Promise<void> => _initializePromise;

if (typeof (_loadedModule as { then?: unknown }).then === "function") {
  _initializePromise = (_loadedModule as Promise<RoaringWasm>).then((m) => {
    roaringWasm = m;
  });
} else {
  roaringWasm = _loadedModule as RoaringWasm;
  _initializePromise = Promise.resolve();
}
