import { expect } from "chai";
import { RoaringArenaAllocator, RoaringBitmap32, RoaringUint32Array, roaringLibraryInitialize } from "roaring-wasm-src";

describe("RoaringBitmap32 many", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  describe("addMany", () => {
    it("works with empty arrays", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(new RoaringUint32Array([]));
      bitmap.addMany(new Uint32Array([]));
      bitmap.addMany(new Int32Array([]));
      bitmap.addMany(new Uint8Array([]));
      bitmap.addMany([]);
      bitmap.addMany(null);
      bitmap.addMany(undefined);
      expect(bitmap.toArray()).deep.eq([]);
    });

    it("works with a small RoaringUint32Array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(new RoaringUint32Array([1, 5, 10, 10, 0xffffffff, 4, 2, 10, 2, 2, 1, 5]));
      expect(bitmap.toArray()).deep.eq([1, 2, 4, 5, 10, 0xffffffff]);
    });

    it("works with a small Uint32Array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(new Uint32Array([1, 5, 10, 10, 0xffffffff, 4, 2, 10, 2, 2, 1, 5]));
      expect(bitmap.toArray()).deep.eq([1, 2, 4, 5, 10, 0xffffffff]);
    });

    it("works with a small Int16Array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(new Int16Array([2, 5, 0x7fff, 4, 1]));
      expect(bitmap.toArray()).deep.eq([1, 2, 4, 5, 0x7fff]);
    });

    it("works with a small array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany([1, 5, 10, 10, 0xffffffff, null, undefined, NaN, false, 4, 2, 10, 2, 1, 2, 5, 2]);
      expect(bitmap.toArray()).deep.eq([1, 2, 4, 5, 10, 0xffffffff]);
    });

    it("works with a small set", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(new Set([1, 5, 10, 0xffffffff, 4, 2, 1, 5]));
      expect(bitmap.toArray()).deep.eq([1, 2, 4, 5, 10, 0xffffffff]);
    });

    it("works with a large Uint32Array", () => {
      const bitmap = new RoaringBitmap32();
      const arr = new Uint32Array(1070000);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      bitmap.addMany(arr);
      const o = bitmap.toArray();
      for (let i = 0; i < arr.length; i++) {
        if (o[i] !== i) {
          expect(o[i]).eq(i);
        }
      }
    });

    it("works with a large array", () => {
      const bitmap = new RoaringBitmap32();
      const arr = new Array(1070000);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      bitmap.addMany(arr);
      const o = bitmap.toArray();
      for (let i = 0; i < arr.length; i++) {
        if (o[i] !== i) {
          expect(o[i]).eq(i);
        }
      }
    });

    it("works with a large set", () => {
      const bitmap = new RoaringBitmap32();
      const arr = new Set<number>();
      for (let i = 0; i < 100000; i++) {
        arr.add(i);
      }
      bitmap.addMany(arr);
      const o = bitmap.toArray();
      for (let i = 0; i < arr.size; i++) {
        if (o[i] !== i) {
          expect(o[i]).eq(i);
        }
      }
    });

    it("works with a RoaringBitmap32", () => {
      const bitmap = new RoaringBitmap32([1, 12, 3]);
      bitmap.addMany(new RoaringBitmap32([11, 2, 0xffffffff]));
      expect(bitmap.toArray()).deep.eq([1, 2, 3, 11, 12, 0xffffffff]);
    });
  });

  describe("removeMany", () => {
    it("works with empty arrays", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4]);
      bitmap.removeMany(new RoaringUint32Array([]));
      bitmap.removeMany(new Uint32Array([]));
      bitmap.removeMany(new Int32Array([]));
      bitmap.removeMany(new Uint8Array([]));
      bitmap.removeMany([]);
      bitmap.removeMany(null);
      bitmap.removeMany(undefined);
      expect(bitmap.toArray()).deep.eq([1, 2, 3, 4]);
    });

    it("works with a small RoaringUint32Array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany(new RoaringUint32Array([2, 3, 4, 11]));
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });

    it("works with a small Uint32Array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany(new Uint32Array([2, 3, 4, 11]));
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });

    it("works with a small Int16Array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany(new Int16Array([2, 3, 4, 11]));
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });

    it("works with a small array", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany([2, 4, 3, 11, -19, -32, 0xffffffff, null, undefined, NaN, false]);
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });

    it("works with a small set", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany(new Set([2, 0xffffffff, 4, 3, 11, -19, -32]));
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });

    it("works with a RoaringBitmap32", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3, 4, 5, 6, 7]);
      bitmap.removeMany(new RoaringBitmap32([2, 3, 4, 11]));
      expect(bitmap.toArray()).deep.eq([1, 5, 6, 7]);
    });
  });
});
