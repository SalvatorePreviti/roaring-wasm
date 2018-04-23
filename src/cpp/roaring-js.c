#include <math.h>
#include <stdlib.h>

#define printf(...)
#define fprintf(...)
#define assert(...)

#include "CRoaringUnityBuild/roaring.h"

#define MAX_SERIALIZATION_NATIVE_MEMORY 0x00FFFFFF

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

int roaring_bitmap_portable_deserialize_js(roaring_bitmap_t * bitmap, const char * buf, uint32_t size) {
  if (!bitmap || !size || !buf) {
    return 201;
  }
  size_t bytesread;
  if (!ra_portable_deserialize(&bitmap->high_low_container, buf, size, &bytesread))
    return 202;

  return 0;
}

int roaring_bitmap_portable_serialize_js(roaring_bitmap_js_t * b) {
  if (b == NULL)
    return 301;

  size_t size = roaring_bitmap_portable_size_in_bytes(&b->b);
  char * ptr = (char *)malloc(size);
  if (ptr == NULL)
    return 302;

  size_t newSize = roaring_bitmap_portable_serialize(&b->b, ptr);

  b->tempUint32 = newSize;
  b->tempPointer = ptr;
  return 0;
}

size_t roaring_bitmap_native_size_in_bytes_js(const roaring_bitmap_js_t * b) {
  if (b == NULL)
    return 0;

  uint64_t cardinality = roaring_bitmap_get_cardinality(&b->b);
  uint64_t nativesize = cardinality * sizeof(uint32_t) + sizeof(uint32_t);
  size_t portablesize = roaring_bitmap_portable_size_in_bytes(&b->b);

  if (nativesize < portablesize && nativesize < MAX_SERIALIZATION_NATIVE_MEMORY) {
    return nativesize + 1;
  }

  return portablesize + 1;
}

int roaring_bitmap_native_serialize_js(roaring_bitmap_js_t * b) {
  if (b == NULL)
    return 401;

  uint64_t cardinality = roaring_bitmap_get_cardinality(&b->b);

  uint64_t nativesize = cardinality * sizeof(uint32_t) + sizeof(uint32_t);

  size_t portablesize = roaring_bitmap_portable_size_in_bytes(&b->b);

  size_t bufsize;
  size_t serializedsize;
  char * serialized;

  if (nativesize < portablesize && nativesize < MAX_SERIALIZATION_NATIVE_MEMORY) {
    bufsize = (size_t)(nativesize + 1);
    serialized = (char *)malloc(bufsize);
    if (serialized == NULL) {
      return 503;  // Failed to allocate memory
    }

    serialized[0] = SERIALIZATION_ARRAY_UINT32;  // Marker
    memcpy(serialized + 1, &cardinality, sizeof(uint32_t));
    roaring_bitmap_to_uint32_array(&b->b, (uint32_t *)(serialized + 1 + sizeof(uint32_t)));
    serializedsize = bufsize;
  } else {
    bufsize = portablesize;
    serialized = (char *)malloc(bufsize);
    if (serialized == NULL) {
      return 504;  // Failed to allocate memory
    }

    serialized[0] = SERIALIZATION_CONTAINER;  // Marker
    serializedsize = roaring_bitmap_portable_serialize(&b->b, serialized + 1) + 1;
  }

  if (serializedsize == 0) {
    free(serialized);
    return 505;  // Something went wrong...
  }

  if (serializedsize < bufsize) {
    // Free some memory if we can
    char * reallocated = (char *)realloc(serialized, serializedsize);
    if (reallocated) {
      serialized = reallocated;
    }
  }

  b->tempUint32 = serializedsize;
  b->tempPointer = serialized;

  return 0;  // All cool and good.
}

int roaring_bitmap_native_deserialize_js(roaring_bitmap_t * bitmap, const char * buf, uint32_t size) {
  if (size == 0) {
    return 0;  // Empty.
  }

  if (!bitmap || !buf) {
    return 101;  // Invalid arguments.
  }

  switch (buf[0]) {
    case SERIALIZATION_ARRAY_UINT32: {
      if (size == 1)
        return 0;  // Empty.
      if (size < 5)
        return 102;  // Wrong size!

      uint32_t card;
      memcpy(&card, buf + 1, sizeof(uint32_t));
      if (card == 0)
        return 0;  // Empty.

      const uint32_t * elems = (const uint32_t *)(buf + 1 + sizeof(uint32_t));
      roaring_bitmap_add_many(bitmap, card, elems);
      return 0;
    }

    case SERIALIZATION_CONTAINER: {
      return roaring_bitmap_portable_deserialize_js(bitmap, buf + 1, size - 1);
    }
  }

  return 103;  // Unknown marker.
}