import { expect } from "chai";
import { roaringWasm } from "../../packages/roaring-wasm-src/lib/roaring-wasm";
import { RoaringArenaAlloc, RoaringUint32Array, roaringLibraryInitialize } from "roaring-wasm-src";

function sameInstance(a: any, b: any): boolean {
  return a === b;
}

describe("RoaringUint32Array", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAlloc.push);
  afterEach(RoaringArenaAlloc.pop);

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
});
