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

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank) {
  uint32_t element;
  return roaring_bitmap_select(bm, rank, &element) ? element : NAN;
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

roaring_bitmap_t * roaring_bitmap_from_range_js(double minimum, double maximum, uint32_t step) {
  uint64_t minInteger, maxInteger;
  return getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)
    ? roaring_bitmap_from_range(minInteger, maxInteger, step)
    : 0;
}

void roaring_bitmap_add_range_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_add_range_closed(bm, (uint32_t)minInteger, (uint32_t)(maxInteger - 1));
  }
}

void roaring_bitmap_remove_range_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_remove_range_closed(bm, (uint32_t)minInteger, (uint32_t)(maxInteger - 1));
  }
}

void roaring_bitmap_flip_range_inplace_js(roaring_bitmap_t * bm, double minimum, double maximum) {
  uint64_t minInteger, maxInteger;
  if (bm && getRangeOperationParameters(minimum, maximum, &minInteger, &maxInteger)) {
    roaring_bitmap_flip_inplace(bm, minInteger, maxInteger);
  }
}

roaring_bitmap_t * roaring_bitmap_add_offset_js(const roaring_bitmap_t * input, double offset) {
  if (!input) {
    return NULL;
  }
  if (isnan(offset)) {
    offset = 0;
  } else if (offset < -4294967296) {
    offset = -4294967296;
  } else if (offset > 4294967296) {
    offset = 4294967296;
  }
  return roaring_bitmap_add_offset(input, (int64_t)offset);
}

double roaring_bitmap_shrink_to_fit_js(roaring_bitmap_t * input) {
  return input ? (double)roaring_bitmap_shrink_to_fit(input) : 0;
}
