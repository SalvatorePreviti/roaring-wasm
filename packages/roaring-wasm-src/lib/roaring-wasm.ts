import roaring_wasm_module_init from "./roaring-wasm-module";

type RoaringWasm = {
  readonly HEAP8: Int8Array;
  readonly HEAP16: Int16Array;
  readonly HEAP32: Int32Array;
  readonly HEAPU8: Uint8Array;
  readonly HEAPU16: Uint16Array;
  readonly HEAPU32: Uint32Array;
  readonly HEAPF32: Float32Array;
  readonly HEAPF64: Float64Array;

  _malloc(size: number): number;
  _free(pointer: number): void;
  _roaring_bitmap_create_js(initialCapacity: number): number;
  _roaring_bitmap_free(roaring: number): void;
  _roaring_bitmap_get_cardinality(roaring: number): number;
  _roaring_bitmap_is_empty(roaring: number): boolean;
  _roaring_bitmap_add(roaring: number, value: number): void;
  _roaring_bitmap_add_many(roaring: number, count: number, values: number): void;
  _roaring_bitmap_remove(roaring: number, value: number): void;
  _roaring_bitmap_maximum(roaring: number): number;
  _roaring_bitmap_minimum(roaring: number): number;
  _roaring_bitmap_contains(roaring: number, value: number): boolean;
  _roaring_bitmap_is_subset(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_is_strict_subset(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_to_uint32_array(roaring: number, arrayPtr: number): void;
  _roaring_bitmap_equals(roaring1: number, roaring2: number): boolean;
  _roaring_bitmap_flip_inplace(roaring: number, start: number, end: number): void;
  _roaring_bitmap_optimize_js(roaring: number): boolean;
  _roaring_bitmap_select_js(roaring: number, rank: number): number;
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

  _roaring_bitmap_add_checked_js(roaring: number, value: number): boolean;
  _roaring_bitmap_remove_checked_js(roaring: number, value: number): boolean;

  _roaring_bitmap_portable_size_in_bytes(roaring: number): number;
  _roaring_bitmap_portable_serialize(roaring: number, buf: number): number;
  _roaring_bitmap_portable_deserialize(buf: number): number;

  _roaring_bitmap_size_in_bytes(roaring: number): number;
  _roaring_bitmap_serialize(roaring: number, buf: number): number;
  _roaring_bitmap_deserialize(buf: number): number;
};

/**
 * @module
 * Roaring WASM module instantiation
 */
export = roaring_wasm_module_init<RoaringWasm>();
