import { expect } from "chai";
import { RoaringBitmap32 } from "roaring-wasm-src";

describe("RoaringBitmap32 to", () => {
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

    it("works with an empty bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const a = bitmap.toUint32Array();
      expect(a).instanceOf(Uint32Array);
      expect(a.length).eq(0);
    });

    it("works with an output array of size 0", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(0);
      const b = bitmap.toUint32Array(a);
      expect(a).eq(b);
      expect(Array.from(b)).deep.eq([]);
    });
  });

  describe.only("toArray", () => {
    it("should return an array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.toArray();
      expect(a).instanceOf(Array);
      expect(a).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work for a big bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const ranges = [
        [10, 2000],
        [2500, 300000],
      ];
      for (const [min, max] of ranges) {
        bitmap.addRange(min, max);
      }
      const a = bitmap.toArray();
      expect(a).instanceOf(Array);
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
  });

  describe("toSet", () => {
    it("should return a Set", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.toSet();
      expect(a).instanceOf(Set);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work for a big bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const ranges = [
        [10, 2000],
        [2500, 300000],
      ];
      for (const [min, max] of ranges) {
        bitmap.addRange(min, max);
      }
      const a = bitmap.toSet();
      expect(a).instanceOf(Set);
      for (const [min, max] of ranges) {
        for (let i = min; i < max; ++i) {
          if (!a.has(i)) {
            expect(a.has(i)).eq(true);
          }
        }
      }
    });
  });

  describe.only("join", () => {
    it("should work", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(bitmap.join()).eq("1,2,5,124,4294967295");
      expect(bitmap.join(" ")).eq("1 2 5 124 4294967295");
    });

    it("should work for a big bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const ranges = [
        [10, 200],
        [2500, 200000],
      ];
      for (const [min, max] of ranges) {
        bitmap.addRange(min, max);
      }
      const joined = bitmap.join();
      const splitted = joined.split(",");
      let j = 0;
      for (const [min, max] of ranges) {
        for (let i = min; i < max; ++i) {
          if (splitted[j] !== i.toString()) {
            expect(splitted[j]).eq(i.toString());
          }
          ++j;
        }
      }
    });
  });

  describe.only("rangeUint32Array", () => {
    it("should return the full bitmap", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeUint32Array(0, 0xffffffff + 1);
      expect(a).instanceOf(Uint32Array);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should return a portion of the bitmap", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeUint32Array(2, 126);
      expect(a).instanceOf(Uint32Array);
      expect(Array.from(a)).deep.eq([2, 5, 124]);
    });

    it("should return the full bitmap with a different output array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(5);
      const b = bitmap.rangeUint32Array(0, 0xffffffff + 1, a);
      expect(a.buffer).eq(b.buffer);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should limit to the maximum size of the output array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(3);
      const b = bitmap.rangeUint32Array(2, 0xfffffffe, a);
      expect(a.buffer).eq(b.buffer);
      expect(Array.from(a)).deep.eq([2, 5, 124]);
    });

    it("should return a portion of the bitmap, with a different output array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = new Uint32Array(3);
      const b = bitmap.rangeUint32Array(2, 125, a);
      expect(a.buffer).eq(b.buffer);
      expect(Array.from(a)).deep.eq([2, 5, 124]);
    });

    it("should work with negative start value and an end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(Array.from(bitmap.rangeUint32Array(-2, 0xffffffff))).deep.eq([1, 2, 5, 124]);
    });

    it("should work with no start and no end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeUint32Array();
      expect(a).instanceOf(Uint32Array);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work with floating point values", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(Array.from(bitmap.rangeUint32Array(1.5, 5.5))).deep.eq([2, 5]);
      const a = new Uint32Array(3);
      expect(Array.from(bitmap.rangeUint32Array(1.5, 124.1, a))).deep.eq([2, 5, 124]);
    });

    it("works with a subrange of a big bitmap", () => {
      const bitmap = RoaringBitmap32.fromRange(0, 0xffffffff);
      const a = bitmap.rangeUint32Array(100, 400000);
      expect(a).instanceOf(Uint32Array);
      expect(a.length).eq(400000 - 100);
      for (let i = 0; i < a.length; ++i) {
        if (a[i] !== 100 + i) {
          expect(a[i]).eq(100 + i);
        }
      }
    });
  });

  describe.only("rangeArray", () => {
    it("should work", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeArray(2, 126);
      expect(a).instanceOf(Array);
      expect(a).deep.eq([2, 5, 124]);
    });

    it("should work with negative start value and an end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(bitmap.rangeArray(-2, 0xffffffff)).deep.eq([1, 2, 5, 124]);
    });

    it("should work with no start and no end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeArray();
      expect(a).instanceOf(Array);
      expect(a).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work with floating point values", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(bitmap.rangeArray(1.5, 5.5)).deep.eq([2, 5]);
      expect(bitmap.rangeArray(1.5, 124.1)).deep.eq([2, 5, 124]);
    });

    it("works with a subrange of a big bitmap", () => {
      const bitmap = RoaringBitmap32.fromRange(0, 0xffffffff);
      const a = bitmap.rangeArray(100, 400000);
      expect(a).instanceOf(Array);
      expect(a.length).eq(400000 - 100);
      for (let i = 0; i < a.length; ++i) {
        if (a[i] !== 100 + i) {
          expect(a[i]).eq(100 + i);
        }
      }
    });
  });

  describe("rangeSet", () => {
    it("should work", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeSet(2, 126);
      expect(a).instanceOf(Set);
      expect(Array.from(a)).deep.eq([2, 5, 124]);
    });

    it("should work with negative start value and an end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(Array.from(bitmap.rangeSet(-2, 0xffffffff))).deep.eq([1, 2, 5, 124]);
    });

    it("should work with no start and no end value", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      const a = bitmap.rangeSet();
      expect(a).instanceOf(Set);
      expect(Array.from(a)).deep.eq([1, 2, 5, 124, 0xffffffff]);
    });

    it("should work with floating point values", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      expect(Array.from(bitmap.rangeSet(1.5, 5.5))).deep.eq([2, 5]);
      expect(Array.from(bitmap.rangeSet(1.5, 124.1))).deep.eq([2, 5, 124]);
    });

    it("works with a subrange of a big bitmap", () => {
      const bitmap = RoaringBitmap32.fromRange(0, 0xffffffff);
      const a = bitmap.rangeSet(100, 400000);
      expect(a).instanceOf(Set);
      const array = Array.from(a);
      expect(array.length).eq(400000 - 100);
      for (let i = 0; i < array.length; ++i) {
        if (array[i] !== 100 + i) {
          expect(array[i]).eq(100 + i);
        }
      }
    });
  });
});
