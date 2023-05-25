import type { RoaringArenaAllocator } from "../RoaringArenaAllocator";

export let _roaringArenaAllocator_head: RoaringArenaAllocator | null = null;

let _stack: RoaringArenaAllocator[] | null = null;

export const _roaringArenaAllocator_push = (allocator: RoaringArenaAllocator): unknown =>
  (_stack || (_stack = [])).push((_roaringArenaAllocator_head = allocator));

export const _roaringArenaAllocator_pop = (allocator: RoaringArenaAllocator): void => {
  const stack = _stack!;
  if (_roaringArenaAllocator_head === allocator) {
    stack.pop();
    _roaringArenaAllocator_head = stack[stack.length - 1] || null;
  } else {
    const index = stack.lastIndexOf(allocator);
    if (index >= 0) {
      stack.splice(index, 1);
    }
  }
};
