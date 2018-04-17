#include <math.h>
#include <stdlib.h>

#define printf(...)
#define fprintf(...)
#define assert(...)

#include "CRoaringUnityBuild/roaring.h"

typedef struct roaring_bitmap_js_s {
  roaring_bitmap_t b;

  /** field used to easily share data between JS and C++ */
  uint32_t tempUint32;

  /** field used to easily share data between JS and C++ */
  void * tempPointer;
} roaring_bitmap_js_t;

/** Gets the size in bytes of roaring_bitmap_t structure. */
uint32_t get_sizeof_roaring_bitmap_t() {
  return sizeof(roaring_bitmap_t);
}

roaring_bitmap_js_t * roaring_bitmap_create_js(uint32_t capacity) {
  if (capacity < 4)
    capacity = 4;

  roaring_bitmap_js_t * result = (roaring_bitmap_js_t *)malloc(sizeof(roaring_bitmap_js_t));

  if (!result)
    return NULL;

  bool is_ok = ra_init_with_capacity(&result->b.high_low_container, capacity);
  if (!is_ok) {
    free(result);
    return NULL;
  }

  result->b.copy_on_write = false;
  result->tempUint32 = 0;
  result->tempPointer = NULL;

  return result;
}

bool roaring_bitmap_portable_deserialize_js(roaring_bitmap_t * bitmap, const char * buf, uint32_t size) {
  if (!bitmap || !size || !buf) {
    return false;
  }
  size_t bytesread;
  return ra_portable_deserialize(&bitmap->high_low_container, buf, size, &bytesread);
}

bool roaring_bitmap_portable_serialize_alloc_js(roaring_bitmap_js_t * b) {
  if (b == NULL)
    return false;

  if (!b)
    return false;

  size_t size = roaring_bitmap_portable_size_in_bytes(&b->b);
  if (size == 0)
    return false;

  char * ptr = (char *)malloc(size);
  if (ptr == NULL)
    return false;

  size_t newSize = roaring_bitmap_portable_serialize(&b->b, ptr);
  if (newSize == 0) {
    free(ptr);
    return false;
  }

  b->tempUint32 = size;
  b->tempPointer = ptr;
  return true;
}

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank) {
  uint32_t element;
  return roaring_bitmap_select(bm, rank, &element) ? element : NAN;
}