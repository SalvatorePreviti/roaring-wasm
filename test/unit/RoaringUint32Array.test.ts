import { expect } from "chai";
import { roaringWasm } from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringArenaAllocator, RoaringUint32Array, roaringLibraryInitialize } from "roaring-wasm-src";

function sameInstance(a: any, b: any): boolean {
  return a === b;
}

describe("RoaringUint32Array", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  it("allows creating empty arrays", () => {
    const p = new RoaringUint32Array(0);
    expect(p.length).eq(0);
    expect(p.byteLength).eq(0);
    expect(p.byteOffset).eq(0);
    expect(p.BYTES_PER_ELEMENT).eq(4);
    expect(p.heap).to.be.an.instanceOf(Uint32Array);
    expect(p.buffer).to.be.an.instanceOf(ArrayBuffer);
    expect(sameInstance(p.heap, roaringWasm.HEAPU32)).eq(true);
    expect(sameInstance(p.buffer, roaringWasm.HEAP8.buffer)).eq(true);
    expect(p.toArray()).deep.eq([]);
    expect(p.isDisposed).eq(true);
  });

  it("allows creating a small array", () => {
    const p = new RoaringUint32Array(12);
    expect(p.length).eq(12);
    expect(p.byteLength).eq(12 * 4);
    expect(p.byteOffset).to.be.greaterThan(0);
    expect(p.BYTES_PER_ELEMENT).eq(4);
    expect(p.heap).to.be.an.instanceOf(Uint32Array);
    expect(p.buffer).to.be.an.instanceOf(ArrayBuffer);
    expect(sameInstance(p.heap, roaringWasm.HEAPU32)).eq(true);
    expect(sameInstance(p.buffer, roaringWasm.HEAP8.buffer)).eq(true);
    expect(p.isDisposed).eq(false);
  });

  it("copies arrays", () => {
    const p = new RoaringUint32Array([1, 2, 0xffffffff]);
    expect(p.length).eq(3);
    expect(p.byteLength).eq(12);
    expect(p.byteOffset).to.be.greaterThan(0);
    expect(p.toArray()).deep.eq([1, 2, 0xffffffff]);
    expect(p.isDisposed).eq(false);
  });

  it("works copying arrays", () => {
    const p = new RoaringUint32Array([123, 189, 456, 789]);
    expect(p.toArray()).deep.eq([123, 189, 456, 789]);
    const q = new RoaringUint32Array(p);
    expect(q.toArray()).deep.eq([123, 189, 456, 789]);
  });

  describe("shrink", () => {
    it("should shrink the allocated memory", () => {
      const array = new RoaringUint32Array(100);
      expect(array.byteLength).eq(100 * 4);
      expect(array.length).eq(100);
      expect(array.shrink(50)).true;
      expect(array.byteLength).eq(50 * 4);
      expect(array.length).eq(50);
      expect(array.shrink(50)).false;
      expect(array.byteLength).eq(50 * 4);
      expect(array.length).eq(50);
      expect(array.shrink(0)).true;
      expect(array.byteLength).eq(0 * 4);
      expect(array.length).eq(0);
      expect(array.shrink(0)).false;
      expect(array.byteLength).eq(0 * 4);
      expect(array.length).eq(0);
      expect(array.isDisposed).true;
    });
  });

  describe("at", () => {
    it("should return the value at the given index", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.at(0)).eq(1);
      expect(array.at(1)).eq(2);
      expect(array.at(2)).eq(3);
    });

    it("should behaves like array.at() if the index is negative", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.at(-1)).eq(3);
      expect(array.at(-2)).eq(2);
      expect(array.at(-3)).eq(1);
    });

    it("shoudl work for floating point values like array.at()", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.at(0.1)).eq(1);
      expect(array.at(1.1)).eq(2);
      expect(array.at(2.1)).eq(3);
    });
  });

  describe("setAt", () => {
    it("should set the value at the given index", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.setAt(0, 10)).true;
      expect(array.setAt(1, 20)).true;
      expect(array.setAt(2, 30)).true;
      expect(array.toArray()).deep.eq([10, 20, 30]);
    });

    it("should behaves like array.at() if the index is negative", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.setAt(-1, 10)).false;
      expect(array.setAt(-2, 20)).false;
      expect(array.setAt(-3, 30)).false;
    });

    it("should return false if the index is out of bounds", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.setAt(3, 10)).false;
      expect(array.setAt(4, 20)).false;
      expect(array.setAt(-5, 30)).false;
    });

    it("shoudl work for floating point values like array.at()", () => {
      const array = new RoaringUint32Array([1, 2, 3]);
      expect(array.setAt(0.1, 10)).true;
      expect(array.setAt(1.1, 20)).true;
      expect(array.setAt(2.1, 30)).true;
      expect(array.toArray()).deep.eq([10, 20, 30]);
    });
  });
});
