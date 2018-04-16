const exportedFunctions = [
  '_malloc',
  '_free',
  '_roaring_bitmap_create_with_capacity',
  '_roaring_bitmap_free',
  '_roaring_bitmap_get_cardinality',
  '_roaring_bitmap_is_empty',
  '_roaring_bitmap_add',
  '_roaring_bitmap_add_many',
  '_roaring_bitmap_remove',
  '_roaring_bitmap_maximum',
  '_roaring_bitmap_minimum',
  '_roaring_bitmap_contains',
  '_roaring_bitmap_is_subset',
  '_roaring_bitmap_is_strict_subset',
  '_roaring_bitmap_to_uint32_array',
  '_roaring_bitmap_equals',
  '_roaring_bitmap_flip_inplace'
]

module.exports = exportedFunctions
