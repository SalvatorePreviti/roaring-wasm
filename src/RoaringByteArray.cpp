#include "RoaringByteArray.h"

RoaringByteArray::RoaringByteArray(double sizeInBytes)
    : size((size_t)sizeInBytes), memory((uint8_t *)malloc((size_t)sizeInBytes)),
      typedArray(emscripten::typed_memory_view(sizeInBytes, memory)) {

  if (memory == nullptr)
    size = 0;
}

RoaringByteArray::~RoaringByteArray() {
  if (memory) {
    free(memory);
    memory = nullptr;
  }
}
