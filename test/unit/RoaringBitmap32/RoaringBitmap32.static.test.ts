import { RoaringArenaAllocator, roaringLibraryInitialize, RoaringBitmap32 } from "roaring-wasm-src";
import { expect } from "chai";

describe("RoaringBitmap32 static", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  describe("addOffset", () => {
    it("returns an empty bitmap if the input bitmap is empty", () => {
      const input = new RoaringBitmap32();
      const offsetted = RoaringBitmap32.addOffset(input, 10);
      expect(offsetted).to.not.eq(input);
      expect(offsetted.toArray()).deep.equal([]);
      expect(offsetted.isEmpty()).to.be.true;
    });

    it("increment values", () => {
      const input = new RoaringBitmap32([1, 2, 3, 100]);
      const offsetted = RoaringBitmap32.addOffset(input, 10);
      expect(offsetted.toArray()).deep.equal([11, 12, 13, 110]);
      expect(offsetted).to.not.eq(input);
    });

    it("decrement values", () => {
      const input = new RoaringBitmap32([11, 12, 13, 1100]);
      const offsetted = RoaringBitmap32.addOffset(input, -10);
      expect(offsetted.toArray()).deep.equal([1, 2, 3, 1090]);
      expect(offsetted).to.not.eq(input);
    });

    it("accepts out of range values and NaN", () => {
      const input = new RoaringBitmap32([1, 2, 30, 40, 0xffffffff]);
      expect(RoaringBitmap32.addOffset(input, -Infinity).toArray()).deep.equal([]);
      expect(RoaringBitmap32.addOffset(input, Infinity).toArray()).deep.equal([]);
      expect(RoaringBitmap32.addOffset(input, -0xffffffff - 1).toArray()).deep.equal([]);
      expect(RoaringBitmap32.addOffset(input, 0xffffffff).toArray()).deep.equal([]);
      expect(RoaringBitmap32.addOffset(input, -0xffffffff).toArray()).deep.equal([0]);
      expect(RoaringBitmap32.addOffset(input, 0xfffffffe).toArray()).deep.equal([4294967295]);
      expect(RoaringBitmap32.addOffset(input, -35).toArray()).deep.equal([5, 4294967260]);
      expect(RoaringBitmap32.addOffset(input, 35).toArray()).deep.equal([36, 37, 65, 75]);
    });
  });

  describe("static from", () => {
    it("creates an empty bitmap with an empty array", () => {
      const bitmap = RoaringBitmap32.from([]);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with an empty bitmap", () => {
      const bitmap = RoaringBitmap32.from(new RoaringBitmap32());
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty()).eq(true);
    });

    it("creates a bitmap from an array", () => {
      const bitmap = RoaringBitmap32.from([1, 3, 2, 100, 50]);
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 50, 100]);
    });

    it("creates a bitmap from an Uint32Array", () => {
      const bitmap = RoaringBitmap32.from(new Uint32Array([1, 3, 2, 100, 50]));
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 50, 100]);
    });

    it("creates a bitmap from an Int32Array", () => {
      const bitmap = RoaringBitmap32.from(new Int32Array([1, 3, 2, 100, 50]));
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 50, 100]);
    });

    it("creates a bitmap from another bitmap", () => {
      const bitmap1 = new RoaringBitmap32([1, 3, 2, 100, 50]);
      const bitmap2 = RoaringBitmap32.from(bitmap1);
      expect(bitmap1 !== bitmap2).to.be.true;
      expect(bitmap2.toArray()).deep.equal([1, 2, 3, 50, 100]);
    });
  });

  describe("static and", () => {
    it("returns empty with empty bitmaps", () => {
      const bitmap = RoaringBitmap32.and(new RoaringBitmap32(), new RoaringBitmap32());
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.isEmpty()).eq(true);
      expect(bitmap.size).eq(0);
    });

    it("returns empty with an non empty bitmap", () => {
      const bitmap = RoaringBitmap32.and(new RoaringBitmap32(), new RoaringBitmap32([1, 2, 3]));
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.isEmpty()).eq(true);
      expect(bitmap.size).eq(0);
    });

    it("ands two bitmaps", () => {
      const bitmap = RoaringBitmap32.and(new RoaringBitmap32([3, 1, 2]), new RoaringBitmap32([4, 2]));
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.toArray()).deep.equal([2]);
    });
  });

  describe("static or", () => {
    it("returns empty with empty bitmaps", () => {
      const bitmap = RoaringBitmap32.or(new RoaringBitmap32(), new RoaringBitmap32());
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.isEmpty()).eq(true);
      expect(bitmap.size).eq(0);
    });

    it("performs or with empty and non empty", () => {
      const c = RoaringBitmap32.or(new RoaringBitmap32(), new RoaringBitmap32([1, 3, 2]));
      expect(c.toArray()).deep.equal([1, 2, 3]);
    });

    it("ors two bitmaps", () => {
      const bitmap = RoaringBitmap32.or(new RoaringBitmap32([3, 1, 2]), new RoaringBitmap32([4, 2]));
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 4]);
    });
  });

  describe("static xor", () => {
    it("returns empty with empty bitmaps", () => {
      const c = RoaringBitmap32.xor(new RoaringBitmap32(), new RoaringBitmap32());
      expect(c.isEmpty()).eq(true);
    });

    it("performs or with empty and non empty", () => {
      const bitmap = RoaringBitmap32.xor(new RoaringBitmap32(), new RoaringBitmap32([1, 2, 3]));
      expect(bitmap.toArray()).deep.equal([1, 2, 3]);
    });

    it("xors two bitmaps", () => {
      const bitmap = RoaringBitmap32.xor(new RoaringBitmap32([3, 1, 2]), new RoaringBitmap32([4, 2]));
      expect(bitmap.toArray()).deep.equal([1, 3, 4]);
    });
  });

  describe("static andNot", () => {
    it("returns empty with empty bitmaps", () => {
      const c = RoaringBitmap32.andNot(new RoaringBitmap32(), new RoaringBitmap32());
      expect(c.isEmpty()).eq(true);
    });

    it("returns empty  with an non empty array", () => {
      const c = RoaringBitmap32.andNot(new RoaringBitmap32(), new RoaringBitmap32([1, 2, 3]));
      expect(c.isEmpty()).eq(true);
    });

    it("andnots two bitmaps", () => {
      const bitmap = RoaringBitmap32.andNot(new RoaringBitmap32([3, 1, 2]), new RoaringBitmap32([4, 2]));
      expect(bitmap.toArray()).deep.equal([1, 3]);
    });
  });

  describe("static orMany", () => {
    it("orManys multiple bitmaps (spread arguments)", () => {
      const bitmap = RoaringBitmap32.orMany([
        new RoaringBitmap32([3, 1, 2]),
        new RoaringBitmap32([1, 2, 4]),
        new RoaringBitmap32([1, 2, 6]),
      ]);
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 4, 6]);
    });

    it("orManys multiple bitmaps (array)", () => {
      const bitmap = RoaringBitmap32.orMany([
        new RoaringBitmap32([3, 1, 2]),
        new RoaringBitmap32([1, 2, 4]),
        new RoaringBitmap32([1, 2, 6]),
      ]);
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 4, 6]);
    });

    it("creates an empty bitmap with no argument passed", () => {
      const x = RoaringBitmap32.orMany([]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a single empty bitmap passed", () => {
      const x = RoaringBitmap32.orMany([new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a single empty bitmap passed as array", () => {
      const x = RoaringBitmap32.orMany([new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with multiple empty bitmap passed", () => {
      const x = RoaringBitmap32.orMany([new RoaringBitmap32(), new RoaringBitmap32(), new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a multiple empty bitmap passed as array", () => {
      const x = RoaringBitmap32.orMany([new RoaringBitmap32(), new RoaringBitmap32(), new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });
  });

  describe("static xorMany", () => {
    it("xorManys multiple bitmaps (spread arguments)", () => {
      const bitmap = RoaringBitmap32.xorMany([
        new RoaringBitmap32([3, 1, 2]),
        new RoaringBitmap32([3, 2]),
        new RoaringBitmap32([6, 7, 8]),
        new RoaringBitmap32([7, 4]),
      ]);
      expect(bitmap.toArray()).deep.equal([1, 4, 6, 8]);
    });

    it("xorManys multiple bitmaps (array)", () => {
      const bitmap = RoaringBitmap32.xorMany([
        new RoaringBitmap32([3, 1, 2]),
        new RoaringBitmap32([3, 2]),
        new RoaringBitmap32([6, 7, 8]),
        new RoaringBitmap32([7, 4]),
      ]);
      expect(bitmap.toArray()).deep.equal([1, 4, 6, 8]);
    });

    it("creates an empty bitmap with no argument passed", () => {
      const x = RoaringBitmap32.xorMany([]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a single empty bitmap passed", () => {
      const x = RoaringBitmap32.xorMany([new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a single empty bitmap passed as array", () => {
      const x = RoaringBitmap32.xorMany([new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with multiple empty bitmap passed", () => {
      const x = RoaringBitmap32.xorMany([new RoaringBitmap32(), new RoaringBitmap32(), new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });

    it("creates an empty bitmap with a multiple empty bitmap passed as array", () => {
      const x = RoaringBitmap32.xorMany([new RoaringBitmap32(), new RoaringBitmap32(), new RoaringBitmap32()]);
      expect(x).to.be.instanceOf(RoaringBitmap32);
      expect(x.size).eq(0);
      expect(x.isEmpty()).eq(true);
    });
  });

  describe("static swap", () => {
    it("swaps two empty bitmaps", () => {
      const a = new RoaringBitmap32();
      const b = new RoaringBitmap32();
      RoaringBitmap32.swap(a, b);
      expect(a.size).eq(0);
      expect(a.isEmpty()).eq(true);
      expect(b.size).eq(0);
      expect(b.isEmpty()).eq(true);
    });

    it("swaps one empty with a non empty bitmap", () => {
      const a = new RoaringBitmap32();
      const b = new RoaringBitmap32([1, 2, 3]);
      RoaringBitmap32.swap(a, b);
      expect(a.size).eq(3);
      expect(a.isEmpty()).eq(false);
      expect(b.size).eq(0);
      expect(b.isEmpty()).eq(true);
    });

    it("swaps two bitmaps", () => {
      const a = new RoaringBitmap32([4, 5]);
      const b = new RoaringBitmap32([1, 2, 3]);
      RoaringBitmap32.swap(a, b);
      expect(a.size).eq(3);
      expect(a.isEmpty()).eq(false);
      expect(b.size).eq(2);
      expect(b.isEmpty()).eq(false);
      expect(a.toArray()).deep.equal([1, 2, 3]);
      expect(b.toArray()).deep.equal([4, 5]);
    });
  });

  describe("of", () => {
    it("creates an empty bitmap", () => {
      const bitmap = RoaringBitmap32.of();
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty()).eq(true);
    });

    it("creates a bitmap with one value", () => {
      const bitmap = RoaringBitmap32.of(1);
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.size).eq(1);
      expect(bitmap.isEmpty()).eq(false);
      expect(bitmap.toArray()).deep.equal([1]);
    });

    it("creates a bitmap with multiple values", () => {
      const bitmap = RoaringBitmap32.of(1, 2, 2, 2, 0xffff, 3);
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.size).eq(4);
      expect(bitmap.isEmpty()).eq(false);
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 0xffff]);
    });

    it("handles non-number values", () => {
      const bitmap = RoaringBitmap32.of(
        -100,
        -1,
        1,
        3,
        2,
        2,
        "123" as any,
        "foo" as any,
        null as any,
        undefined as any,
        NaN,
        false,
        0xffff,
        0xffffffff,
        2,
        3,
        3.1,
        3.8,
        4.2,
      );
      expect(bitmap).to.be.instanceOf(RoaringBitmap32);
      expect(bitmap.isEmpty()).eq(false);
      expect(bitmap.toArray()).deep.equal([1, 2, 3, 4, 123, 0xffff, 0xffffffff]);
    });
  });
});
