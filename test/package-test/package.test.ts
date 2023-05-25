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
});
