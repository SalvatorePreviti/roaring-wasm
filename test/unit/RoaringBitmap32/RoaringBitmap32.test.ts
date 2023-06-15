import { expect } from "chai";
import { RoaringArenaAllocator, RoaringBitmap32, roaringLibraryInitialize } from "roaring-wasm-src";

describe("RoaringBitmap32", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  describe("addChecked", () => {
    it("returns false if nothing changes", () => {
      const bitmap = new RoaringBitmap32([123]);
      expect(bitmap.addChecked(123)).eq(false);
      expect(bitmap.cardinality()).eq(1);
    });

    it("returns true if something changes", () => {
      const bitmap = new RoaringBitmap32([124]);
      expect(bitmap.addChecked(123)).eq(true);
      expect(bitmap.cardinality()).eq(2);
    });
  });

  describe("removeChecked", () => {
    it("returns false if nothing changes", () => {
      const bitmap = new RoaringBitmap32([125]);
      expect(bitmap.removeChecked(123)).eq(false);
      expect(bitmap.cardinality()).eq(1);
    });

    it("returns true if something changes", () => {
      const bitmap = new RoaringBitmap32([123]);
      expect(bitmap.removeChecked(123)).eq(true);
      expect(bitmap.cardinality()).eq(0);
    });
  });

  describe("from array", () => {
    const array = [123, 189, 456, 789, 910];

    it("adds the array one by one", () => {
      const bitmap = new RoaringBitmap32();
      for (const item of array) {
        bitmap.add(item);
      }
      expect(bitmap.toArray()).deep.eq(array);
    });

    it("adds a UInt32Array", () => {
      const buffer = new Uint32Array(array);
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(buffer);
      expect(bitmap.toArray()).deep.eq(array);
    });

    it("adds a simple array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addMany(array);
      expect(bitmap.toArray()).deep.eq(array);
    });

    it("works in the constructor", () => {
      const bitmap = new RoaringBitmap32(array);
      expect(bitmap.toArray()).deep.eq(array);
    });
  });

  it("has callable removeRunCompression, runOptimize, shrinkToFit", () => {
    const bitmap = new RoaringBitmap32([1, 2, 3, 100, 1000, 0xfffffffe, 0xffffffff]);
    bitmap.removeRunCompression();
    bitmap.runOptimize();
    bitmap.shrinkToFit();
  });

  it("indexOf", () => {
    const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
    expect(bitmap.indexOf(1)).eq(0);
    expect(bitmap.indexOf(2)).eq(1);
    expect(bitmap.indexOf(5)).eq(2);
    expect(bitmap.indexOf(124)).eq(3);
    expect(bitmap.indexOf(0xffffffff)).eq(4);
    expect(bitmap.indexOf(0)).eq(-1);
    expect(bitmap.indexOf(3)).eq(-1);
  });

  describe("overwrite", () => {
    it("should overwrite the bitmap", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      bitmap.overwrite(new RoaringBitmap32([1, 2, 3]));
      expect(bitmap.toArray()).deep.eq([1, 2, 3]);
    });
  });

  describe("clear", () => {
    it("should clear the bitmap", () => {
      const bitmap = new RoaringBitmap32([1, 2, 5, 124, 0xffffffff]);
      bitmap.clear();
      expect(bitmap.toArray()).deep.eq([]);
    });

    it("should do nothing with an empty bitmap", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.clear();
      expect(bitmap.toArray()).deep.eq([]);
    });
  });

  describe("clone", () => {
    it("returns a cloned empty bitmap", () => {
      const bitmap1 = new RoaringBitmap32();
      const bitmap2 = bitmap1.clone();
      expect(bitmap1 !== bitmap2).eq(true);
      expect(bitmap2).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap2.size).eq(0);
      expect(bitmap2.isEmpty()).eq(true);
    });

    it("returns a cloned bitmap", () => {
      const values = [1, 2, 100, 101, 200, 400, 0x7fffffff, 0xffffffff];
      const bitmap1 = new RoaringBitmap32(values);
      const bitmap2 = bitmap1.clone();
      expect(bitmap1 !== bitmap2).eq(true);
      expect(bitmap2).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap2.size).eq(values.length);
      expect(bitmap2.isEmpty()).eq(false);
      expect(Array.from(bitmap2.toUint32Array())).deep.equal(values);
    });
  });

  describe("at", () => {
    it("returns the value at the given index", () => {
      const bitmap = new RoaringBitmap32([1, 12, 30, 0xffff]);
      expect(bitmap.at(0)).eq(1);
      expect(bitmap.at(1)).eq(12);
      expect(bitmap.at(2)).eq(30);
      expect(bitmap.at(3)).eq(0xffff);
      expect(bitmap.at(4)).eq(undefined);
      expect(bitmap.at(5)).eq(undefined);
      expect(bitmap.at(-5)).eq(undefined);

      expect(bitmap.at(1.5)).eq(12);
      expect(bitmap.at("1.5" as any)).eq(12);
    });

    it("works with negative indices", () => {
      const bitmap = new RoaringBitmap32([1, 12, 3]);
      expect(bitmap.at(-1)).eq(12);
      expect(bitmap.at(-1.4)).eq(12);
      expect(bitmap.at(-2)).eq(3);
      expect(bitmap.at(-2.9)).eq(3);
      expect(bitmap.at(-3)).eq(1);
      expect(bitmap.at("-3" as any)).eq(1);
      expect(bitmap.at(-4)).eq(undefined);
    });
  });
});
