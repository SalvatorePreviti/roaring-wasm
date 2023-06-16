import { expect } from "chai";

// @ts-ignore
import * as roaring from "roaring-wasm";

/**
 * This tests are executed by loading the compiled package
 */
describe("package test", () => {
  before(roaring.roaringLibraryInitialize);
  beforeEach(roaring.RoaringArenaAllocator.start);
  afterEach(roaring.RoaringArenaAllocator.stop);

  it("loads the package correctly", () => {
    const bitmap = new roaring.RoaringBitmap32([1, 2, 3]);
    expect(bitmap.toArray()).deep.eq([1, 2, 3]);

    const a = new roaring.RoaringUint8Array([1, 2, 3]);
    expect(Array.from(a.asTypedArray())).deep.eq([1, 2, 3]);
  });

  it("allow iterating a large array", () => {
    const bitmap = new roaring.RoaringBitmap32();
    bitmap.addRange(100, 50000);
    const iter = new roaring.RoaringBitmap32Iterator(bitmap);
    const arr = new Uint32Array(bitmap.size);
    let sz = 0;
    for (const x of iter) {
      arr[sz++] = x;
    }
    expect(sz).eq(50000 - 100);
    expect(iter.done).eq(true);
    expect(iter.value).eq(undefined);
    expect(iter.isDisposed).eq(true);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== i + 100) {
        expect(arr[i]).eq(i + 100);
      }
    }
  });
});
