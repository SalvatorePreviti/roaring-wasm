import { expect } from "chai";
import IDisposable from "idisposable";
import { RoaringBitmap32, RoaringUint32Array } from "roaring-wasm-src";

describe("RoaringBitmap32", () => {
  describe("addChecked", () => {
    it("returns false if nothing changes", () => {
      IDisposable.using(new RoaringBitmap32([123]), (bitmap) => {
        expect(bitmap.addChecked(123)).eq(false);
        expect(bitmap.cardinality()).eq(1);
      });
    });

    it("returns true if something changes", () => {
      IDisposable.using(new RoaringBitmap32([124]), (bitmap) => {
        expect(bitmap.addChecked(123)).eq(true);
        expect(bitmap.cardinality()).eq(2);
      });
    });
  });

  describe("removeChecked", () => {
    it("returns false if nothing changes", () => {
      IDisposable.using(new RoaringBitmap32([125]), (bitmap) => {
        expect(bitmap.removeChecked(123)).eq(false);
        expect(bitmap.cardinality()).eq(1);
      });
    });

    it("returns true if something changes", () => {
      IDisposable.using(new RoaringBitmap32([123]), (bitmap) => {
        expect(bitmap.removeChecked(123)).eq(true);
        expect(bitmap.cardinality()).eq(0);
      });
    });
  });

  describe("from array", () => {
    const array = [123, 189, 456, 789, 910];

    it("adds the array one by one", () => {
      IDisposable.using(new RoaringBitmap32(), (bitmap) => {
        for (const item of array) {
          bitmap.add(item);
        }
        expect(bitmap.toArray().sort()).deep.eq(array);
      });
    });

    it("adds a RoaringUint32Array", () => {
      IDisposable.using(new RoaringUint32Array(array), (buffer) => {
        IDisposable.using(new RoaringBitmap32(), (bitmap) => {
          expect(buffer.toArray()).deep.eq(array);
          bitmap.addMany(buffer);
          expect(buffer.isDisposed).eq(false);
          expect(buffer.toArray()).deep.eq(array);
          expect(bitmap.toArray().sort()).deep.eq(array);
        });
      });
    });

    it("adds a simple array", () => {
      IDisposable.using(new RoaringBitmap32(), (bitmap) => {
        bitmap.addMany(array);
        expect(bitmap.toArray().sort()).deep.eq(array);
      });
    });

    it("works in the constructor", () => {
      IDisposable.using(new RoaringBitmap32(array), (bitmap) => {
        expect(bitmap.toArray().sort()).deep.eq(array);
      });
    });
  });
});
