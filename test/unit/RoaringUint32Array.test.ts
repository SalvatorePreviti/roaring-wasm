import { expect } from "chai";
import IDisposable from "idisposable";
import { roaringWasm } from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringUint32Array, roaringLibraryInitialize } from "roaring-wasm-src";

function sameInstance(a: any, b: any): boolean {
  return a === b;
}

describe("RoaringUint32Array", () => {
  before(roaringLibraryInitialize);

  it("allows creating empty arrays", () => {
    IDisposable.using(new RoaringUint32Array(0), (p) => {
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
  });

  it("allows creating a small array", () => {
    IDisposable.using(new RoaringUint32Array(12), (p) => {
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
  });

  it("copies arrays", () => {
    IDisposable.using(new RoaringUint32Array([1, 2, 0xffffffff]), (p) => {
      expect(p.length).eq(3);
      expect(p.byteLength).eq(12);
      expect(p.byteOffset).to.be.greaterThan(0);
      expect(p.toArray()).deep.eq([1, 2, 0xffffffff]);
      expect(p.isDisposed).eq(false);
    });
  });

  it("works copying arrays", () => {
    IDisposable.using(new RoaringUint32Array([123, 189, 456, 789]), (p) => {
      expect(p.toArray()).deep.eq([123, 189, 456, 789]);
      IDisposable.using(new RoaringUint32Array(p), (q) => {
        expect(q.toArray()).deep.eq([123, 189, 456, 789]);
      });
    });
  });
});
