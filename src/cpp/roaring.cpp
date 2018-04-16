
/* OPTIMIZATION: disable printf, we don't need it */
#define printf(...)
#define fprintf(...)
#define assert(...)

#include "roaring.h"

extern "C" {
#include "CRoaringUnityBuild/roaring.c"
};
