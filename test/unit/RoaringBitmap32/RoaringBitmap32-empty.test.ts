import { expect } from "chai";
import IDisposable = require("idisposable");
import RoaringBitmap32 = require("../../../src/ts/RoaringBitmap32");

describe("RoaringBitmap32 empty", () => {
  let instance: RoaringBitmap32;

  before(() => {
    instance = new RoaringBitmap32();
  });

  after(() => {
    IDisposable.dispose(instance);
  });

  it("should have isEmpty() === true", () => {
    expect(instance.isEmpty()).eq(true);
  });

  it("should have cardinality() === 0", () => {
    expect(instance.cardinality()).eq(0);
  });

  it("has a toArray() that returns an empty array", () => {
    expect(instance.toArray()).deep.eq([]);
  });

  it("should have minimum === 4294967295", () => {
    expect(instance.minimum()).eq(4294967295);
  });

  it("should have maximum === 0", () => {
    expect(instance.maximum()).eq(0);
  });

  it("should not contain 0", () => {
    expect(instance.contains(0)).eq(false);
  });

  it("should have a portable serialization size 8", () => {
    expect(instance.getSerializationSizeInBytes(true)).eq(8);
  });

  it('should serialize as "empty" (portable)', () => {
    const array = IDisposable.using(instance.serializeToRoaringUint8Array(true), (buffer) => buffer.toArray());
    expect(array).deep.eq([58, 48, 0, 0, 0, 0, 0, 0]);
  });

  it("should have a native serialization size 5", () => {
    expect(instance.getSerializationSizeInBytes()).eq(5);
  });

  it('should serialize as "empty" (native)', () => {
    const array = IDisposable.using(instance.serializeToRoaringUint8Array(), (buffer) => buffer.toArray());
    expect(array).deep.eq([1, 0, 0, 0, 0]);
  });

  it("should be a subset of itself", () => {
    expect(instance.isSubset(instance)).eq(true);
  });

  it("should not be a strict subset of itself", () => {
    expect(instance.isStrictSubset(instance)).eq(false);
  });
});
