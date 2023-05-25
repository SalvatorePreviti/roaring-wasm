import { expect } from "chai";
import { RoaringArenaAllocator, RoaringBitmap32, RoaringUint32Array, RoaringUint8Array } from "roaring-wasm-src";

describe("RoaringArenaAllocator", () => {
  it("should start and stop an arena allocator, and should dispose only non escaped objects", () => {
    expect(RoaringArenaAllocator.current).eq(null);
    const rootAllocator = RoaringArenaAllocator.start();
    expect(rootAllocator).instanceOf(RoaringArenaAllocator);
    expect(rootAllocator.size).eq(0);
    expect(rootAllocator.escaped).eq(0);

    let counter1 = 0;
    let counter2 = 0;
    let counter3 = 0;

    const allocator = new RoaringArenaAllocator();
    expect(RoaringArenaAllocator.current).eq(rootAllocator);
    allocator.start();

    expect(RoaringArenaAllocator.current).eq(allocator);
    expect(allocator.size).eq(0);
    expect(allocator.escaped).eq(0);
    allocator.register({ dispose: () => ++counter1 === 1 });
    const ref2 = allocator.register({ dispose: () => ++counter2 === 1 });
    allocator.register({ dispose: () => ++counter3 === 1 });
    expect(allocator.size).eq(3);
    expect(allocator.escaped).eq(0);
    expect(allocator.escape(ref2)).eq(ref2);
    expect(allocator.size).eq(3);
    expect(allocator.escaped).eq(1);

    expect(allocator.stop()).eq(allocator);

    expect(RoaringArenaAllocator.current).eq(rootAllocator);

    expect(allocator.size).eq(0);
    expect(allocator.escaped).eq(1);

    expect(counter1).eq(1);
    expect(counter2).eq(0);
    expect(counter3).eq(1);

    expect(rootAllocator.register(ref2)).eq(ref2);

    expect(RoaringArenaAllocator.current).eq(rootAllocator);

    expect(rootAllocator.size).eq(1);
    rootAllocator.stop();
    expect(rootAllocator.size).eq(0);

    expect(RoaringArenaAllocator.current).eq(null);
    expect(counter1).eq(1);
    expect(counter2).eq(1);
    expect(counter3).eq(1);

    rootAllocator.stop();
    expect(RoaringArenaAllocator.current).eq(null);
    expect(counter1).eq(1);
    expect(counter2).eq(1);
    expect(counter3).eq(1);
  });

  it("should allocate a new RoaringUint8Array", () => {
    const allocator = new RoaringArenaAllocator();
    const array = allocator.newRoaringUint8Array(5);
    expect(array).instanceOf(RoaringUint8Array);
    expect(array.isDisposed).eq(false);
    allocator.stop();
    expect(array.isDisposed).eq(true);
  });

  it("should allocate a new RoaringUint32Array", () => {
    const allocator = new RoaringArenaAllocator();
    const array = allocator.newRoaringUint32Array(5);
    expect(array).instanceOf(RoaringUint32Array);
    expect(array.isDisposed).eq(false);
    allocator.stop();
    expect(array.isDisposed).eq(true);
  });

  it("should allocate a RoaringBitmap32", () => {
    const allocator = new RoaringArenaAllocator();
    const array = allocator.newRoaringBitmap32();
    expect(array).instanceOf(RoaringBitmap32);
    expect(array.isDisposed).eq(false);
    allocator.stop();
    expect(array.isDisposed).eq(true);
  });

  describe("self registration", () => {
    it("should register to current when creating a new RoaringUint8Array", () => {
      RoaringArenaAllocator.start();
      const instance = new RoaringUint8Array(2);
      expect(instance.isDisposed).eq(false);
      RoaringArenaAllocator.stop();
      expect(instance.isDisposed).eq(true);
    });

    it("should register to current when creating a new RoaringUint32Array", () => {
      RoaringArenaAllocator.start();
      const instance = new RoaringUint32Array(2);
      expect(instance.isDisposed).eq(false);
      RoaringArenaAllocator.stop();
      expect(instance.isDisposed).eq(true);
    });

    it("should register to current when creating a new RoaringBitmap32", () => {
      RoaringArenaAllocator.start();
      const instance = new RoaringBitmap32([1, 2, 3]);
      expect(instance.isDisposed).eq(false);
      RoaringArenaAllocator.stop();
      expect(instance.isDisposed).eq(true);
    });
  });
});
