import { roaringWasm } from "./lib/roaring-wasm";
import { RoaringAllocatedMemory } from "./RoaringAllocatedMemory";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 */
export class RoaringUint8Array extends RoaringAllocatedMemory implements Iterable<number> {
  /**
   * The type of typed array used by this class.
   * For RoaringUint8Array is Uint8Array.
   */
  public declare static readonly TypedArray: typeof Uint8Array;

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint8Array is always 1
   */
  public declare static readonly BYTES_PER_ELEMENT: 1;

  /**
   * The type of typed array used by this class.
   * For RoaringUint8Array is Uint8Array.
   */
  public declare readonly TypedArray: typeof Uint8Array;

  /**
   * The size in bytes of each element in the array.
   * For RoaringUint8Array is always 1
   */
  public declare readonly BYTES_PER_ELEMENT: 1;

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
   * The length in bytes of the array.
   */
  public get length(): number {
    return this.byteLength;
  }

  /**
   * The length in bytes of the array.
   */
  public get size(): number {
    return this.byteLength;
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
   * The position in this.heap where the array starts.
   * Is byteOffset.
   * @see byteOffset
   * @see heap
   */
  public get heapOffset(): number {
    return this.byteOffset;
  }

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
  public constructor(
    lengthOrArray?: number | Iterable<number> | ArrayLike<number> | null | undefined,
    arenaAllocator?: RoaringArenaAllocator | null | undefined,
  ) {
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
      if (length >= 0x10000000) {
        throw new RangeError(`RoaringUint8Array too big, ${length} bytes`);
      }
      const pointer = roaringWasm._malloc(length);
      if (!pointer) {
        throw new Error(`RoaringUint8Array failed to allocate ${length} bytes`);
      }
      super(pointer, length, arenaAllocator);
      if (typeof lengthOrArray !== "number") {
        try {
          this.set(lengthOrArray as Iterable<number>);
        } catch (error) {
          this.dispose();
          throw error;
        }
      }
    } else {
      super(0, 0, arenaAllocator);
    }
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

  /**
   * The at() method takes an integer value and returns the item at that index, allowing for positive and negative integers. Negative integers count back from the last item in the array.
   * Follows the specification for array.at().
   * If the computed index is less than 0, or equal to length, undefined is returned.
   * @param index - Zero-based index of the array element to be returned, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @returns The element in the array matching the given index. Always returns undefined if index < -array.length or index >= array.length without attempting to access the corresponding property.
   */
  public at(index: number): number | undefined {
    const { length, byteOffset, heap } = this;
    if (index < 0) {
      index += length;
    }
    return index >= 0 && index < length ? heap[(byteOffset + index) >>> 0] : undefined;
  }

  /**
   * Sets the value at the given index.
   * @param index - Zero-based index of the array element to be set, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @param value - The value to set at the given index.
   * @returns True if the value was set, false if the index is out of bounds.
   */
  public setAt(index: number, value: number): boolean {
    const { length, byteOffset, heap } = this;
    if (index < 0) {
      index += length;
    }
    if (index >= 0 && index < length) {
      heap[(byteOffset + index) >>> 0] = value;
      return true;
    }
    return false;
  }
}

const _props = {
  TypedArray: { value: Uint8Array },
  BYTES_PER_ELEMENT: { value: 1 },
};

Object.defineProperties(RoaringUint8Array, _props);
Object.defineProperties(RoaringUint8Array.prototype, _props);
