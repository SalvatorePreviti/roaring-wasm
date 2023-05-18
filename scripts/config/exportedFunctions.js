const exportedFunctions = [
  "_malloc",
  "_free",

  "_roaring_bitmap_free",
  "_roaring_bitmap_get_cardinality",
  "_roaring_bitmap_is_empty",
  "_roaring_bitmap_add",
  "_roaring_bitmap_add_many",
  "_roaring_bitmap_remove",
  "_roaring_bitmap_maximum",
  "_roaring_bitmap_minimum",
  "_roaring_bitmap_contains",
  "_roaring_bitmap_is_subset",
  "_roaring_bitmap_is_strict_subset",
  "_roaring_bitmap_to_uint32_array",
  "_roaring_bitmap_equals",
  "_roaring_bitmap_flip_inplace",
  "_roaring_bitmap_optimize_js",
  "_roaring_bitmap_select_js",
  "_roaring_bitmap_and_cardinality",
  "_roaring_bitmap_or_cardinality",
  "_roaring_bitmap_andnot_cardinality",
  "_roaring_bitmap_xor_cardinality",
  "_roaring_bitmap_rank",
  "_roaring_bitmap_and_inplace",
  "_roaring_bitmap_or_inplace",
  "_roaring_bitmap_xor_inplace",
  "_roaring_bitmap_andnot_inplace",
  "_roaring_bitmap_intersect",
  "_roaring_bitmap_jaccard_index",

  "_roaring_bitmap_create_js",

  "_roaring_bitmap_add_checked_js",
  "_roaring_bitmap_remove_checked_js",

  "_roaring_bitmap_portable_size_in_bytes",
  "_roaring_bitmap_portable_serialize",
  "_roaring_bitmap_portable_deserialize",

  "_roaring_bitmap_size_in_bytes",
  "_roaring_bitmap_serialize",
  "_roaring_bitmap_deserialize",
];

module.exports = exportedFunctions;
