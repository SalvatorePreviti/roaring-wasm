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

bool roaring_bitmap_optimize_js(roaring_bitmap_t * bitmap) {
  bool result = false;
  for (int repeat = 0; repeat < 4; ++repeat) {
    if (roaring_bitmap_run_optimize(bitmap))
      result = true;
    if (roaring_bitmap_shrink_to_fit(bitmap))
      result = true;
    if (!result) {
      break;
    }
  }
  return result;
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

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank) {
  uint32_t element;
  return roaring_bitmap_select(bm, rank, &element) ? element : NAN;
}

bool roaring_bitmap_portable_deserialize_js(roaring_bitmap_t * bitmap, const char * buf, uint32_t size) {
  if (!bitmap || !size || !buf) {
    return false;
  }
  size_t bytesread;
  return ra_portable_deserialize(&bitmap->high_low_container, buf, size, &bytesread);
}

bool roaring_bitmap_native_deserialize_js(roaring_bitmap_t * bitmap, const char * buf, uint32_t size) {
  if (size == 0) {
    return true;
  }

  if (!bitmap || !buf) {
    return false;
  }

  switch (buf[0]) {
    case SERIALIZATION_ARRAY_UINT32: {
      if (size == 1) {
        return true;
      }

      if (size < 5) {
        return false;
      }

      uint32_t card;
      memcpy(&card, buf + 1, sizeof(uint32_t));

      if (card == 0) {
        return true;
      }

      const uint32_t * elems = (const uint32_t *)(buf + 1 + sizeof(uint32_t));
      roaring_bitmap_add_many(bitmap, card, elems);
      return true;
    }

    case SERIALIZATION_CONTAINER: {
      return roaring_bitmap_portable_deserialize_js(bitmap, buf + 1, size - 1);
    }
  }

  return false;
}

bool roaring_bitmap_portable_serialize_js(roaring_bitmap_js_t * b) {
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

bool roaring_bitmap_native_serialize_js(roaring_bitmap_js_t * b) {
  if (b == NULL)
    return false;

  if (!b)
    return false;

  size_t size = roaring_bitmap_size_in_bytes(&b->b);
  if (size == 0)
    return false;

  char * ptr = (char *)malloc(size);
  if (ptr == NULL)
    return false;

  size_t newSize = roaring_bitmap_serialize(&b->b, ptr);
  if (newSize == 0) {
    free(ptr);
    return false;
  }

  b->tempUint32 = size;
  b->tempPointer = ptr;
  return true;
}
