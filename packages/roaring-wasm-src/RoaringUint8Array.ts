import type { IDisposable } from "./IDisposable";
import { _free_finalizationRegistry, _free_finalizationRegistry_init } from "./lib/free-finalization-registry";
import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: to release memory as soon as possible, you are responsible to free the allocated memory calling "dispose" method.
 */
export class RoaringUint8Array implements IDisposable {
  #p: number;
  #size: number;
  #alloc: RoaringArenaAllocator | null;

  /**
   * The length in bytes of the array.
   * For RoaringUint8Array it is equal to this.length
   */
  public get byteLength(): number {
    return this.#size;
  }

  /**
   * Returns true if this object was deallocated.
   */
  public get isDisposed(): boolean {
    return !this.#p;
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
    lengthOrArray: number | Iterable<number> | ArrayLike<number> | null | undefined = 0,
    arenaAllocator: RoaringArenaAllocator | null | undefined = _roaringArenaAllocator_head,
  ) {
    this.#p = 0;
    this.#size = 0;
    this.#alloc = arenaAllocator;

    if (lengthOrArray) {
      let length: number;
      if (typeof lengthOrArray === "number") {
        length = Math.ceil(lengthOrArray);
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
        length = Math.ceil(length);
        if (length >= 0x10000000) {
          throw new RangeError(`RoaringUint8Array too big, ${length} bytes`);
        }
        const pointer = roaringWasm._jsalloc_zero(length) >>> 0;
        if (!pointer) {
          throw new Error(`RoaringUint8Array failed to allocate ${length} bytes`);
        }

        this.#p = pointer;
        this.#size = length;

        const finalizationRegistry = _free_finalizationRegistry || _free_finalizationRegistry_init();
        if (finalizationRegistry) {
          finalizationRegistry.register(this, pointer, this);
        }
        if (arenaAllocator) {
          arenaAllocator.register(this);
        }

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
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   * @returns True if memory gets freed during this call, false if not.
   */
  public dispose(): boolean {
    const ptr = this.#p;
    if (ptr) {
      this.#p = 0;
      this.#size = 0;

      const allocator = this.#alloc;
      if (allocator) {
        this.#alloc = null;
        allocator.unregister(this);
      }
      if (_free_finalizationRegistry) {
        _free_finalizationRegistry.unregister(this);
      }
      roaringWasm._free(ptr);
      return true;
    }
    return false;
  }

  /**
   * Decreases the size of the allocated memory.
   * It does nothing if the new length is greater or equal to the current length.
   * If the new length is less than 1, it disposes the allocated memory.
   * NOTE: if the value is non zero, this does not reallocate the consumed memory, it just chances the reported size in byteLength and length properties.
   * @param newLength - The new length in bytes.
   * @returns True if the memory was shrunk, false if not.
   */
  public shrink(newLength: number): boolean {
    if (Number.isNaN(newLength)) {
      return false;
    }
    if (newLength < 1) {
      return this.dispose();
    }
    if (newLength >= this.#size) {
      return false;
    }
    this.#size = newLength >>> 0;
    return true;
  }

  /**
   * Writes the given array at the specified position
   * @param array - A typed or untyped array of values to set.
   * @param offset - The index in the current array at which the values are to be written.
   */
  public set(array: ArrayLike<number> | Iterable<number>, offset: number = 0): this {
    if ((array as ArrayLike<number>).length) {
      this.asTypedArray().set(array as ArrayLike<number>, offset);
    } else {
      let typedArray: Uint8Array | undefined;
      for (const value of array as Iterable<number>) {
        (typedArray || (typedArray = this.asTypedArray()))[offset++] = value;
      }
    }
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
    const ptr = this.#p;
    return roaringWasm.HEAPU8.subarray(ptr, ptr + this.#size);
  }

  /**
   * Copies the content of this buffer to a typed array and returns it
   *
   * @param output - The typed array to copy to. If not provided, a new typed array is created.
   * @returns A typed array with the content of this buffer. It could be smaller than the buffer if the output array is smaller.
   */
  public toTypedArray(output?: Uint8Array): Uint8Array {
    const ptr = this.#p;
    const size = this.#size;
    if (!output) {
      return roaringWasm.HEAPU8.slice(ptr, ptr + size);
    }
    let outlen = output.length;
    if (outlen > size) {
      outlen = size;
      output = output.subarray(0, size);
    }
    output.set(roaringWasm.HEAPU8.subarray(ptr, ptr + outlen));
    return output;
  }

  /**
   * Returns a string representation of an array.
   */
  public toString(): string {
    return this.asTypedArray().toString();
  }

  /**
   * The at() method takes an integer value and returns the item at that index, allowing for positive and negative integers. Negative integers count back from the last item in the array.
   * Follows the specification for array.at().
   * If the computed index is less than 0, or equal to length, undefined is returned.
   * @param index - Zero-based index of the array element to be returned, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @returns The element in the array matching the given index. Always returns undefined if index < -array.length or index >= array.length without attempting to access the corresponding property.
   */
  public at(index: number): number | undefined {
    const ptr = this.#p;
    const length = this.#size;
    if (index < 0) {
      index += length;
    }
    return ptr && index >= 0 && index < length ? roaringWasm.HEAPU8[(ptr + index) >>> 0] : undefined;
  }

  /**
   * Sets the value at the given index.
   * @param index - Zero-based index of the array element to be set, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @param value - The value to set at the given index.
   * @returns True if the value was set, false if the index is out of bounds.
   */
  public setAt(index: number, value: number): boolean {
    const ptr = this.#p;
    const length = this.#size;
    if (index < 0) {
      index += length;
    }
    if (ptr && index >= 0 && index < length) {
      roaringWasm.HEAPU8[(ptr + index) >>> 0] = value;
      return true;
    }
    return false;
  }

  /**
   * Internal property, do not use.
   * @internal
   */
  get _p(): number {
    return this.#p;
  }
}
