import { expect } from "chai";
import { roaringWasm } from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringArenaAllocator, RoaringUint8Array, roaringLibraryInitialize } from "roaring-wasm-src";

describe("RoaringUint8Array", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  it("allows creating empty arrays", () => {
    const p = new RoaringUint8Array(0);
    expect(p.byteLength).eq(0);
    expect(p.asTypedArray().length).eq(0);
    expect(p.isDisposed).eq(true);
  });

  it("allows creating a small array", () => {
    const p = new RoaringUint8Array(12);
    expect(p.byteLength).eq(12);
    expect(p.asTypedArray().length).eq(12);
    expect(p.isDisposed).eq(false);
  });

  it("copies arrays", () => {
    const p = new RoaringUint8Array([1, 2, 3]);
    expect(p.byteLength).eq(3);
    expect(p.asTypedArray().length).eq(3);
    expect(Array.from(p.asTypedArray())).deep.eq([1, 2, 3]);
    expect(p.isDisposed).eq(false);
  });

  describe("asTypedArray", () => {
    it("returns a valid view", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = p.asTypedArray();
      expect(buf.length).eq(3);
      expect(buf[0]).eq(1);
      expect(buf[1]).eq(2);
      expect(buf[2]).eq(3);
      expect(buf.buffer === roaringWasm.HEAPU8.buffer).eq(true);
    });
  });

  describe("toTypedArray", () => {
    it("returns a copy", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = p.toTypedArray();
      expect(buf.length).eq(3);
      expect(buf[0]).eq(1);
      expect(buf[1]).eq(2);
      expect(buf[2]).eq(3);
      expect(buf.buffer !== roaringWasm.HEAPU8.buffer).eq(true);
    });

    it("accepts a smaller output array", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = new Uint8Array(2);
      p.toTypedArray(buf);
      expect(buf.length).eq(2);
      expect(buf[0]).eq(1);
      expect(buf[1]).eq(2);
    });

    it("accepts a larger output array", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = new Uint8Array(4);
      const ret = p.toTypedArray(buf);
      expect(ret.buffer).eq(buf.buffer);
      expect(ret.length).eq(3);
      expect(ret[0]).eq(1);
      expect(ret[1]).eq(2);
      expect(ret[2]).eq(3);
    });

    it("accepts same size output array", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = new Uint8Array(3);
      const ret = p.toTypedArray(buf);
      expect(ret).eq(buf);
      expect(ret.length).eq(3);
      expect(ret[0]).eq(1);
      expect(ret[1]).eq(2);
      expect(ret[2]).eq(3);
    });
  });

  describe("dispose", () => {
    it("can be called twice", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      expect(p.dispose()).eq(true);
      expect(p.isDisposed).eq(true);
      expect(p.dispose()).eq(false);
      expect(p.isDisposed).eq(true);
    });

    it("resets everything", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      expect(p.dispose()).eq(true);
      expect(p.byteLength).eq(0);
      expect(p.asTypedArray().length).eq(0);
      expect(p.isDisposed).eq(true);
    });
  });

  describe("throwIfDisposed", () => {
    it("does not throw if not disposed", () => {
      const p = new RoaringUint8Array(5);
      p.throwIfDisposed();
    });

    it("throws if disposed", () => {
      const t = new RoaringUint8Array(4);
      t.dispose();
      expect(() => {
        t.throwIfDisposed();
      }).to.throw();
    });
  });

  describe("shrink", () => {
    it("should shrink the allocated memory", () => {
      const array = new RoaringUint8Array(100);
      expect(array.byteLength).eq(100);
      expect(array.shrink(50)).true;
      expect(array.byteLength).eq(50);
      expect(array.shrink(50)).false;
      expect(array.byteLength).eq(50);
      expect(array.shrink(0)).true;
      expect(array.byteLength).eq(0);
      expect(array.shrink(0)).false;
      expect(array.byteLength).eq(0);
      expect(array.isDisposed).true;
    });
  });

  describe("at", () => {
    it("should return the value at the given index", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.at(0)).eq(1);
      expect(array.at(1)).eq(2);
      expect(array.at(2)).eq(3);
    });

    it("should behaves like array.at() if the index is negative", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.at(-1)).eq(3);
      expect(array.at(-2)).eq(2);
      expect(array.at(-3)).eq(1);
    });

    it("shoudl work for floating point values like array.at()", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.at(0.1)).eq(1);
      expect(array.at(1.1)).eq(2);
      expect(array.at(2.1)).eq(3);
    });
  });

  describe("setAt", () => {
    it("should set the value at the given index", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.setAt(0, 10)).true;
      expect(array.setAt(1, 20)).true;
      expect(array.setAt(2, 30)).true;
      expect(Array.from(array.asTypedArray())).deep.eq([10, 20, 30]);
    });

    it("should behaves like array.at() if the index is negative", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.setAt(-1, 10)).true;
      expect(array.setAt(-2, 20)).true;
      expect(array.setAt(-3, 30)).true;
      expect(Array.from(array.asTypedArray())).deep.eq([30, 20, 10]);
    });

    it("should return false if the index is out of bounds", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.setAt(3, 10)).false;
      expect(array.setAt(4, 20)).false;
      expect(array.setAt(-5, 30)).false;
      expect(Array.from(array.asTypedArray())).deep.eq([1, 2, 3]);
    });

    it("shoudl work for floating point values like array.at()", () => {
      const array = new RoaringUint8Array([1, 2, 3]);
      expect(array.setAt(0.1, 10)).true;
      expect(array.setAt(1.1, 20)).true;
      expect(array.setAt(2.1, 30)).true;
      expect(Array.from(array.asTypedArray())).deep.eq([10, 20, 30]);
    });
  });
});
