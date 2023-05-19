import roaringWasm from "./lib/roaring-wasm";

/**
 * Array of unsigned 32 bit integers allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 */
class RoaringUint32Array implements Iterable<number> {
  /**
   * The type of typed array used by this class.
   * For RoaringUint32Array is Uint32Array.
   */
  public static readonly TypedArray: typeof Uint32Array = Uint32Array;

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint32Array is always 4
   */
  public static readonly BYTES_PER_ELEMENT: 4 = 4 as const;

  /**
   * The type of typed array used by this class.
   * For RoaringUint32Array is Uint32Array.
   */
  public get TypedArray(): typeof Uint32Array {
    return Uint32Array;
  }

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint32Array is always 4
   */
  public get BYTES_PER_ELEMENT(): 4 {
    return 4;
  }

  /**
   * The ArrayBuffer instance referenced by the array.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned buffer for short periods of time.
   */
  public get buffer(): ArrayBuffer {
    return roaringWasm.HEAP8.buffer;
  }

  /**
   * Returns true if this object was deallocated.
   */
  public get isDisposed(): boolean {
    return !this.byteOffset;
  }

  /**
   * The length in bytes of the array.
   * For RoaringUint32Array it is equal to this.length * 4
   */
  public get byteLength(): number {
    return this.length * 4;
  }

  /**
   * The full WASM heap in hich this array is allocated.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned array for short periods of time.
   */
  public get heap(): Uint32Array {
    return roaringWasm.HEAPU32;
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
  public constructor(lengthOrArray: number | Iterable<number>, _pointer?: number) {
    this.byteOffset = 0;
    this.length = 0;

    let length: number;
    if (typeof lengthOrArray === "number") {
      length = lengthOrArray;
    } else if (lengthOrArray !== null && typeof lengthOrArray === "object") {
      length = (lengthOrArray as unknown as ArrayLike<number>).length;
      if (typeof length !== "number") {
        const copy = new Uint32Array(lengthOrArray);
        lengthOrArray = copy;
        length = copy.length;
      }
    } else {
      throw new TypeError("Invalid argument");
    }

    if (length > 0) {
      if (_pointer === undefined) {
        _pointer = roaringWasm._malloc(length * 4);
      }
      if (!_pointer) {
        throw new Error(`RoaringUint32Array failed to allocate ${length * 4} bytes`);
      }
      this.byteOffset = _pointer;
      this.length = length;

      try {
        if ((_pointer & 3) !== 0) {
          throw new Error("RoaringUint32Array allocation failed, allocated memory is not aligned correctly");
        }
        if (typeof lengthOrArray !== "number") {
          this.set(lengthOrArray);
        }
      } catch (error) {
        this.dispose();
        throw error;
      }
    }
  }

  /**
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   *
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
      throw new TypeError("RoaringUint32Array is disposed");
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

    if (array instanceof RoaringUint32Array) {
      array = array.asTypedArray();
    }

    const length = (array as unknown as ArrayLike<unknown>).length;
    if (typeof length !== "number") {
      return this.set(new Uint32Array(array));
    }

    if (offset + length > this.length) {
      throw new TypeError(`Invalid offset ${offset}`);
    }

    this.heap.set(array as unknown as ArrayLike<number>, this.byteOffset / 4 + offset);
    return this;
  }

  /**
   * Gets a new JS typed array instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns A new typed array that shares the memory with this array.
   */
  public asTypedArray(): Uint32Array {
    return new Uint32Array(roaringWasm.HEAP8.buffer, this.byteOffset, this.length);
  }

  /**
   * Gets a new NodeJS Buffer instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns A new instance of NodeJS Buffer
   */
  public asNodeBuffer(): Buffer {
    return Buffer.from(roaringWasm.HEAP8.buffer, this.byteOffset, this.length);
  }

  /**
   * Copies the content of this buffer to a typed array.
   * The returned array is garbage collected and don't need to be disposed manually.
   *
   * @returns A new typed array that contains a copy of this buffer
   */
  public toTypedArray(): Uint32Array {
    const array = new Uint32Array(this.length);
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
    return Buffer.from(this.asNodeBuffer());
  }

  /**
   * Copies the content of this typed array into a new JS array of numbers and returns it.
   *
   * @returns A new array.
   */
  public toArray(): number[] {
    return Array.from(this.asTypedArray());
  }

  /**
   * Copies the content of this typed array into a new JS Set<number> and returns it.
   *
   * @returns A new array.
   */
  public toSet(): Set<number> {
    return new Set<number>(this.asTypedArray());
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

Object.defineProperties(RoaringUint32Array.prototype, {
  TypedArray: {
    value: Uint32Array,
    writable: false,
    configurable: false,
    enumerable: false,
  },
  BYTES_PER_ELEMENT: {
    value: 4,
    writable: false,
    configurable: false,
    enumerable: false,
  },
  size: {
    get: function getSize(this: RoaringUint32Array) {
      return this.length;
    },
    configurable: false,
    enumerable: false,
  },
  toJSON: {
    value: function arrayToJSON(this: RoaringUint32Array) {
      return this.asTypedArray();
    },
    configurable: true,
    enumerable: false,
  },
});

export default RoaringUint32Array;
