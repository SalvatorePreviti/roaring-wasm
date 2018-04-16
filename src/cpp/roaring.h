#ifndef __NODE_ROARING_ROARING__
#define __NODE_ROARING_ROARING__

extern "C" {
#include "CRoaringUnityBuild/roaring.h"

double roaring_bitmap_select_js(const roaring_bitmap_t * bm, uint32_t rank);
void * roaring_bitmap_portable_serialize_js(const roaring_bitmap_t * b,
    uint32_t & size);
}

#endif
