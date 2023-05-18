#include "global.h"

#include "../../submodules/CRoaring/include/roaring/roaring.h"
#include "../../submodules/CRoaring/include/roaring/roaring_array.h"

#ifndef CROARING_SERIALIZATION_ARRAY_UINT32
#  define CROARING_SERIALIZATION_ARRAY_UINT32 1
#endif

#ifndef CROARING_SERIALIZATION_CONTAINER
#  define CROARING_SERIALIZATION_CONTAINER 2
#endif

#define MAX_SERIALIZATION_NATIVE_MEMORY 0x00FFFFFF

bool roaring_bitmap_add_checked_js(roaring_bitmap_t * bitmap, uint32_t value) {
  uint32_t c = (uint32_t)roaring_bitmap_get_cardinality(bitmap);
  roaring_bitmap_add(bitmap, value);
  return c != (uint32_t)roaring_bitmap_get_cardinality(bitmap);
}

bool roaring_bitmap_remove_checked_js(roaring_bitmap_t * bitmap, uint32_t value) {
  uint32_t c = (uint32_t)roaring_bitmap_get_cardinality(bitmap);
  roaring_bitmap_remove(bitmap, value);
  return c != (uint32_t)roaring_bitmap_get_cardinality(bitmap);
}

bool roaring_bitmap_optimize_js(roaring_bitmap_t * bitmap) {
  bool result = false;
  for (int repeat = 0; repeat < 4; ++repeat) {
    if (roaring_bitmap_run_optimize(bitmap)) result = true;
    if (roaring_bitmap_shrink_to_fit(bitmap)) result = true;
    if (!result) {
      break;
    }
  }
  return result;
}

roaring_bitmap_t * roaring_bitmap_create_js(uint32_t capacity) {
  if (capacity < 4)
    capacity = 4;

  return roaring_bitmap_create_with_capacity(capacity);
}

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank) {
  uint32_t element;
  return roaring_bitmap_select(bm, rank, &element) ? element : NAN;
}
