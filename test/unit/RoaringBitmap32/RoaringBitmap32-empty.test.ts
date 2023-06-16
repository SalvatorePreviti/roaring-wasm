import { expect } from "chai";
import { RoaringArenaAllocator, RoaringBitmap32, roaringLibraryInitialize } from "roaring-wasm-src";

describe("RoaringBitmap32 empty", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  it("should have isEmpty() === true", () => {
    expect(new RoaringBitmap32().isEmpty).eq(true);
  });

  it("should have size === 0", () => {
    expect(new RoaringBitmap32().size).eq(0);
  });

  it("has a toArray() that returns an empty array", () => {
    expect(new RoaringBitmap32().toArray()).deep.eq([]);
  });

  it("should have minimum === 4294967295", () => {
    expect(new RoaringBitmap32().minimum()).eq(4294967295);
  });

  it("should have maximum === 0", () => {
    expect(new RoaringBitmap32().maximum()).eq(0);
  });

  it("should not contain 0", () => {
    expect(new RoaringBitmap32().has(0)).eq(false);
  });

  it("should have a portable serialization size 8", () => {
    expect(new RoaringBitmap32().getSerializationSizeInBytes(true)).eq(8);
  });

  it('should serialize as "empty" (portable)', () => {
    const buf = new RoaringBitmap32().serializeToRoaringUint8Array(true);
    expect(Array.from(buf.asTypedArray())).deep.eq([58, 48, 0, 0, 0, 0, 0, 0]);
  });

  it("should have a native serialization size 5", () => {
    expect(new RoaringBitmap32().getSerializationSizeInBytes()).eq(5);
  });

  it('should serialize as "empty" (native)', () => {
    const buf = new RoaringBitmap32().serializeToRoaringUint8Array();
    expect(Array.from(buf.asTypedArray())).deep.eq([1, 0, 0, 0, 0]);
  });

  it("should be a subset of itself", () => {
    expect(new RoaringBitmap32().isSubset(new RoaringBitmap32())).eq(true);
  });

  it("should not be a strict subset of itself", () => {
    expect(new RoaringBitmap32().isStrictSubset(new RoaringBitmap32())).eq(false);
  });
});
