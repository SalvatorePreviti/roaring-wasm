
/* OPTIMIZATION: disable printf, we don't need it */
#define printf(...)
#define fprintf(...)
#define assert(...)

#include "roaring.h"
#include <math.h>

extern "C" {
#include "CRoaringUnityBuild/roaring.c"

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank) {
  uint32_t element;
  return roaring_bitmap_select(bm, rank, &element) ? element : NAN;
}

void * roaring_bitmap_portable_serialize_js(const roaring_bitmap_t * bm,
    uint32_t & size) {
  size = roaring_bitmap_portable_size_in_bytes(bm);
  if (size == 0) {
    return nullptr;
  }
  char * memory = (char *)::malloc(size);
  if (memory == nullptr) {
    return nullptr;
  }
  size_t newSize = roaring_bitmap_portable_serialize(bm, memory);
  if (newSize == 0) {
    ::free(memory);
    return nullptr;
  }
  size = (uint32_t)newSize;
  return memory;
}
};
