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
    expect(a.toArray()).deep.eq([1, 2, 3]);

    const b = new roaring.RoaringUint32Array([1, 2, 3]);
    expect(b.toArray()).deep.eq([1, 2, 3]);
  });

  it("allow iterating a large array", () => {
    const bitmap = new roaring.RoaringBitmap32();
    bitmap.addRange(100, 50000);
    const iter = bitmap[Symbol.iterator]();
    const arr: number[] = [];
    for (const x of iter) {
      arr.push(x);
    }
    expect(iter.done).eq(true);
    expect(iter.value).eq(undefined);
    expect(iter.isDisposed).eq(true);
    expect(arr.length).eq(50000 - 100);
    for (let i = 0; i < arr.length; i++) {
      expect(arr[i]).eq(i + 100);
    }
  });
});
