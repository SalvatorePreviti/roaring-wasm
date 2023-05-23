import { expect } from "chai";
import { roaringWasm } from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringArenaAlloc, RoaringUint8Array, roaringLibraryInitialize } from "roaring-wasm-src";

function sameInstance(a: any, b: any): boolean {
  return a === b;
}

describe("RoaringUint8Array", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAlloc.push);
  afterEach(RoaringArenaAlloc.pop);

  it("allows creating empty arrays", () => {
    const p = new RoaringUint8Array(0);
    expect(p.length).eq(0);
    expect(p.byteOffset).eq(0);
    expect(p.byteLength).eq(0);
    expect(p.BYTES_PER_ELEMENT).eq(1);
    expect(p.heap).to.be.an.instanceOf(Uint8Array);
    expect(p.buffer).to.be.an.instanceOf(ArrayBuffer);
    expect(sameInstance(p.heap, roaringWasm.HEAPU8)).eq(true);
    expect(sameInstance(p.buffer, roaringWasm.HEAP8.buffer)).eq(true);
    expect(p.toArray()).deep.eq([]);
    expect(p.isDisposed).eq(true);
  });

  it("allows creating a small array", () => {
    const p = new RoaringUint8Array(12);
    expect(p.length).eq(12);
    expect(p.byteLength).eq(12);
    expect(p.byteOffset).to.be.greaterThan(0);
    expect(p.BYTES_PER_ELEMENT).eq(1);
    expect(p.heap).to.be.an.instanceOf(Uint8Array);
    expect(p.buffer).to.be.an.instanceOf(ArrayBuffer);
    expect(sameInstance(p.heap, roaringWasm.HEAPU8)).eq(true);
    expect(sameInstance(p.buffer, roaringWasm.HEAP8.buffer)).eq(true);
    expect(p.isDisposed).eq(false);
  });

  it("copies arrays", () => {
    const p = new RoaringUint8Array([1, 2, 3]);
    expect(p.length).eq(3);
    expect(p.byteLength).eq(3);
    expect(p.byteOffset).to.be.greaterThan(0);
    expect(p.BYTES_PER_ELEMENT).eq(1);
    expect(p.toArray()).deep.eq([1, 2, 3]);
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
      expect(buf.buffer === p.buffer).eq(true);
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
      expect(buf.buffer !== p.buffer).eq(true);
    });
  });

  describe("asNodeBuffer", () => {
    it("returns a valid view", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = p.asNodeBuffer();
      expect(buf.length).eq(3);
      expect(buf[0]).eq(1);
      expect(buf[1]).eq(2);
      expect(buf[2]).eq(3);
      expect(buf.buffer === p.buffer).eq(true);
    });
  });

  describe("toNodeBuffer", () => {
    it("returns a copy", () => {
      const p = new RoaringUint8Array([1, 2, 3]);
      const buf = p.toNodeBuffer();
      expect(buf.length).eq(3);
      expect(buf[0]).eq(1);
      expect(buf[1]).eq(2);
      expect(buf[2]).eq(3);
      expect(buf.buffer !== p.buffer).eq(true);
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
      expect(p.byteOffset).eq(0);
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
});
