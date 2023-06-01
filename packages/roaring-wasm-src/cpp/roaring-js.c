#include "global.h"

#include <submodules/CRoaring/include/roaring/roaring.h>
#include <submodules/CRoaring/include/roaring/roaring_array.h>

#ifndef CROARING_SERIALIZATION_ARRAY_UINT32
#  define CROARING_SERIALIZATION_ARRAY_UINT32 1
#endif

#ifndef CROARING_SERIALIZATION_CONTAINER
#  define CROARING_SERIALIZATION_CONTAINER 2
#endif

#define MAX_SERIALIZATION_NATIVE_MEMORY 0x00FFFFFF

/** Allocate memory, aligned to 32 bytes, filling it with zeroes */
void * jsalloc_zero(uint32_t size) {
  void * result;
  if (posix_memalign(&result, 32, size) != 0) {
    return NULL;
  }
  memset(result, 0, size);
  return result;
}

roaring_bitmap_t * roaring_bitmap_create_js(void) { return roaring_bitmap_create_with_capacity(0); }

bool roaring_bitmap_optimize_js(roaring_bitmap_t * bitmap) {
  bool result = false;
  if (bitmap) {
    for (int repeat = 0; repeat < 4; ++repeat) {
      if (roaring_bitmap_run_optimize(bitmap)) {
        result = true;
      }
      if (roaring_bitmap_shrink_to_fit(bitmap)) {
        result = true;
      }
      if (!result) {
        break;
      }
    }
  }
  return result;
}

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, double rank) {
  if (!bm || isnan(rank) || rank <= -1 || rank >= 0x100000000) {
    return NAN;
  }
  uint32_t element;
  return roaring_bitmap_select(bm, (uint32_t)rank, &element) ? element : NAN;
}

double roaring_bitmap_get_index_js(const roaring_bitmap_t * bm, double x) {
  if (!bm || isnan(x) || x <= -1 || x >= 0x100000000) {
    return -1;
  }
  return roaring_bitmap_get_index(bm, (uint32_t)x);
}

double roaring_bitmap_at_js(const roaring_bitmap_t * bm, double index) {
  if (!bm || isnan(index)) {
    return -1;
  }
  index = trunc(index);
  if (index < 0) {
    index += (double)roaring_bitmap_get_cardinality(bm);
    if (index < 0) {
      return -1;
    }
  }
  if (index > UINT32_MAX) {
    return -1;
  }
  uint32_t result;
  return roaring_bitmap_select(bm, (uint32_t)index, &result) ? result : -1.0;
}

inline bool getRangeOperationParameters(double minimum, double maximum, uint64_t * minInteger, uint64_t * maxInteger) {
  if (isnan(minimum) || isnan(maximum) || maximum <= 0) {
    return false;
  }
  if (minimum < 0) {
    minimum = 0;
  }
  minimum = ceil(minimum);
  maximum = ceil(maximum);
  if (minimum > 4294967295) {
    return false;
  }
  if (maximum > 4294967296) {
    maximum = 4294967296;
  }
  *minInteger = (uint64_t)minimum;
  *maxInteger = (uint64_t)maximum;
  return minimum < 4294967296 && *minInteger < *maxInteger;
}

bool roaring_bitmap_contains_range_js(const roaring_bitmap_t * bm, double minimum, double maximum) {
  if (!bm || isnan(minimum) || isnan(maximum) || minimum < 0 || maximum <= 0) {
    return false;
  }
  minimum = ceil(minimum);
  maximum = ceil(maximum);
  if (minimum > 4294967295 || maximum > 4294967296) {
    return false;
  }
  uint64_t minInteger = (uint64_t)minimum;
  uint64_t maxInteger = (uint64_t)maximum;
  if (minInteger >= maxInteger || maxInteger > 4294967296) {
    return false;
  }
  return roaring_bitmap_contains_range(bm, minInteger, maxInteger);
}

double roaring_bitmap_range_cardinality_js(const roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    return (double)roaring_bitmap_range_cardinality(bm, minInteger, maxInteger);
  }
  return 0;
}

roaring_bitmap_t * roaring_bitmap_from_range_js(double minimum, double maximum, double step) {
  uint64_t minInteger, maxInteger;
  if (!getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    return 0;
  }
  if (isnan(step) || step < 1) {
    step = 1;
  } else if (step > 0xffffffff) {
    step = 0xffffffff;
  }
  return roaring_bitmap_from_range(minInteger, maxInteger, (uint32_t)step);
}

bool roaring_bitmap_add_range_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_add_range_closed(bm, (uint32_t)minInteger, (uint32_t)(maxInteger - 1));
    return true;
  }
  return false;
}

bool roaring_bitmap_remove_range_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_remove_range_closed(bm, (uint32_t)minInteger, (uint32_t)(maxInteger - 1));
    return true;
  }
  return false;
}

bool roaring_bitmap_flip_range_inplace_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_flip_inplace(bm, minInteger, maxInteger);
    return true;
  }
  return false;
}

roaring_bitmap_t * roaring_bitmap_flip_range_static_js(const roaring_bitmap_t * input, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    return input ? roaring_bitmap_flip(input, minInteger, maxInteger) : roaring_bitmap_from_range(minInteger, maxInteger, 1);
  }
  return NULL;
}

bool roaring_bitmap_intersect_with_range_js(const roaring_bitmap_t * input, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (input && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    return roaring_bitmap_intersect_with_range(input, minInteger, (uint64_t)(maxInteger - 1));
  }
  return false;
}

roaring_bitmap_t * roaring_bitmap_add_offset_js(const roaring_bitmap_t * input, double offset) {
  if (!input) {
    return NULL;
  }
  if (isnan(offset) || offset == 0) {
    return roaring_bitmap_copy(input);
  }
  if (offset < -4294967296) {
    offset = -4294967296;
  } else if (offset > 4294967296) {
    offset = 4294967296;
  }
  return roaring_bitmap_add_offset(input, (int64_t)offset);
}

double roaring_bitmap_shrink_to_fit_js(roaring_bitmap_t * input) {
  return input ? (double)roaring_bitmap_shrink_to_fit(input) : 0;
}

double roaring_bitmap_jaccard_index_js(const roaring_bitmap_t * x1, const roaring_bitmap_t * x2) {
  const uint64_t c1 = x1 ? roaring_bitmap_get_cardinality(x1) : 0;
  const uint64_t c2 = x2 ? roaring_bitmap_get_cardinality(x2) : 0;
  const uint64_t inter = c1 && c2 ? roaring_bitmap_and_cardinality(x1, x2) : 0;
  return (double)inter / (double)(c1 + c2 - inter);
}

roaring_bitmap_t * roaring_bitmap_and_js(const roaring_bitmap_t * a, const roaring_bitmap_t * b) {
  return a && b ? roaring_bitmap_and(a, b) : NULL;
}

roaring_bitmap_t * roaring_bitmap_or_js(const roaring_bitmap_t * a, const roaring_bitmap_t * b) {
  if (!a) {
    return b ? roaring_bitmap_copy(b) : NULL;
  }
  return b ? roaring_bitmap_or(a, b) : roaring_bitmap_copy(a);
}

roaring_bitmap_t * roaring_bitmap_xor_js(const roaring_bitmap_t * a, const roaring_bitmap_t * b) {
  if (!a) {
    return b ? roaring_bitmap_copy(b) : NULL;
  }
  return b ? roaring_bitmap_xor(a, b) : roaring_bitmap_copy(a);
}

roaring_bitmap_t * roaring_bitmap_andnot_js(const roaring_bitmap_t * a, const roaring_bitmap_t * b) {
  return !a ? NULL : (b ? roaring_bitmap_andnot(a, b) : roaring_bitmap_copy(a));
}

typedef struct roaring_iterator_js_s {
  roaring_uint32_iterator_t iterator;

  double version;
} roaring_iterator_js_t;

roaring_iterator_js_t * roaring_iterator_js_new(const roaring_bitmap_t * bitmap, double version, double minimumValue) {
  if (!bitmap) {
    return NULL;
  }
  if (minimumValue >= 0x100000000) {
    return NULL;
  }
  roaring_iterator_js_t * iterator = malloc(sizeof(roaring_iterator_js_t));
  if (!iterator) {
    return NULL;
  }

  roaring_init_iterator(bitmap, &iterator->iterator);

  if (!iterator->iterator.has_value) {
    free(iterator);
    return NULL;
  }

  if (
    !isnan(minimumValue) && minimumValue > iterator->iterator.current_value &&
    !roaring_move_uint32_iterator_equalorlarger(&iterator->iterator, (uint32_t)minimumValue)) {
    free(iterator);
    return NULL;
  }

  iterator->version = version;

  return iterator;
}

roaring_iterator_js_t * roaring_iterator_js_clone(const roaring_iterator_js_t * iterator) {
  roaring_iterator_js_t * clone = malloc(sizeof(roaring_iterator_js_t));
  if (clone) {
    memcpy(clone, iterator, sizeof(roaring_iterator_js_t));
  }
  return clone;
}

double roaring_iterator_js_next(roaring_iterator_js_t * iterator, const roaring_bitmap_t * bitmap, double version) {
  uint32_t value = iterator->iterator.current_value;

  if (!iterator->iterator.has_value) {
    free(iterator);
    return -1;
  }

  if (iterator->iterator.parent != bitmap || iterator->version != version) {
    if (!bitmap) {
      free(iterator);
      return -1;
    }

    roaring_init_iterator(bitmap, &iterator->iterator);

    if (!roaring_move_uint32_iterator_equalorlarger(&iterator->iterator, value)) {
      free(iterator);
      return -1;
    }

    value = iterator->iterator.current_value;

    iterator->version = version;
  }

  roaring_advance_uint32_iterator(&iterator->iterator);
  return (double)value;
}
