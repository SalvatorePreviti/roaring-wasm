import { expect } from "chai";
import { RoaringArenaAllocator, RoaringBitmap32, roaringLibraryInitialize } from "roaring-wasm-src";

describe("RoaringBitmap32 one element", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  describe("read", () => {
    it("should not be empty", () => {
      expect(new RoaringBitmap32([123]).isEmpty()).eq(false);
    });

    it("should have cardinality() === 1", () => {
      expect(new RoaringBitmap32([123]).cardinality()).eq(1);
    });

    it("should have minimum === 123", () => {
      expect(new RoaringBitmap32([123]).minimum()).eq(123);
    });

    it("should have maximum === 123", () => {
      expect(new RoaringBitmap32([123]).maximum()).eq(123);
    });

    it("should not contain 0", () => {
      expect(new RoaringBitmap32([123]).contains(0)).eq(false);
    });

    it("should contain 123", () => {
      expect(new RoaringBitmap32([123]).contains(123)).eq(true);
    });

    it("has a toRoaringUint32Array() that returns [123]", () => {
      expect(new RoaringBitmap32([123]).toRoaringUint32Array().toArray()).deep.eq([123]);
    });

    it("has a toArray() that returns [123]", () => {
      expect(new RoaringBitmap32([123]).toArray()).deep.eq([123]);
    });

    it("should have a portable serialization size 18", () => {
      expect(new RoaringBitmap32([123]).getSerializationSizeInBytes(true)).eq(18);
    });

    it("should serialize as (portable)", () => {
      const array = new RoaringBitmap32([123]).serializeToRoaringUint8Array(true).toArray();
      expect(array).deep.eq([58, 48, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 123, 0]);
    });

    it("should have a native serialization size 9", () => {
      expect(new RoaringBitmap32([123]).getSerializationSizeInBytes()).eq(9);
    });

    it("should serialize as (native)", () => {
      const array = new RoaringBitmap32([123]).serializeToRoaringUint8Array().toArray();
      expect(array).deep.eq([1, 1, 0, 0, 0, 123, 0, 0, 0]);
    });

    it("should be a subset of itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.isSubset(instance)).eq(true);
    });

    it("should not be a strict subset of itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.isStrictSubset(instance)).eq(false);
    });

    it("should be equal to itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.equals(instance)).eq(true);
    });

    it("should not be equal to an empty instance", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.equals(new RoaringBitmap32([]))).eq(false);
    });

    it("should select", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.select(0)).eq(123);
      expect(isNaN(instance.select(1))).eq(true);
    });

    it("should indexOf", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.indexOf(123)).eq(0);
      expect(instance.indexOf(124)).eq(-1);
    });

    it("should rank", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.rank(1)).eq(0);
      expect(instance.rank(123)).eq(1);
      expect(instance.rank(12300)).eq(1);
    });

    it("should have AND cardinality of 1 with itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.andCardinality(instance)).eq(1);
    });

    it("should have OR cardinality of 1 with itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.orCardinality(instance)).eq(1);
    });

    it("should have XOR cardinality of 0 with itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.xorCardinality(instance)).eq(0);
    });

    it("should have AND NOT cardinality of 0 with itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.andNotCardinality(instance)).eq(0);
    });

    it("has a valid jaccard index with itself", () => {
      const instance = new RoaringBitmap32([123]);
      expect(instance.jaccardIndex(instance)).eq(1);
    });
  });
});
