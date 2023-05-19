import { expect } from "chai";
import IDisposable from "idisposable";
import roaringWasm from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringUint8Array } from "roaring-wasm-src";

function sameInstance(a: any, b: any): boolean {
  return a === b;
}

describe("RoaringUint8Array", () => {
  it("allows creating empty arrays", () => {
    IDisposable.using(new RoaringUint8Array(0), (p) => {
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
  });

  it("allows creating a small array", () => {
    IDisposable.using(new RoaringUint8Array(12), (p) => {
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
  });

  it("copies arrays", () => {
    IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
      expect(p.length).eq(3);
      expect(p.byteLength).eq(3);
      expect(p.byteOffset).to.be.greaterThan(0);
      expect(p.BYTES_PER_ELEMENT).eq(1);
      expect(p.toArray()).deep.eq([1, 2, 3]);
      expect(p.isDisposed).eq(false);
    });
  });

  describe("asTypedArray", () => {
    it("returns a valid view", () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
        const buf = p.asTypedArray();
        expect(buf.length).eq(3);
        expect(buf[0]).eq(1);
        expect(buf[1]).eq(2);
        expect(buf[2]).eq(3);
        expect(buf.buffer === p.buffer).eq(true);
      });
    });
  });

  describe("toTypedArray", () => {
    it("returns a copy", () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
        const buf = p.toTypedArray();
        expect(buf.length).eq(3);
        expect(buf[0]).eq(1);
        expect(buf[1]).eq(2);
        expect(buf[2]).eq(3);
        expect(buf.buffer !== p.buffer).eq(true);
      });
    });
  });

  describe("asNodeBuffer", () => {
    it("returns a valid view", () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
        const buf = p.asNodeBuffer();
        expect(buf.length).eq(3);
        expect(buf[0]).eq(1);
        expect(buf[1]).eq(2);
        expect(buf[2]).eq(3);
        expect(buf.buffer === p.buffer).eq(true);
      });
    });
  });

  describe("toNodeBuffer", () => {
    it("returns a copy", () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), (p) => {
        const buf = p.toNodeBuffer();
        expect(buf.length).eq(3);
        expect(buf[0]).eq(1);
        expect(buf[1]).eq(2);
        expect(buf[2]).eq(3);
        expect(buf.buffer !== p.buffer).eq(true);
      });
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
      IDisposable.using(new RoaringUint8Array(5), (p) => {
        p.throwIfDisposed();
      });
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
