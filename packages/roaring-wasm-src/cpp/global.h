#ifndef __GLOBAL__H__
#define __GLOBAL__H__

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#define CROARING_SILENT_BUILD

// Optimization - disable IO and assertions

#define printf(...) (0)
#define fprintf(...) (0)
#define assert(...)

#endif
