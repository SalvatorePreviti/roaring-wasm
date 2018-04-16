#ifndef __NODE_ROARING_ROARING__
#define __NODE_ROARING_ROARING__

extern "C" {
#include "CRoaringUnityBuild/roaring.h"
}

/**
 * Creates a new bitmap (initially empty)
 */
roaring_bitmap_t * roaring_bitmap_create(void);

/**
 * Add all the values between min (included) and max (excluded) that are at a
 * distance k*step from min.
 */
roaring_bitmap_t * roaring_bitmap_from_range(uint32_t min,
    uint32_t max,
    uint32_t step);

/**
 * Creates a new bitmap (initially empty) with a provided
 * container-storage capacity (it is a performance hint).
 */
roaring_bitmap_t * roaring_bitmap_create_with_capacity(uint32_t cap);

#endif
