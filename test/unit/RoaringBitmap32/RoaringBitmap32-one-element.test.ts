import { expect } from "chai";
import IDisposable from "idisposable";
import RoaringBitmap32 from "../../../src/ts/RoaringBitmap32";

describe("RoaringBitmap32 one element", () => {
  describe("read", () => {
    let instance: RoaringBitmap32;

    before(() => {
      instance = new RoaringBitmap32();
      instance.add(123);
    });

    after(() => {
      IDisposable.dispose(instance);
    });

    it("should not be empty", () => {
      expect(instance.isEmpty()).eq(false);
    });

    it("should have cardinality() === 1", () => {
      expect(instance.cardinality()).eq(1);
    });

    it("should have minimum === 123", () => {
      expect(instance.minimum()).eq(123);
    });

    it("should have maximum === 123", () => {
      expect(instance.maximum()).eq(123);
    });

    it("should not contain 0", () => {
      expect(instance.contains(0)).eq(false);
    });

    it("should contain 123", () => {
      expect(instance.contains(123)).eq(true);
    });

    it("has a toRoaringUint32Array() that returns [123]", () => {
      IDisposable.using(instance.toRoaringUint32Array(), (p) => {
        expect(p.toArray()).deep.eq([123]);
      });
    });

    it("has a toArray() that returns [123]", () => {
      expect(instance.toArray()).deep.eq([123]);
    });

    it("should have a portable serialization size 18", () => {
      expect(instance.getSerializationSizeInBytes(true)).eq(18);
    });

    it("should serialize as (portable)", () => {
      const array = IDisposable.using(instance.serializeToRoaringUint8Array(true), (buffer) => buffer.toArray());
      expect(array).deep.eq([58, 48, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 123, 0]);
    });

    it("should have a native serialization size 9", () => {
      expect(instance.getSerializationSizeInBytes()).eq(9);
    });

    it("should serialize as (native)", () => {
      const array = IDisposable.using(instance.serializeToRoaringUint8Array(), (buffer) => buffer.toArray());
      expect(array).deep.eq([1, 1, 0, 0, 0, 123, 0, 0, 0]);
    });

    it("should be a subset of itself", () => {
      expect(instance.isSubset(instance)).eq(true);
    });

    it("should not be a strict subset of itself", () => {
      expect(instance.isStrictSubset(instance)).eq(false);
    });

    it("should be equal to itself", () => {
      expect(instance.equals(instance)).eq(true);
    });

    it("should not be equal to an empty instance", () => {
      IDisposable.using(new RoaringBitmap32(), (second) => {
        expect(instance.equals(second)).eq(false);
      });
    });

    it("should select", () => {
      expect(instance.select(0)).eq(123);
      expect(isNaN(instance.select(1))).eq(true);
    });

    it("should rank", () => {
      expect(instance.rank(1)).eq(0);
      expect(instance.rank(123)).eq(1);
      expect(instance.rank(12300)).eq(1);
    });

    it("should have AND cardinality of 1 with itself", () => {
      expect(instance.andCardinality(instance)).eq(1);
    });

    it("should have OR cardinality of 1 with itself", () => {
      expect(instance.orCardinality(instance)).eq(1);
    });

    it("should have XOR cardinality of 0 with itself", () => {
      expect(instance.xorCardinality(instance)).eq(0);
    });

    it("should have AND NOT cardinality of 0 with itself", () => {
      expect(instance.andNotCardinality(instance)).eq(0);
    });

    it("has a valid jaccard index with itself", () => {
      expect(instance.jaccardIndex(instance)).eq(1);
    });
  });
});
