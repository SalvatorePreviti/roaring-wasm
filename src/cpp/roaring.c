#include "global.h"

#include "CRoaringUnityBuild/roaring.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-variable"

#include "CRoaringUnityBuild/roaring.c"

#pragma clang diagnostic pop

int * __errno_location(void) {
  // Emscripten issue #6387
  //
  // https://github.com/kripken/emscripten/issues/6387
  //
  //  The `-s NO_FILESYSTEM=1` option seems to be causing an error:
  // `unresolved symbol: __errno_location`.
  // The actual cause has not confirmed yet.
  // This is a temporary expedient for this problem.
  static int dummy_errno;
  return &dummy_errno;
}