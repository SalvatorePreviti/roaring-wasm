#ifndef __ROARING_ByteArray__
#define __ROARING_ByteArray__

#include <emscripten/val.h>

class RoaringByteArray {
public:
  size_t size;
  uint8_t *memory;
  emscripten::val typedArray;

  RoaringByteArray(double sizeInBytes);
  ~RoaringByteArray();

  inline double getSize() const { return size; }
  inline emscripten::val getTypedArray() const { return typedArray; }
};

#endif