#include "global.h"

#include <submodules/CRoaring/include/roaring/roaring.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-variable"
#pragma clang diagnostic ignored "-Wunused-but-set-variable"

#include <submodules/CRoaring/src/isadetection.c>
#include <submodules/CRoaring/src/array_util.c>
#include <submodules/CRoaring/src/bitset_util.c>
#include <submodules/CRoaring/src/bitset.c>
#include <submodules/CRoaring/src/containers/array.c>
#include <submodules/CRoaring/src/containers/bitset.c>
#include <submodules/CRoaring/src/containers/containers.c>
#include <submodules/CRoaring/src/containers/convert.c>
#include <submodules/CRoaring/src/containers/mixed_intersection.c>
#include <submodules/CRoaring/src/containers/mixed_union.c>
#include <submodules/CRoaring/src/containers/mixed_equal.c>
#include <submodules/CRoaring/src/containers/mixed_subset.c>
#include <submodules/CRoaring/src/containers/mixed_negation.c>
#include <submodules/CRoaring/src/containers/mixed_xor.c>
#include <submodules/CRoaring/src/containers/mixed_andnot.c>
#include <submodules/CRoaring/src/containers/run.c>
#include <submodules/CRoaring/src/memory.c>
#include <submodules/CRoaring/src/roaring.c>
#include <submodules/CRoaring/src/roaring_priority_queue.c>
#include <submodules/CRoaring/src/roaring_array.c>

#pragma clang diagnostic pop
