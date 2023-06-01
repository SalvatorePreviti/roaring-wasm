import { RoaringBitmap32, RoaringBitmap32Iterator } from "roaring-wasm-src";
import { expect } from "chai";

describe("RoaringBitmap32Iterator", () => {
  describe("constructor", () => {
    it("is a class", () => {
      expect(typeof RoaringBitmap32).eq("function");
    });

    it("creates an empty iterator with no arguments", () => {
      const iter = new RoaringBitmap32Iterator();
      expect(iter).to.be.instanceOf(RoaringBitmap32Iterator);
    });

    it("creates an iterator with a RoaringBitmap32", () => {
      const bitmap = new RoaringBitmap32([3, 4, 5]);
      const iter = new RoaringBitmap32Iterator(bitmap);
      expect(iter).to.be.instanceOf(RoaringBitmap32Iterator);
    });
  });

  describe("next", () => {
    it("returns an empty result if iterator is created without arguments", () => {
      const iter = new RoaringBitmap32Iterator();
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.next()).deep.equal({ value: undefined, done: true });
    });

    it("returns an empty result if iterator is created with an empty RoaringBitmap32", () => {
      const iter = new RoaringBitmap32Iterator(new RoaringBitmap32());
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.next()).deep.equal({ value: undefined, done: true });
    });

    it("allows iterating a small array", () => {
      const iter = new RoaringBitmap32Iterator(new RoaringBitmap32([123, 456, 999, 1000]));
      expect(iter.isDisposed).eq(false);
      expect(iter.done).eq(false);
      expect(iter.value).eq(undefined);
      expect(iter.next()).deep.equal({ value: 123, done: false });
      expect(iter.isDisposed).eq(false);
      expect(iter.done).eq(false);
      expect(iter.value).eq(123);
      expect(iter.next()).deep.equal({ value: 456, done: false });
      expect(iter.value).eq(456);
      expect(iter.next()).deep.equal({ value: 999, done: false });
      expect(iter.value).eq(999);
      expect(iter.next()).deep.equal({ value: 1000, done: false });
      expect(iter.value).eq(1000);
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(iter.done).eq(true);
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(iter.done).eq(true);

      expect(iter.reset().moveToGreaterEqual(900)).eq(iter);
      expect(iter.isDisposed).eq(false);
      expect(iter.done).eq(false);
      expect(iter.value).eq(999);
      expect(iter.next()).deep.equal({ value: 999, done: false });
      expect(iter.next()).deep.equal({ value: 1000, done: false });
      expect(iter.next()).deep.equal({ value: undefined, done: true });
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(iter.done).eq(true);

      iter.reset().moveToGreaterEqual(1001);
      expect(iter.next()).deep.equal({ value: undefined, done: true });
    });
  });

  describe("iterable", () => {
    it("allow iterating, and disposes the iterator when done", () => {
      const iter = new RoaringBitmap32Iterator(new RoaringBitmap32([123, 456, 999, 1000]));
      const arr: number[] = [];
      for (const x of iter) {
        arr.push(x);
      }
      expect(iter.done).eq(true);
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(arr).deep.equal([123, 456, 999, 1000]);

      arr.length = 0;
      for (const x of iter.reset()) {
        arr.push(x);
        if (arr.length === 2) {
          break;
        }
      }
      expect(iter.done).eq(true);
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(arr).deep.equal([123, 456]);

      const expectedError = new Error("x");
      let thrownError: unknown;
      arr.length = 0;
      try {
        for (const x of iter.reset()) {
          arr.push(x);
          if (arr.length === 2) {
            throw expectedError;
          }
        }
      } catch (e) {
        thrownError = e;
      }

      expect(iter.done).eq(true);
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      expect(arr).deep.equal([123, 456]);
      expect(thrownError).eq(expectedError);
    });

    it("allow iterating a large array", () => {
      const bitmap = new RoaringBitmap32();
      bitmap.addRange(100, 50000);
      const iter = new RoaringBitmap32Iterator(bitmap);
      const arr = new Uint32Array(bitmap.size);
      let sz = 0;
      for (const x of iter) {
        arr[sz++] = x;
      }
      expect(sz).eq(50000 - 100);
      expect(iter.done).eq(true);
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== i + 100) {
          expect(arr[i]).eq(i + 100);
        }
      }
    });

    it("allow iterating while modifying", () => {
      const bitmap = RoaringBitmap32.fromRange(100, 1000);
      const iter = new RoaringBitmap32Iterator(bitmap);
      const arr: number[] = [];
      for (const x of iter) {
        arr.push(x);
        if (!(x & 1)) {
          bitmap.remove(x + 1);
        }
      }

      expect(iter.done).eq(true);
      expect(iter.value).eq(undefined);
      expect(iter.isDisposed).eq(true);
      for (let i = 0; i < arr.length; i++) {
        const v = i * 2 + 100;
        if (arr[i] !== v) {
          expect(arr[i]).eq(v);
        }
      }

      expect(arr.length).eq(450);
    });
  });

  describe("reset, moveToGreaterEqual", () => {
    it("resets the iterator", () => {
      const bitmap = new RoaringBitmap32([123, 456, 999, 1000]);
      const iter = new RoaringBitmap32Iterator(bitmap);
      expect(iter.next()).deep.equal({ value: 123, done: false });
      expect(iter.next()).deep.equal({ value: 456, done: false });
      iter.reset();
      expect(iter.next()).deep.equal({ value: 123, done: false });
      expect(iter.next()).deep.equal({ value: 456, done: false });

      iter.reset();
      const tmp: number[] = [];
      for (const x of iter) {
        tmp.push(x);
      }
      expect(tmp).deep.equal([123, 456, 999, 1000]);

      iter.reset().moveToGreaterEqual(500);
      expect(Array.from(iter)).deep.equal([999, 1000]);

      iter.moveToGreaterEqual(0xffffffff);
      expect(Array.from(iter)).deep.equal([]);

      bitmap.add(0xffffffff);

      iter.reset().moveToGreaterEqual(0xffffffff);
      expect(Array.from(iter)).deep.equal([0xffffffff]);

      iter.reset().moveToGreaterEqual(0x100000000);
      expect(Array.from(iter)).deep.equal([]);
    });
  });

  describe("Symbol.iterator", () => {
    it("is a function", () => {
      const iter = new RoaringBitmap32Iterator();
      expect(typeof iter[Symbol.iterator]).deep.equal("function");
    });

    it("returns this", () => {
      const iter = new RoaringBitmap32Iterator();
      expect(iter[Symbol.iterator]()).eq(iter);
    });

    it("allows foreach (empty)", () => {
      const iter = new RoaringBitmap32Iterator();
      expect(iter.next()).deep.equal({ done: true, value: undefined });
    });

    it("allows foreach (small array)", () => {
      const iter = new RoaringBitmap32Iterator(new RoaringBitmap32([123, 456, 789]));
      const values = [];
      for (const x of iter) {
        values.push(x);
      }
      expect(values).deep.equal([123, 456, 789]);
    });

    it("allows Array.from", () => {
      const iter = new RoaringBitmap32Iterator(new RoaringBitmap32([123, 456, 789]));
      const values = Array.from(iter);
      expect(values).deep.equal([123, 456, 789]);
    });
  });

  describe("RoaringBitmap32 iterable", () => {
    it("returns a RoaringBitmap32Iterator", () => {
      const bitmap = new RoaringBitmap32();
      const iterator = bitmap[Symbol.iterator]();
      expect(iterator).to.be.instanceOf(RoaringBitmap32Iterator);
      expect(typeof iterator.next).eq("function");
    });

    it("returns an empty iterator for an empty bitmap", () => {
      const bitmap = new RoaringBitmap32();
      const iterator = bitmap[Symbol.iterator]();
      expect(iterator.next()).deep.equal({
        done: true,
        value: undefined,
      });
      expect(iterator.next()).deep.equal({
        done: true,
        value: undefined,
      });
    });

    it("iterates a non empty bitmap", () => {
      const bitmap = new RoaringBitmap32([0xffffffff, 3]);
      const iterator = bitmap[Symbol.iterator]();
      expect(iterator.next()).deep.equal({
        done: false,
        value: 3,
      });
      expect(iterator.next()).deep.equal({
        done: false,
        value: 0xffffffff,
      });
      expect(iterator.next()).deep.equal({
        done: true,
        value: undefined,
      });
    });
  });
});
