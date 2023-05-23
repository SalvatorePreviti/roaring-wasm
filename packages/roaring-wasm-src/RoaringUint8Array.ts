import { RoaringArenaAlloc } from "./RoaringArenaAlloc";
import { roaringWasm } from "./lib/roaring-wasm";

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 */
export class RoaringUint8Array implements Iterable<number> {
  /**
   * The type of typed array used by this class.
   * For RoaringUint8Array is Uint8Array.
   */
  public static readonly TypedArray: typeof Uint8Array = Uint8Array;

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint8Array is always 1
   */
  public static readonly BYTES_PER_ELEMENT: 1 = 1 as const;

  /**
   * The type of typed array used by this class.
   * For RoaringUint8Array is Uint8Array.
   */
  public get TypedArray(): typeof Uint8Array {
    return Uint8Array;
  }

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint8Array is always 1
   */
  public get BYTES_PER_ELEMENT(): 1 {
    return 1;
  }

  /**
   * The ArrayBuffer instance referenced by the array.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned buffer for short periods of time.
   */
  public get buffer(): ArrayBuffer {
    return roaringWasm.HEAPU8.buffer;
  }

  /**
   * Returns true if this object was deallocated.
   */
  public get isDisposed(): boolean {
    return !this.byteOffset;
  }

  /**
   * The length in bytes of the array.
   * For RoaringUint8Array it is equal to this.length
   */
  public get byteLength(): number {
    return this.length;
  }

  /**
   * The full WASM heap in hich this array is allocated.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned array for short periods of time.
   */
  public get heap(): Uint8Array {
    return roaringWasm.HEAPU8;
  }

  /**
   * The offset in bytes of the array (the location of the first byte in WASM memory).
   */
  public readonly byteOffset: number;

  /**
   * Number of elements allocated in this array.
   */
  public readonly length: number;

  /**
   * Allocates an array in the roaring WASM heap.
   *
   * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
   *
   * If the parameter is a number, it creates a new uninitialized array of the given length.
   * If the parameter is an Iterable, it creates a copy of the given iterable.
   *
   * @param lengthOrArray - Length of the array to allocate or the array to copy
   */
  public constructor(lengthOrArray: number | Iterable<number> | ArrayLike<number>, _pointer?: number) {
    this.byteOffset = 0;
    this.length = 0;
    RoaringArenaAlloc.register(this);

    let length: number;
    if (typeof lengthOrArray === "number") {
      length = lengthOrArray;
    } else if (lengthOrArray !== null && typeof lengthOrArray === "object") {
      length = (lengthOrArray as unknown as ArrayLike<number>).length;
      if (typeof length !== "number") {
        const copy = new Uint8Array(lengthOrArray as Iterable<number>);
        lengthOrArray = copy;
        length = copy.length;
      }
    } else {
      throw new TypeError("Invalid argument");
    }

    if (length > 0) {
      if (_pointer === undefined) {
        _pointer = roaringWasm._malloc(length);
      }
      if (!_pointer) {
        throw new Error(`RoaringUint8Array failed to allocate ${length} bytes`);
      }
      this.byteOffset = _pointer;
      this.length = length;

      if (typeof lengthOrArray !== "number") {
        try {
          this.set(lengthOrArray as Iterable<number>);
        } catch (error) {
          this.dispose();
          throw error;
        }
      }
    }
  }

  /**
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   * @returns True if memory gets freed during this call, false if not.
   */
  public dispose(): boolean {
    const ptr = this.byteOffset;
    if (ptr) {
      (this as { byteOffset: number }).byteOffset = 0;
      (this as { length: number }).length = 0;
      roaringWasm._free(ptr);
      return true;
    }
    return false;
  }

  /**
   * Throws an error if the memory was freed.
   */
  public throwIfDisposed(): void | never {
    if (this.isDisposed) {
      throw new TypeError("RoaringUint8Array is disposed");
    }
  }

  /**
   * Writes the given array at the specified position
   * @param array - A typed or untyped array of values to set.
   * @param offset - The index in the current array at which the values are to be written.
   */
  public set(array: Iterable<number>, offset: number = 0): this {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new TypeError(`Invalid offset ${offset}`);
    }

    if (array instanceof RoaringUint8Array) {
      array = array.asTypedArray();
    }

    const length = (array as unknown as ArrayLike<number>).length;
    if (typeof length !== "number") {
      return this.set(new Uint8Array(array));
    }

    if (offset + length > this.length) {
      throw new TypeError(`Invalid offset ${offset}`);
    }

    this.heap.set(array as unknown as ArrayLike<number>, this.byteOffset + offset);
    return this;
  }

  /**
   * Gets a new JS typed array instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns A new typed array that shares the memory with this array.
   */
  public asTypedArray(): Uint8Array {
    return roaringWasm.HEAPU8.subarray(this.byteOffset, this.byteOffset + this.length) as Buffer;
  }

  /**
   * Gets a new NodeJS Buffer instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns A new instance of NodeJS Buffer
   */
  public asNodeBuffer(): Buffer {
    if (typeof Buffer === "undefined") {
      return roaringWasm.HEAPU8.subarray(this.byteOffset, this.byteOffset + this.length) as Buffer;
    }
    return Buffer.from(roaringWasm.HEAPU8.buffer, this.byteOffset, this.length);
  }

  /**
   * Copies the content of this buffer to a typed array.
   * The returned array is garbage collected and don't need to be disposed manually.
   *
   * @returns A new typed array that contains a copy of this buffer
   */
  public toTypedArray(): Uint8Array {
    const array = new Uint8Array(this.length);
    array.set(this.asTypedArray());
    return array;
  }

  /**
   * Copies the content of this buffer to a NodeJS Buffer.
   * The returned buffer is garbage collected and don't need to be disposed manually.
   *
   * @returns A new instance of NodeJS Buffer that contains a copy of this buffer
   */
  public toNodeBuffer(): Buffer {
    if (typeof Buffer === "undefined") {
      return this.toTypedArray() as Buffer;
    }
    return Buffer.from(this.asNodeBuffer());
  }

  /**
   * Copies the content of this typed array into a standard JS array of numbers and returns it.
   *
   * @returns A new array.
   */
  public toArray(): number[] {
    return Array.from(this.asTypedArray());
  }

  /**
   * Returns a string representation of an array.
   */
  public toString(): string {
    return this.asTypedArray().toString();
  }

  /**
   * Iterator that iterates through all values in the array.
   */
  public [Symbol.iterator](): IterableIterator<number> {
    return this.asTypedArray()[Symbol.iterator]();
  }
}

Object.defineProperties(RoaringUint8Array.prototype, {
  TypedArray: {
    value: Uint8Array,
    writable: false,
    configurable: false,
    enumerable: false,
  },
  BYTES_PER_ELEMENT: {
    value: 1,
    writable: false,
    configurable: false,
    enumerable: false,
  },
  size: {
    get: function getSize(this: RoaringUint8Array) {
      return this.length;
    },
    configurable: false,
    enumerable: false,
  },
  toJSON: {
    value() {
      return {};
    },
    configurable: true,
    enumerable: false,
  },
});
