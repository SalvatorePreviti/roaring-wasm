import {
  DeserializationFormat,
  RoaringArenaAllocator,
  RoaringBitmap32,
  SerializationFormat,
  roaringLibraryInitialize,
} from "roaring-wasm-src";
import { expect } from "chai";

import testDataSerialized from "./data/serialized.json";

describe("RoaringBitmap32 serialization", () => {
  before(roaringLibraryInitialize);
  beforeEach(RoaringArenaAllocator.start);
  afterEach(RoaringArenaAllocator.stop);

  const data = [1, 2, 3, 4, 5, 6, 100, 101, 105, 109, 0x7fffffff, 0xfffffffe, 0xffffffff];

  describe("SerializationFormat", () => {
    it("should have the right values", () => {
      expect(SerializationFormat.croaring).eq("croaring");
      expect(SerializationFormat.portable).eq("portable");
      expect(SerializationFormat.unsafe_frozen_croaring).eq("unsafe_frozen_croaring");
      expect(SerializationFormat.uint32_array).eq("uint32_array");

      expect(Object.values(SerializationFormat)).to.deep.eq([
        "croaring",
        "portable",
        "unsafe_frozen_croaring",
        "uint32_array",
      ]);
    });
  });

  describe("DeserializationFormat", () => {
    it("should have the right values", () => {
      expect(DeserializationFormat.croaring).eq("croaring");
      expect(DeserializationFormat.portable).eq("portable");
      expect(DeserializationFormat.unsafe_frozen_croaring).eq("unsafe_frozen_croaring");
      expect(DeserializationFormat.unsafe_frozen_portable).eq("unsafe_frozen_portable");

      expect(Object.values(DeserializationFormat)).to.deep.eq([
        "croaring",
        "portable",
        "unsafe_frozen_croaring",
        "unsafe_frozen_portable",
        "uint32_array",
      ]);
    });
  });

  describe("getSerializationSizeInBytes", () => {
    it("throws if the argument is not a valid format", () => {
      const bitmap = new RoaringBitmap32(data);
      const expectedError = "Invalid serialization format";
      expect(() => bitmap.getSerializationSizeInBytes(undefined as any)).to.throw(expectedError);
      expect(() => bitmap.getSerializationSizeInBytes(null as any)).to.throw(expectedError);
      expect(() => bitmap.getSerializationSizeInBytes("foo" as any)).to.throw(expectedError);
      expect(() => bitmap.getSerializationSizeInBytes(0 as any)).to.throw(expectedError);
      expect(() => bitmap.getSerializationSizeInBytes(1 as any)).to.throw(expectedError);
    });

    it("returns standard value for empty bitmap (non portable)", () => {
      const bitmap = new RoaringBitmap32();
      expect(bitmap.getSerializationSizeInBytes(false)).eq(5);
      expect(bitmap.getSerializationSizeInBytes("croaring")).eq(5);
    });

    it("returns standard value for empty bitmap (portable)", () => {
      const bitmap = new RoaringBitmap32();
      expect(bitmap.getSerializationSizeInBytes(true)).eq(8);
      expect(bitmap.getSerializationSizeInBytes("portable")).eq(8);
    });

    it("returns a value for frozen croaring", () => {
      expect(new RoaringBitmap32([1, 2, 3]).getSerializationSizeInBytes("unsafe_frozen_croaring")).gt(0);
    });

    it("returns the correct amount of bytes (non portable)", () => {
      const bitmap = new RoaringBitmap32(data);
      expect(bitmap.getSerializationSizeInBytes(false)).eq(bitmap.serialize(false).byteLength);
      expect(bitmap.getSerializationSizeInBytes("croaring")).eq(bitmap.serialize("croaring").byteLength);
      bitmap.runOptimize();
      bitmap.shrinkToFit();
      expect(bitmap.getSerializationSizeInBytes(false)).eq(bitmap.serialize(false).byteLength);
      expect(bitmap.getSerializationSizeInBytes("croaring")).eq(bitmap.serialize("croaring").byteLength);
    });

    it("returns the correct amount of bytes (portable)", () => {
      const bitmap = new RoaringBitmap32(data);
      expect(bitmap.getSerializationSizeInBytes(true)).eq(bitmap.serialize(true).byteLength);
      bitmap.runOptimize();
      bitmap.shrinkToFit();
      expect(bitmap.getSerializationSizeInBytes(true)).eq(bitmap.serialize(true).byteLength);
    });
  });

  describe("serialize", () => {
    it("returns a Uint8Array", () => {
      expect(new RoaringBitmap32().serialize(false)).to.be.instanceOf(Uint8Array);
    });

    it("returns standard value for empty bitmap (non portable)", () => {
      const bitmap = new RoaringBitmap32();
      expect(Array.from(bitmap.serialize(false))).deep.equal([1, 0, 0, 0, 0]);
    });

    it("returns standard value for empty bitmap (portable)", () => {
      expect(Array.from(new RoaringBitmap32().serialize(true))).deep.equal([58, 48, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe("deserialize", () => {
    it("deserializes zero length buffer (non portable)", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3]);
      bitmap.deserialize(new Uint8Array([]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap.deserialize(new Uint8Array([]), "croaring");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (non portable)", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3]);
      bitmap.deserialize(new Uint8Array([1, 0, 0, 0, 0]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap.deserialize(new Uint8Array([1, 0, 0, 0, 0]), "croaring");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (non portable)", () => {
      const bitmap = new RoaringBitmap32([1, 2, 3]);
      bitmap.deserialize(new Uint8Array([1, 0, 0, 0, 0]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (portable)", () => {
      const bitmap = new RoaringBitmap32([1, 2]);
      bitmap.deserialize(new Uint8Array([58, 48, 0, 0, 0, 0, 0, 0]), true);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap.deserialize(new Uint8Array([58, 48, 0, 0, 0, 0, 0, 0]), "portable");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes zero length buffer (portable)", () => {
      const bitmap = new RoaringBitmap32([1, 2]);
      bitmap.deserialize(new Uint8Array([]), true);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap.deserialize(new Uint8Array([]), "portable");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    function _base64ToArrayBuffer(base64: string) {
      const binary_string = atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
    }

    it("is able to deserialize test data", () => {
      let total = 0;
      for (const s of testDataSerialized) {
        const bitmap = RoaringBitmap32.deserialize(_base64ToArrayBuffer(s), false);
        const size = bitmap.size;
        if (size !== 0) {
          expect(bitmap.has(bitmap.minimum())).eq(true);
          expect(bitmap.has(bitmap.maximum())).eq(true);
        }
        total += size;
      }
      expect(total).eq(68031);
    });
  });

  describe("deserialize static", () => {
    it("deserializes zero length buffer (non portable)", () => {
      let bitmap = RoaringBitmap32.deserialize(new Uint8Array([]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap = RoaringBitmap32.deserialize(new Uint8Array([]), "portable");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes zero length buffer (portable)", () => {
      let bitmap = RoaringBitmap32.deserialize(new Uint8Array([]), true);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap = RoaringBitmap32.deserialize(new Uint8Array([]), "portable");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (non portable)", () => {
      const bitmap = RoaringBitmap32.deserialize(new Uint8Array([1, 0, 0, 0, 0]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (non portable)", () => {
      const bitmap = RoaringBitmap32.deserialize(new Uint8Array([1, 0, 0, 0, 0]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (non portable)", () => {
      let bitmap = RoaringBitmap32.deserialize(new Uint8Array([1, 0, 0, 0, 0]), false);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap = RoaringBitmap32.deserialize(new Uint8Array([1, 0, 0, 0, 0]), "croaring");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });

    it("deserializes empty bitmap (portable)", () => {
      let bitmap = RoaringBitmap32.deserialize(new Uint8Array([58, 48, 0, 0, 0, 0, 0, 0]), true);
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
      bitmap = RoaringBitmap32.deserialize(new Uint8Array([58, 48, 0, 0, 0, 0, 0, 0]), "portable");
      expect(bitmap.size).eq(0);
      expect(bitmap.isEmpty).eq(true);
    });
  });

  describe("serialize, deserialize", () => {
    it("is able to serialize and deserialize data (non portable)", () => {
      const a = new RoaringBitmap32(data);
      const b = RoaringBitmap32.deserialize(a.serialize(false), false);
      expect(b.toArray()).deep.equal(data);
    });

    it("is able to serialize and deserialize data (portable)", () => {
      const a = new RoaringBitmap32(data);
      const b = RoaringBitmap32.deserialize(a.serialize(true), true);
      expect(b.toArray()).deep.equal(data);
    });
  });

  describe("serialize to buffer", () => {
    it("throws if buffer is not a valid buffer", () => {
      const bitmap = new RoaringBitmap32(data);
      expect(() => bitmap.serialize(false, {} as any)).to.throw();
      expect(() => bitmap.serialize(false, 1 as any)).to.throw();
      expect(() => bitmap.serialize(false, "test" as any)).to.throw();
      expect(() => bitmap.serialize(false, [1, 2, 3] as any)).to.throw();
    });

    it("throws if buffer is too small", () => {
      const bitmap = new RoaringBitmap32(data);
      const buffer = new Uint8Array(bitmap.getSerializationSizeInBytes(false) - 1);
      expect(() => bitmap.serialize(false, buffer)).to.throw();
    });

    it("throws if buffer is too small (portable)", () => {
      const bitmap = new RoaringBitmap32(data);
      const buffer = new Uint8Array(bitmap.getSerializationSizeInBytes(true) - 1);
      expect(() => bitmap.serialize(true, buffer)).to.throw();
    });

    it("serializes to buffer (non portable)", () => {
      const bitmap = new RoaringBitmap32(data);
      const buffer = new Uint8Array(bitmap.getSerializationSizeInBytes(false));
      expect(bitmap.serialize(false, buffer)).to.eq(buffer);
      expect(RoaringBitmap32.deserialize(buffer, false).toArray()).to.deep.eq(data);
    });

    it("serializes to buffer (portable)", () => {
      const bitmap = new RoaringBitmap32(data);
      const buffer = new Uint8Array(bitmap.getSerializationSizeInBytes(true));
      expect(bitmap.serialize(true, buffer)).to.eq(buffer);
      expect(RoaringBitmap32.deserialize(buffer, true).toArray()).to.deep.eq(data);
    });

    it("serializes to buffer (portable), inverted arguments", () => {
      const bitmap = new RoaringBitmap32(data);
      const buffer = new Uint8Array(bitmap.getSerializationSizeInBytes(true));
      expect(bitmap.serialize(buffer, true)).to.eq(buffer);
      expect(RoaringBitmap32.deserialize(buffer, true).toArray()).to.deep.eq(data);
    });

    it("handles offset correctly and deserialize correctly", () => {
      const bitmap = new RoaringBitmap32(data);
      const serlength = bitmap.getSerializationSizeInBytes(true);
      const buffer = new Uint8Array(serlength + 30);
      const serialized = bitmap.serialize("portable", new Uint8Array(buffer.buffer, 10));
      expect(Array.from(serialized)).to.deep.eq(Array.from(new Uint8Array(buffer.buffer, 10, serlength)));
      expect(RoaringBitmap32.deserialize(serialized, true).toArray()).to.deep.eq(data);
    });
  });

  it("serialize and deserialize empty bitmaps in various formats", async () => {
    for (const format of ["portable", "croaring", "unsafe_frozen_croaring", "uint32_array"] as const) {
      const serialized = new RoaringBitmap32().serialize(format);
      expect(RoaringBitmap32.deserialize(serialized, format).toArray()).to.deep.equal([]);
    }
  });

  it("serialize and deserialize in various formats", async () => {
    for (const format of ["portable", "croaring", "unsafe_frozen_croaring", "uint32_array"] as const) {
      const smallArray = [1, 2, 3, 100, 0xfffff, 0xffffffff];
      const serialized = new RoaringBitmap32(smallArray).serialize(format);
      expect(RoaringBitmap32.deserialize(serialized, format).toArray(), format).to.deep.equal(smallArray);
    }
  });
});
