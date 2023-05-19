import { expect } from "chai";
import IDisposable from "idisposable";
import roaringWasm from "roaring-wasm";

/**
 * This tests are executed by loading the compiled package
 */
describe("package test", () => {
  it("loads the package correctly", () => {
    const bitmap = new roaringWasm.RoaringBitmap32([1, 2, 3]);
    expect(bitmap.toArray()).deep.eq([1, 2, 3]);

    IDisposable.using(new roaringWasm.RoaringUint8Array([1, 2, 3]), (p) => {
      expect(p.toArray()).deep.eq([1, 2, 3]);
    });

    IDisposable.using(new roaringWasm.RoaringUint32Array([1, 2, 3]), (p) => {
      expect(p.toArray()).deep.eq([1, 2, 3]);
    });
  });
});
