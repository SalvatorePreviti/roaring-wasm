import { expect } from "chai";
import IDisposable from "idisposable";
import { RoaringBitmap32, RoaringUint8Array, RoaringUint32Array } from "roaring-wasm";

/**
 * This tests are executed by loading the compiled package
 */
describe("package test", () => {
  it("loads the package correctly", () => {
    const bitmap = new RoaringBitmap32([1, 2, 3]);
    expect(bitmap.toArray()).deep.eq([1, 2, 3]);

    IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
      expect(p.toArray()).deep.eq([1, 2, 3]);
    });

    IDisposable.using(new RoaringUint32Array([1, 2, 3]), (p) => {
      expect(p.toArray()).deep.eq([1, 2, 3]);
    });
  });
});
