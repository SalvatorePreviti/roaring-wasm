import { expect } from "chai";
import { RoaringBitmap32 } from "roaring-wasm-src";

describe("RoaringBitmap32 to array", () => {
  describe.only("toUint32Array", () => {
    it("should return a Uint32Array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.toUint32Array();
      expect(a).instanceOf(Uint32Array);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work for a big bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const ranges = [
        [10, 200000],
        [250000, 300000],
      ];
      for (const [min, max] of ranges) {
        bitmap.addRange(min, max);
      }
      const a = bitmap.toUint32Array();
      expect(a).instanceOf(Uint32Array);
      let j = 0;
      for (const [min, max] of ranges) {
        for (let i = min; i < max; ++i) {
          if (a[j] !== i) {
            expect(a[j]).eq(i);
          }
          ++j;
        }
      }
    });

    it("accepts an output argument", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(5);
      const b = bitmap.toUint32Array(a);
      expect(a).eq(b);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("accepts an output argument with a different length, and returns a subarray", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(61);
      const b = bitmap.toUint32Array(a);
      expect(a.buffer).eq(b.buffer);
      expect(Array.from(b)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("limits the output to the length of the output argument", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(3);
      const b = bitmap.toUint32Array(a);
      expect(a).eq(b);
      expect(Array.from(b)).deep.eq([1, 2, 5]);
    });
  });
});
