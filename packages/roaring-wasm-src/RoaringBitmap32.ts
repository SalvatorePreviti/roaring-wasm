import type { IDisposable } from "./IDisposable";
import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import type { NullablePtr } from "./lib/roaring-wasm";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";
import { RoaringBitmap32Iterator } from "./RoaringBitmap32Iterator";
import { RoaringUint8Array } from "./RoaringUint8Array";
import type { BasicTypedArray } from "./utils";

const isView = /* @__PURE__ */ ArrayBuffer.isView;

export const MAX_STRING_LENGTH = 536870888;

// NOTE! this must match the value in roaring-js.c
const SYNC_TMP_BUF_SIZE = 65536 * 15;

let _finalizationRegistry: FinalizationRegistry<number> | undefined;

const _throwFrozen = (): never => {
  throw new TypeError("RoaringBitmap32 is frozen");
};

export interface RoaringBitmap32 {
  /**
   * Removes a value from the set checking if the bitmap changes.
   * Use remove() if you don't need to know if something changed.
   * If the value does not exists, this function does nothing and returns false.
   *
   * Alias to delete.
   *
   * @param value - 32 bit unsigned integer to remove from the set.
   * @returns True if the bitmap changed, false if not.
   * @throws If the bitmap is frozen.
   */
  remove(value: number): boolean;

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param value - The value to look for.
   * @returns True if value exists in the set, false if not.
   */
  includes(value: unknown): boolean;

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param value - The value to look for.
   * @returns True if value exists in the set, false if not.
   */
  contains(value: unknown): boolean;
}

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * The roaring bitmap allocates in WASM memory, remember to dispose
 * the RoaringBitmap32 when not needed anymore to release WASM memory.
 *
 */
export class RoaringBitmap32 implements IDisposable, Iterable<number> {
  #p: NullablePtr;
  #v: number;
  #size: number;
  #frozen: 0 | 1;
  #alloc: RoaringArenaAllocator | null;

  public static from(
    values:
      | RoaringBitmap32
      | BasicTypedArray
      | Iterable<number | null | undefined | false | string>
      | readonly (number | null | undefined | false | string)[]
      | null
      | undefined,
  ): RoaringBitmap32 {
    return new RoaringBitmap32(values);
  }

  /**
   * The RoaringBitmap32.of() static method creates a new Array instance from a variable number of arguments, regardless of number or type of the arguments.
   * Note that is faster to pass a Uint32Array instance instead of an array or an iterable.
   *
   * @static
   * @param values A set of values to add to the new RoaringBitmap32 instance.
   * @returns A new RoaringBitmap32 instance.
   */
  public static of(...values: (number | string | null | false | undefined)[]): RoaringBitmap32 {
    return new RoaringBitmap32(values);
  }

  /**
   * Creates a new bitmap that contains all the values in the interval: [rangeStart, rangeEnd).
   * Is possible to specify the step parameter to have a non contiguous range.
   *
   * @static
   * @param rangeStart The start index. Trimmed to 0.
   * @param rangeEnd The end index. Trimmed to 4294967296.
   * @param step The increment step, defaults to 1.
   * @returns A new RoaringBitmap32 instance.
   */
  public static fromRange(rangeStart: number = 0, rangeEnd: number = 0x100000000, step: number = 1): RoaringBitmap32 {
    const bitmap = new RoaringBitmap32();
    bitmap.#setPtr(roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, step));
    return bitmap;
  }

  /**
   * addOffset adds the value 'offset' to each and every value in a bitmap, generating a new bitmap in the process.
   * If offset + element is outside of the range [0,2^32), that the element will be dropped.
   *
   * @param input - The input bitmap.
   * @param offset - The offset to add to each element. Can be positive or negative.
   * @returns A new bitmap with the offset added to each element.
   */
  public static addOffset(input: RoaringBitmap32, offset: number): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_add_offset_js(input.#p, offset));
    return result;
  }

  /**
   * Creates a new bitmap with the content of the input bitmap but with given range of values flipped.
   * @param input The input bitmap, it will not be modified
   * @param rangeStart The start index (inclusive).
   * @param rangeEnd The end index (exclusive).
   * @returns A new copied bitmap with the range flipped.
   */
  public static flipRange(input: RoaringBitmap32, rangeStart: number, rangeEnd: number): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_flip_range_static_js(input.#p, rangeStart, rangeEnd));
    return result;
  }

  /**
   * Creates a new roaring bitmap deserializing it from a buffer
   *
   * The roaring bitmap allocates in WASM memory, remember to dispose
   * the RoaringBitmap32 when not needed anymore to release WASM memory.
   *
   * @param buffer - The buffer to deserialize
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns The reulting bitmap. Remember to dispose the instance when finished using it.
   */
  public static deserialize(
    buffer: RoaringUint8Array | Uint8Array | Iterable<number>,
    portable: boolean = false,
  ): RoaringBitmap32 {
    if (!(buffer instanceof RoaringUint8Array)) {
      const roaringArray = new RoaringUint8Array(buffer);
      try {
        return this.deserialize(roaringArray);
      } finally {
        roaringArray.dispose();
      }
    }

    const bitmap = new RoaringBitmap32();

    const ptr = portable
      ? roaringWasm._roaring_bitmap_portable_deserialize_safe(buffer._p, buffer.byteLength)
      : roaringWasm._roaring_bitmap_deserialize_safe(buffer._p, buffer.byteLength);

    if (!ptr) {
      throw new Error(`RoaringBitmap32 deserialization failed`);
    }

    bitmap.#setPtr(ptr);
    return bitmap;
  }

  /**
   * How many bytes are required to serialize this bitmap.
   *
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   */
  public getSerializationSizeInBytes(portable: boolean = false): number {
    const ptr = this.#p || this.#createEmpty();
    return (
      (portable
        ? roaringWasm._roaring_bitmap_portable_size_in_bytes(ptr)
        : roaringWasm._roaring_bitmap_size_in_bytes(ptr)) >>> 0
    );
  }

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param portable - If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns The Uint8Array that contains the serialized bitmap
   */
  public serialize(portable: boolean = false): Uint8Array {
    const roaringArray = this.serializeToRoaringUint8Array(portable);
    try {
      return roaringArray.toTypedArray();
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Serializes a bitmap to a byte buffer allocated in WASM memory.
   *
   * The returned RoaringUint8Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @param portable - If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns The RoaringUint8Array. Remember to manually dispose to free the memory.
   */
  public serializeToRoaringUint8Array(portable: boolean = false): RoaringUint8Array {
    const ptr = this.#p || this.#createEmpty();
    const size = this.getSerializationSizeInBytes(portable);
    const result = new RoaringUint8Array(size);
    if (size) {
      if (portable) {
        roaringWasm._roaring_bitmap_portable_serialize(ptr, result._p);
      } else {
        roaringWasm._roaring_bitmap_serialize(ptr, result._p);
      }
    }
    return result;
  }

  /**
   * Makes this roaring bitmap readonly.
   * Sets isFrozen to true.
   * This is a no-op if isFrozen is already true.
   * Every attempt to modify the bitmap will throw an exception.
   * A frozen bitmap cannot be unfrozen, but it can be disposed.
   */
  public freeze(): this {
    if (!this.#frozen) {
      this.#frozen = 1;
    }
    return this;
  }

  /**
   * Creates a new roaring bitmap adding the specified values.
   *
   * The roaring bitmap allocates in WASM memory, remember to dispose
   * the RoaringBitmap32 when not needed anymore to release WASM memory.
   * @param values - The values to add
   */
  public constructor(
    valuesOrCapacity?:
      | RoaringBitmap32
      | BasicTypedArray
      | Iterable<number | null | undefined | false | string>
      | readonly (number | null | undefined | false | string)[]
      | number
      | null
      | undefined,
    arenaAllocator: RoaringArenaAllocator | null = _roaringArenaAllocator_head,
  ) {
    this.#p = 0;
    this.#size = 0;
    this.#v = 1;
    this.#frozen = 0;
    this.#alloc = arenaAllocator;

    if (arenaAllocator) {
      arenaAllocator.register(this);
    }

    if (valuesOrCapacity) {
      if (typeof valuesOrCapacity === "number") {
        if (valuesOrCapacity >= 1 && valuesOrCapacity < 0x100000000) {
          this.#setPtr(roaringWasm._roaring_bitmap_create_with_capacity(valuesOrCapacity >>> 0));
        }
      } else {
        try {
          this.addMany(valuesOrCapacity);
        } catch (error) {
          this.dispose();
          throw error;
        }
      }
    }
  }

  /**
   * A number that changes every time the bitmap might have changed.
   * Do not make assumptions about the value of this property, it is not guaranteed to be sequential.
   * The value might change after some operations also if the content of the bitmap does not change, because it would be too expensive to check if the content changed.
   * This property is useful to check if the bitmap changed since the last time you checked it.
   */
  public get v(): number {
    return this.#v;
  }

  /**
   * Returns true if this instance was disposed.
   * A disposed bitmap cannot be used anymore.
   */
  public get isDisposed(): boolean {
    return this.#p === false;
  }

  /**
   * Property. True if the bitmap is read-only.
   * A read-only bitmap cannot be modified, every operation will throw an error.
   * You can freeze a bitmap using the freeze() method.
   * A bitmap cannot be unfrozen.
   */
  public get isFrozen(): boolean {
    return !!this.#frozen;
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   */
  public get size(): number {
    let size = this.#size;
    if (size < 0) {
      size = roaringWasm._roaring_bitmap_get_cardinality_js(this.#p);
      this.#size = size;
    }
    return size;
  }

  /**
   * Returns true if the bitmap has no elements.
   */
  public get isEmpty(): boolean {
    const sz = this.#size;
    if (sz === 0) {
      return true;
    }
    const ptr = this.#p;
    if (ptr && !roaringWasm._roaring_bitmap_is_empty(ptr)) {
      return false;
    }
    this.#size = 0;
    return true;
  }

  [Symbol.iterator](): RoaringBitmap32Iterator {
    return new RoaringBitmap32Iterator(this);
  }

  /**
   * Disposes this object freeing all WASM memory associated to it.
   * Is safe to call this method more than once.
   */
  public dispose(): boolean {
    if (this.#p === false) {
      return false;
    }
    this.#setPtr(false);
    const allocator = this.#alloc;
    if (allocator) {
      this.#alloc = null;
      allocator.unregister(this);
    }
    return true;
  }

  /**
   * Throws an exception if this object was disposed before.
   */
  public throwIfDisposed(): void | never {
    if (this.#p === false) {
      throw new TypeError("RoaringBitmap32 was disposed");
    }
  }

  /**
   * Clears the bitmap, removing all values.
   */
  public clear(): void {
    if (this.#frozen) {
      _throwFrozen();
    }
    this.#setPtr(0);
  }

  /**
   * Returns a new bitmap that is a copy of this bitmap, same as new RoaringBitmap32(copy)
   * @returns A cloned RoaringBitmap32 instance
   */
  public clone(): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    const ptr = this.#p;
    if (ptr) {
      result.#setPtr(roaringWasm._roaring_bitmap_copy(ptr));
    }
    return result;
  }

  /**
   * Check whether a range of values from rangeStart (included) to rangeEnd (excluded) is present
   *
   * @param {number|undefined} rangeStart The start index (inclusive).
   * @param {number|undefined} [rangeEnd] The end index (exclusive).
   * @returns {boolean} True if the bitmap contains the whole range of values from rangeStart (included) to rangeEnd (excluded), false if not.
   * @memberof ReadonlyRoaringBitmap32
   */
  public hasRange(rangeStart: number = 0, rangeEnd: number = 0x100000000): boolean {
    return !!roaringWasm._roaring_bitmap_contains_range_js(this.#p, rangeStart, rangeEnd);
  }

  /**
   * Gets the cardinality (number of elements) between rangeStart (included) to rangeEnd (excluded) of the bitmap.
   * Returns 0 if range is invalid or if no element was found in the given range.
   *
   * @param rangeStart - The start index (inclusive).
   * @param rangeEnd - The end index (exclusive).
   * @returns The number of elements between rangeStart (included) to rangeEnd (excluded).
   */
  public rangeCardinality(rangeStart: number = 0, rangeEnd: number = 0x100000000): number {
    return roaringWasm._roaring_bitmap_range_cardinality_js(this.#p, rangeStart, rangeEnd);
  }

  /**
   * Adds all the values in the interval: [rangeStart, rangeEnd).
   *
   * First element is included, last element is excluded.
   * The number of added values is rangeEnd - rangeStart.
   *
   * Areas outside the range are passed through unchanged.
   *
   * @param rangeStart - The start index. Trimmed to 0.
   * @param rangeEnd - The end index. Trimmed to 4294967296.
   * @returns This RoaringBitmap32 instance.
   */
  public addRange(rangeStart: number = 0, rangeEnd: number = 0x100000000): this {
    const ptr = this.#p;
    if (this.#frozen) {
      _throwFrozen();
    }
    if (ptr) {
      if (roaringWasm._roaring_bitmap_add_range_js(ptr, rangeStart, rangeEnd)) {
        this.invalidate();
      }
    } else {
      this.#setPtr(roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, 1));
    }
    return this;
  }

  /**
   * Removes all the values in the interval: [rangeStart, rangeEnd).
   *
   * First element is included, last element is excluded.
   * The number of renived values is rangeEnd - rangeStart.
   *
   * Areas outside the range are passed through unchanged.
   * @param rangeStart - The start index. Trimmed to 0.
   * @param rangeEnd - The end index. Trimmed to 4294967296.
   * @returns This RoaringBitmap32 instance.
   * @memberof RoaringBitmap32
   */
  public removeRange(rangeStart: number = 0, rangeEnd: number = 0x100000000): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    if (roaringWasm._roaring_bitmap_remove_range_js(this.#p, rangeStart, rangeEnd)) {
      this.invalidate();
    }
    return this;
  }

  /**
   * Negates (in place) the roaring bitmap within a specified interval: [rangeStart, rangeEnd).
   *
   * First element is included, last element is excluded.
   * The number of negated values is rangeEnd - rangeStart.
   *
   * Areas outside the range are passed through unchanged.
   *
   * @param {number|undefined} rangeStart The start index. Trimmed to 0.
   * @param {number|undefined} [rangeEnd] The end index. Trimmed to 4294967296.
   * @returns {this} This RoaringBitmap32 instance.
   * @memberof RoaringBitmap32
   */
  public flipRange(rangeStart: number = 0, rangeEnd: number = 0x100000000): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    if (ptr) {
      if (roaringWasm._roaring_bitmap_flip_range_inplace_js(ptr, rangeStart, rangeEnd)) {
        this.invalidate();
      }
    } else {
      this.#setPtr(roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, 1));
    }
    return this;
  }

  /**
   * Overwrite the content of this bitmap with the content of another bitmap.
   * @param other - The other bitmap to copy.
   * @returns This RoaringBitmap32 instance.
   */
  public overwrite(other: RoaringBitmap32): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    if (this !== other) {
      const otherPtr = other.#p;
      if (!otherPtr) {
        this.clear();
      } else {
        const thisPtr = this.#p;
        if (thisPtr) {
          roaringWasm._roaring_bitmap_overwrite(thisPtr, otherPtr);
          this.invalidate();
        } else {
          this.#setPtr(roaringWasm._roaring_bitmap_copy(otherPtr));
        }
        this.#size = other.#size;
      }
    }
    return this;
  }

  /**
   * Adds a 32 bit unsigned integer value.
   * Values are unique, this function does nothing if the value already exists.
   *
   * @param value - 32 bit unsigned integer to add in the set.
   * @returns This RoaringBitmap32 instance.
   * @throws If the bitmap is frozen.
   */
  public add(value: number): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    if (roaringWasm._roaring_bitmap_add_checked(this.#p || this.#createEmpty(), value)) {
      this.invalidate();
    }
    return this;
  }

  /**
   * Adds a 32 bit unsigned integer value checking if the bitmap changes.
   * Use add() if you don't need to know if something changed.
   * Values are unique, this function does nothing and returns false if the value already exists.
   *
   * @param value - 32 bit unsigned integer to add in the set.
   * @returns True if the bitmap changed, false if not.
   * @throws If the bitmap is frozen.
   */
  public tryAdd(value: number): boolean {
    if (this.#frozen) {
      _throwFrozen();
    }
    if (roaringWasm._roaring_bitmap_add_checked(this.#p || this.#createEmpty(), value)) {
      this.invalidate();
      return true;
    }
    return false;
  }

  /**
   * Adds multiple values.
   * Using this is faster than calling add() multiple times.
   * Inserting ordered or partially ordered arrays is faster.
   *
   * @param values - The values to add.
   */
  public addMany(
    values:
      | RoaringBitmap32
      | BasicTypedArray
      | Iterable<number | null | undefined | false | string>
      | readonly (number | null | undefined | false | string)[]
      | null
      | undefined,
  ): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    if (values) {
      if (values instanceof RoaringBitmap32) {
        this.orInPlace(values);
      } else if (isView(values) && (values as Uint32Array).BYTES_PER_ELEMENT > 0) {
        this.#addTypedArray(values);
      } else {
        this.#addIterable(values as Iterable<number | null | undefined | false | string>);
      }
    }
    return this;
  }

  public removeMany(
    values:
      | RoaringBitmap32
      | BasicTypedArray
      | Iterable<number | null | undefined | false | string>
      | readonly (number | null | undefined | false | string)[]
      | null
      | undefined,
  ): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    const p = this.#p;
    if (p && values) {
      if (values instanceof RoaringBitmap32) {
        this.andNotInPlace(values);
      } else if (isView(values) && (values as Uint32Array).BYTES_PER_ELEMENT > 0) {
        this.#removeTypedArray(values);
      } else {
        this.#removeIterable(values as Iterable<number | null | undefined | false | string>);
      }
    }
    return this;
  }

  /**
   * Removes a value from the set checking if the bitmap changes.
   * Use remove() if you don't need to know if something changed.
   * If the value does not exists, this function does nothing and returns false.
   *
   * @param value - 32 bit unsigned integer to remove from the set.
   * @returns True if the bitmap changed, false if not.
   * @throws If the bitmap is frozen.
   */
  public delete(value: number): boolean {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    if (ptr && roaringWasm._roaring_bitmap_remove_checked(ptr, value)) {
      this.invalidate();
      return true;
    }
    return false;
  }

  /**
   * The pop() method removes the last element from a roaring bitmap and returns that element.
   * This method changes the size of the bitmap
   * @returns The last element in the bitmap, or undefined if the bitmap is empty.
   */
  public pop(): number | undefined {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    if (ptr) {
      const value = roaringWasm._roaring_bitmap_maximum(ptr);
      if (roaringWasm._roaring_bitmap_remove_checked(ptr, value)) {
        this.invalidate();
        return value;
      }
    }
    return undefined;
  }

  /**
   * The shift() method removes the first element from a roaring bitmap and returns that element.
   * This method changes the size of the bitmap
   * @returns {number | undefined} The first element in the bitmap, or undefined if the bitmap is empty.
   * @memberof RoaringBitmap32
   */
  public shift(): number | undefined {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    if (ptr) {
      const value = roaringWasm._roaring_bitmap_minimum(ptr);
      if (roaringWasm._roaring_bitmap_remove_checked(ptr, value)) {
        this.invalidate();
        return value;
      }
    }
    return undefined;
  }

  /**
   * Gets the minimum value stored in the bitmap.
   * If the bitmap is empty, returns 0xFFFFFFFF
   *
   * @returns The minimum 32 bit unsigned integer or 0xFFFFFFFF if empty.
   */
  public minimum(): number {
    const ptr = this.#p;
    return ptr ? roaringWasm._roaring_bitmap_minimum(ptr) >>> 0 : 0xffffffff;
  }

  /**
   * Gets the maximum value stored in the bitmap.
   * If the bitmap is empty, returns 0.
   *
   * @returns The maximum 32 bit unsigned integer or 0 if empty.
   */
  public maximum(): number {
    const ptr = this.#p;
    return ptr ? roaringWasm._roaring_bitmap_maximum(ptr) >>> 0 : 0;
  }

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param value - The value to look for.
   * @returns True if value exists in the set, false if not.
   */
  public has(value: unknown): boolean {
    return !!roaringWasm._roaring_bitmap_has_js(this.#p, value as number);
  }

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param other - the other bitmap
   * @returns true if the bitmap is subset of the other.
   */
  public isSubset(other: RoaringBitmap32): boolean {
    const a = this.#p;
    const b = other.#p;
    return !a || !!(b && roaringWasm._roaring_bitmap_is_subset(a, b));
  }

  /**
   * Returns true if this bitmap is strict subset of the other.
   *
   * @param other - The other bitmap
   * @returns True if this bitmap is a strict subset of other
   */
  public isStrictSubset(other: RoaringBitmap32): boolean {
    const a = this.#p;
    const b = other.#p;
    return !!(a && b && roaringWasm._roaring_bitmap_is_strict_subset(a, b));
  }

  /**
   * Converts the bitmap to a JS Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param output - The output Uint32Array. If not specified, a new array is created.
   * If the output array is too small, only the first values that fit are written.
   * If the output array is too big, the remaining values are left untouched and a new subarray is returned.
   * If is a number, a new array of the specified size is created.
   * @param maxLength - The optional maximum number of values to read from the bitmap and write in the array.
   * @returns The Uint32Array containing all values in the bitmap.
   */
  public toUint32Array(output: Uint32Array | number = new Uint32Array(this.size)): Uint32Array {
    if (typeof output === "number") {
      output = new Uint32Array(output);
    }
    const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
    const mem = roaringWasm._roaring_sync_iter_init(this.#p, output.length) >>> 2;
    for (let written = 0; ; ) {
      const n = _roaring_sync_iter_next();
      if (n < SYNC_TMP_BUF_SIZE) {
        if (n > 0) {
          output.set(HEAPU32.subarray(mem, mem + n), written);
          written += n;
        }
        return written < output.length ? output.subarray(0, written) : output;
      }
      output.set(HEAPU32.subarray(mem, mem + n), written);
      written += n;
    }
  }

  /**
   * Converts the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @returns The array containing all values in the bitmap.
   */
  public toArray(): number[];

  /**
   * Converts the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param maxLength - The maximum length of the output array.
   * @returns The array containing all values in the bitmap.
   */
  public toArray(maxLength: number): number[];

  /**
   * Append all items in the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param output - The output array. If not specified, a new array is created.
   * @param maxLength - The optional maximum number of values to read from the bitmap and push in the array.
   * @returns The array containing all values in the bitmap.
   */
  public toArray(output: number[], maxLength?: number | undefined): number[];

  public toArray(output: number[] | number = [], maxLength: number = 0x100000000): number[] {
    if (typeof output === "number") {
      maxLength = output;
      output = [];
    }
    const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
    const mem = roaringWasm._roaring_sync_iter_init(this.#p, maxLength) >>> 2;
    for (;;) {
      const n = _roaring_sync_iter_next();
      for (let i = 0; i < n; ++i) {
        output.push(HEAPU32[mem + i]);
      }
      if (n < SYNC_TMP_BUF_SIZE) {
        return output;
      }
    }
  }

  /**
   * Converts the bitmap to a JS Set<number>.
   * The resulting set may be very big, use this function with caution.
   *
   * @param output - The output Set. If not specified, a new Set is created.
   * @param maxLength - The optional maximum number of values to read from the bitmap and add in the set.
   * @returns The set containing all values in the bitmap.
   */
  public toSet(output: Set<number> = new Set(), maxLength: number = 0x100000000): Set<number> {
    if (typeof output === "number") {
      maxLength = output;
      output = new Set();
    }
    const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
    const mem = roaringWasm._roaring_sync_iter_init(this.#p, maxLength) >>> 2;
    for (;;) {
      const n = _roaring_sync_iter_next();
      for (let i = 0; i < n; ++i) {
        output.add(HEAPU32[mem + i]);
      }
      if (n < SYNC_TMP_BUF_SIZE) {
        return output;
      }
    }
  }

  /**
   * Converts the bitmap to a string in the format "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param sepatator - The optional separator to use between values, defaults to ",".
   * @param maxStringLength - The optional approximate maximum number of characters the output string can contain.
   */
  public join(sepatator = ",", maxStringLength = MAX_STRING_LENGTH): string {
    const mem = roaringWasm._roaring_sync_iter_init(this.#p, (maxStringLength + sepatator.length) * 10) >>> 2;
    const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
    let result = "";
    let isFirst = true;
    for (;;) {
      const n = _roaring_sync_iter_next();
      for (let i = 0; i < n; ++i) {
        let s: string;
        if (isFirst) {
          isFirst = false;
          s = HEAPU32[mem + i].toString();
        } else {
          s = sepatator + HEAPU32[mem + i];
        }
        if (result.length + s.length > maxStringLength) {
          return result;
        }
        result += s;
      }
      if (n < SYNC_TMP_BUF_SIZE) {
        return result;
      }
    }
  }

  /**
   * Converts a range of the bitmap to a Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given range in the bitmap.
   */
  public rangeUint32Array(
    minimumValue: number = 0,
    maximumValue: number = 0x100000000,
    output?: Uint32Array,
  ): Uint32Array {
    let range = roaringWasm._roaring_bitmap_range_cardinality_js(this.#p, minimumValue, maximumValue);
    if (!output) {
      output = new Uint32Array(range);
    } else if (output.length < range) {
      range = output.length;
    }
    let written = 0;
    if (range > 0) {
      const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
      const mem = roaringWasm._roaring_sync_iter_init(this.#p, range) >>> 2;
      for (let n = roaringWasm._roaring_sync_iter_min(minimumValue); n > 0; ) {
        output.set(HEAPU32.subarray(mem, mem + n), written);
        written += n;
        if (n < SYNC_TMP_BUF_SIZE) {
          break;
        }
        n = _roaring_sync_iter_next();
      }
    }
    return written < output.length ? output.subarray(0, written) : output;
  }

  /**
   * Converts a range of the bitmap to an JS Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given range in the bitmap.
   */
  public rangeArray(minimumValue: number = 0, maximumValue: number = 0x100000000, output: number[] = []): number[] {
    const range = roaringWasm._roaring_bitmap_range_cardinality_js(this.#p, minimumValue, maximumValue);
    if (range > 0) {
      const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
      const mem = roaringWasm._roaring_sync_iter_init(this.#p, range) >>> 2;
      for (let n = roaringWasm._roaring_sync_iter_min(minimumValue); n > 0; ) {
        for (let i = 0; i < n; ++i) {
          output.push(HEAPU32[mem + i]);
        }
        if (n < SYNC_TMP_BUF_SIZE) {
          break;
        }
        n = _roaring_sync_iter_next();
      }
    }
    return output;
  }

  /**
   * Converts a range of the bitmap to a Set.
   * The resulting set may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output set. If not specified, a new set is created.
   * @returns The set containing all values within the given range in the bitmap.
   */
  public rangeSet(
    minimumValue: number = 0,
    maximumValue: number = 0x100000000,
    output: Set<number> = new Set(),
  ): Set<number> {
    const range = roaringWasm._roaring_bitmap_range_cardinality_js(this.#p, minimumValue, maximumValue);
    if (range > 0) {
      const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
      const mem = roaringWasm._roaring_sync_iter_init(this.#p, range) >>> 2;
      for (let n = roaringWasm._roaring_sync_iter_min(minimumValue); n > 0; ) {
        for (let i = 0; i < n; ++i) {
          output.add(HEAPU32[mem + i]);
        }
        if (n < SYNC_TMP_BUF_SIZE) {
          break;
        }
        n = _roaring_sync_iter_next();
      }
    }
    return output;
  }

  /**
   * Converts a range of the bitmap to a string in the form "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param separator - The separator to use between values. Defaults to ",".
   * @returns The string containing all values within the given range in the bitmap.
   */
  public rangeJoin(minimumValue: number = 0, maximumValue: number = 0x100000000, separator: string = ","): string {
    const range = roaringWasm._roaring_bitmap_range_cardinality_js(this.#p, minimumValue, maximumValue);
    let result = "";
    if (range > 0) {
      const { _roaring_sync_iter_next, HEAPU32 } = roaringWasm;
      const mem = roaringWasm._roaring_sync_iter_init(this.#p, range) >>> 2;
      let isFirst = true;
      for (let n = roaringWasm._roaring_sync_iter_min(minimumValue); n > 0; ) {
        if (isFirst) {
          isFirst = false;
        } else {
          result += separator;
        }
        result += HEAPU32[mem];
        for (let i = 1; i < n; ++i) {
          result += separator + HEAPU32[mem + i];
        }
        if (n < SYNC_TMP_BUF_SIZE) {
          break;
        }
        n = _roaring_sync_iter_next();
      }
    }
    return result;
  }

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given slice in the bitmap.
   */
  public sliceUint32Array(start: number = 0, end: number = 0x100000000, output?: Uint32Array | undefined): Uint32Array {
    const min = roaringWasm._roaring_bitmap_at_js(this.#p, start);
    let max = roaringWasm._roaring_bitmap_at_js(this.#p, end);
    if (max < 0) {
      max = 0x100000000;
    }
    return this.rangeUint32Array(min < 0 ? max : min, max, output);
  }

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a number array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given slice in the bitmap.
   */
  public sliceArray(start: number = 0, end: number = 0x100000000, output?: number[] | undefined): number[] {
    const min = roaringWasm._roaring_bitmap_at_js(this.#p, start);
    let max = roaringWasm._roaring_bitmap_at_js(this.#p, end);
    if (max < 0) {
      max = 0x100000000;
    }
    return this.rangeArray(min < 0 ? max : min, max, output);
  }

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a Set.
   * The resulting set may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output set. If not specified, a new set is created.
   * @returns The set containing all values within the given slice in the bitmap.
   */
  public sliceSet(start: number = 0, end: number = 0x100000000, output?: Set<number> | undefined): Set<number> {
    const min = roaringWasm._roaring_bitmap_at_js(this.#p, start);
    let max = roaringWasm._roaring_bitmap_at_js(this.#p, end);
    if (max < 0) {
      max = 0x100000000;
    }
    return this.rangeSet(min < 0 ? max : min, max, output);
  }

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a string in the form "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param separator - The separator to use between values. Defaults to ",".
   * @returns The string containing all values within the given slice in the bitmap.
   */
  public sliceJoin(start: number = 0, end: number = 0x100000000, separator?: string | undefined): string {
    const min = roaringWasm._roaring_bitmap_at_js(this.#p, start);
    let max = roaringWasm._roaring_bitmap_at_js(this.#p, end);
    if (max < 0) {
      max = 0x100000000;
    }
    return this.rangeJoin(min < 0 ? max : min, max, separator);
  }

  /**
   * Checks wether two roaring bitmap contains the same data.
   *
   * @param other - The other bitmap.
   * @returns True if the bitmaps contains the same data, false if not.
   */
  public isEqual(other: RoaringBitmap32): boolean {
    if (this === other) {
      return true;
    }
    const a = this.#p;
    if (!a) {
      return other.isEmpty;
    }
    const b = other && other.#p;
    if (!b) {
      return this.isEmpty;
    }
    return !!roaringWasm._roaring_bitmap_equals(a, b);
  }

  /**
   * Optimizes the bitmap releasing unused memory and compressing containers.
   * Returns true if something changed.
   *
   * @returns True if something changed.
   */
  public optimize(): boolean {
    if (this.#frozen) {
      _throwFrozen();
    }
    return !!roaringWasm._roaring_bitmap_optimize_js(this.#p);
  }

  /**
   * If the size of the roaring bitmap is strictly greater than rank, then
   * this function returns the element of given rank.
   * Otherwise, it returns NaN.
   *
   * @param rank - Element rank
   * @returns element or NaN
   */
  public select(rank: number): number {
    if (rank < 0) {
      rank = this.size + rank;
    }
    return roaringWasm._roaring_bitmap_select_js(this.#p, rank);
  }

  /**
   * The at() method takes an integer value and returns the item at that index,
   * allowing for positive and negative integers. Negative integers count back from the last item in the set.
   *
   * @param index Zero-based index of the array element to be returned, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @returns The element in the set matching the given index. Always returns undefined if index < -array.length or index >= array.length without attempting to access the corresponding property.
   */
  public at(index: number): number | undefined {
    const result = roaringWasm._roaring_bitmap_at_js(this.#p, index);
    return result >= 0 ? result : undefined;
  }

  /**
   * Finds the index of the nth set element.
   * Returns -1 if not found.
   *
   * @param value - Element value
   * @returns element index or -1 if not found
   */
  public indexOf(value: number): number {
    return roaringWasm._roaring_bitmap_get_index_js(this.#p, value);
  }

  /**
   * Computes the size of the intersection between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the intersection between two bitmaps.
   */
  public andCardinality(other: RoaringBitmap32): number {
    const a = this.#p;
    const b = other.#p;
    return a && b ? (a === b ? this.size : roaringWasm._roaring_bitmap_and_cardinality(a, b) >>> 0) : 0;
  }

  /**
   * Computes the size of the union of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the union of two bitmaps.
   */
  public orCardinality(other: RoaringBitmap32): number {
    const a = this.#p;
    const b = other.#p;
    return !b || a === b ? this.size : !a ? other.size : roaringWasm._roaring_bitmap_or_cardinality(a, b) >>> 0;
  }

  /**
   * Computes the size of the difference (andnot) of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the difference (andnot) of two bitmaps.
   */
  public andNotCardinality(other: RoaringBitmap32): number {
    const a = this.#p;
    return a ? roaringWasm._roaring_bitmap_andnot_cardinality(a, other.#p || other.#createEmpty()) >>> 0 : 0;
  }

  /**
   * Computes the size of the symmetric difference (xor) between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the symmetric difference (xor) of two bitmaps.
   */
  public xorCardinality(other: RoaringBitmap32): number {
    const a = this.#p;
    const b = other.#p;
    return !a ? other.size : !b ? this.size : roaringWasm._roaring_bitmap_xor_cardinality(a, b) >>> 0;
  }

  /**
   * Intersects this bitmap with another.
   * Removes the elements from this bitmap that don't exists in the other.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public andInPlace(other: RoaringBitmap32): void {
    if (this.#frozen) {
      _throwFrozen();
    }
    const a = this.#p;
    if (a) {
      const b = other.#p;
      if (a !== b) {
        if (!b) {
          this.clear();
        } else {
          roaringWasm._roaring_bitmap_and_inplace(a, b);
          this.invalidate();
        }
      }
    }
  }

  /**
   * Adds the element of the other bitmap into this bitmap.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public orInPlace(other: RoaringBitmap32): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    const a = this.#p;
    const b = other.#p;
    if (a) {
      if (b && a !== b) {
        roaringWasm._roaring_bitmap_or_inplace(a, b);
        this.invalidate();
      }
    } else if (b) {
      this.overwrite(other);
    }
    return this;
  }

  /**
   * Computes the difference between two bitmaps.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public xorInPlace(other: RoaringBitmap32): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    const a = this.#p;
    const b = other.#p;
    if (a) {
      if (b) {
        if (a === b) {
          this.clear();
        } else {
          roaringWasm._roaring_bitmap_xor_inplace(a, b);
          this.invalidate();
        }
      }
    } else if (b) {
      this.overwrite(other);
    }
    return this;
  }

  /**
   * Compute the difference between this and the provided bitmap,
   * writing the result in the current bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public andNotInPlace(other: RoaringBitmap32): this {
    if (this.#frozen) {
      _throwFrozen();
    }
    const a = this.#p;
    if (a) {
      roaringWasm._roaring_bitmap_andnot_inplace(a, other.#p || other.#createEmpty());
      this.invalidate();
    }
    return this;
  }

  /**
   * Returns the number of integers that are smaller or equal to the given value.
   *
   * @param value - The value to rank
   * @returns The number of values smaller than the given value
   */
  public rank(value: number): number {
    const ptr = this.#p;
    return ptr ? roaringWasm._roaring_bitmap_rank(ptr, value) >>> 0 : 0;
  }

  /**
   * Check whether the two bitmaps intersect (have at least one element in common).
   *
   * @param other - The other bitmap.
   * @returns True if the two bitmaps intersects, false if not.
   */
  public intersects(other: RoaringBitmap32): boolean {
    const a = this.#p;
    const b = other.#p;
    return !!(a && b && roaringWasm._roaring_bitmap_intersect(a, b));
  }

  /**
   * Check whether a bitmap and a closed range intersect.
   *
   * @param rangeStart The start of the range.
   * @param rangeEnd The end of the range.
   * @returns boolean True if the bitmap and the range intersects, false if not.
   */
  public intersectsWithRange(rangeStart: number = 0, rangeEnd: number = 0x100000000): boolean {
    return !!roaringWasm._roaring_bitmap_intersect_with_range_js(this.#p, rangeStart, rangeEnd);
  }

  /**
   * Computes the Jaccard index between two bitmaps.
   * (Also known as the Tanimoto distance, or the Jaccard similarity coefficient)
   * See https://en.wikipedia.org/wiki/Jaccard_index
   *
   * The Jaccard index is undefined if both bitmaps are empty.
   *
   * @returns The Jaccard index
   */
  public jaccardIndex(other: RoaringBitmap32): number {
    return roaringWasm._roaring_bitmap_jaccard_index_js(this.#p, other.#p);
  }

  /**
   * Remove run-length encoding even when it is more space efficient.
   *
   * Return whether a change was applied.
   *
   * @returns True if a change was applied, false if not.
   */
  public removeRunCompression(): boolean {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    return !!ptr && !!roaringWasm._roaring_bitmap_remove_run_compression(ptr);
  }

  /**
   * Convert array and bitmap containers to run containers when it is more efficient;
   * also convert from run containers when more space efficient.
   *
   * Returns true if the bitmap has at least one run container.
   *
   * Additional savings might be possible by calling shrinkToFit().
   *
   * @returns True if the bitmap has at least one run container.
   */
  public runOptimize(): boolean {
    if (this.#frozen) {
      _throwFrozen();
    }
    const ptr = this.#p;
    return !!ptr && !!roaringWasm._roaring_bitmap_run_optimize(ptr);
  }

  /**
   * If needed, reallocate memory to shrink the memory usage.
   *
   * Returns the number of bytes saved.
   *
   * @returns The number of bytes saved.
   */
  public shrinkToFit(): number {
    if (this.#frozen) {
      _throwFrozen();
    }
    return roaringWasm._roaring_bitmap_shrink_to_fit_js(this.#p);
  }

  /**
   * Returns a new RoaringBitmap32 with the intersection (and) between the given two bitmaps.
   *
   * The provided bitmaps are not modified.
   *
   * @param a - The first RoaringBitmap32 instance to and.
   * @param b - The second RoaringBitmap32 instance to and.
   * @returns A new RoaringBitmap32 that contains the intersection a AND b
   */
  public static and(a: RoaringBitmap32, b: RoaringBitmap32): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_and_js(a.#p, b.#p));
    return result;
  }

  /**
   * Returns a new RoaringBitmap32 with the union (or) of the two given bitmaps.
   *
   * The provided bitmaps are not modified.
   *
   * @param a The first RoaringBitmap32 instance to or.
   * @param b The second RoaringBitmap32 instance to or.
   */
  public static or(a: RoaringBitmap32, b: RoaringBitmap32): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_or_js(a.#p, b.#p));
    return result;
  }

  /**
   * Returns a new RoaringBitmap32 with the symmetric union (xor) between the two given bitmaps.
   *
   * The provided bitmaps are not modified.
   *
   * @param a The first RoaringBitmap32 instance to xor.
   * @param b The second RoaringBitmap32 instance to xor.
   */
  public static xor(a: RoaringBitmap32, b: RoaringBitmap32): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_xor_js(a.#p, b.#p));
    return result;
  }

  /**
   * Returns a new RoaringBitmap32 with the difference (and not) between the two given bitmaps.
   *
   * The provided bitmaps are not modified.
   *
   * @static
   * @param a The first RoaringBitmap32 instance.
   * @param b The second RoaringBitmap32 instance.
   */
  public static andNot(a: RoaringBitmap32, b: RoaringBitmap32): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    result.#setPtr(roaringWasm._roaring_bitmap_andnot_js(a.#p, b.#p));
    return result;
  }

  /**
   * Performs a union between all the given array of RoaringBitmap32 instances.
   *
   * This function is faster than calling or multiple times.
   * In some circumstances orManyHeap is faster than orMany.
   *
   * @param bitmaps - An array of RoaringBitmap32 instances to or together.
   * @returns A new RoaringBitmap32 that contains the union of all the given bitmaps.
   */
  public static orMany(bitmaps: readonly (RoaringBitmap32 | null | undefined | false)[]): RoaringBitmap32 {
    const len = bitmaps.length;
    const result = new RoaringBitmap32();
    if (len > 0) {
      const mem = roaringWasm._jsalloc_unsafe(len << 2);
      try {
        const count = this.#orManyPtrs(mem, len, bitmaps);
        if (count) {
          result.#setPtr(roaringWasm._roaring_bitmap_or_many(count, mem));
        }
      } finally {
        roaringWasm._free(mem);
      }
    }
    return result;
  }

  /**
   * Performs a union between all the given array of RoaringBitmap32 instances.
   *
   * This function is faster than calling or multiple times.
   * In some circumstances orManyHeap is faster than orMany.
   *
   * @param bitmaps - An array of RoaringBitmap32 instances to or together.
   * @returns A new RoaringBitmap32 that contains the union of all the given bitmaps.
   */
  public static orManyHeap(bitmaps: readonly (RoaringBitmap32 | null | undefined | false)[]): RoaringBitmap32 {
    const len = bitmaps.length;
    const result = new RoaringBitmap32();
    if (len > 0) {
      const mem = roaringWasm._jsalloc_unsafe(len << 2);
      try {
        const count = this.#orManyPtrs(mem, len, bitmaps);
        if (count) {
          result.#setPtr(roaringWasm._roaring_bitmap_or_many_heap(count, mem));
        }
      } finally {
        roaringWasm._free(mem);
      }
    }
    return result;
  }

  /**
   * Performs a xor between all the given array of RoaringBitmap32 instances.
   *
   * This function is faster than calling xor multiple times.
   *
   * @param bitmaps - An array of RoaringBitmap32 instances to or together.
   * @returns A new RoaringBitmap32 that contains the xor of all the given bitmaps.
   */
  public static xorMany(bitmaps: readonly (RoaringBitmap32 | null | undefined | false)[]): RoaringBitmap32 {
    const len = bitmaps.length;
    const result = new RoaringBitmap32();
    if (len > 0) {
      const mem = roaringWasm._jsalloc_unsafe(len << 2);
      try {
        const p = mem >>> 2;
        const ptrArray = roaringWasm.HEAPU32.subarray(p, p + len * 4);
        let count = 0;
        for (let i = 0; i < len; ++i) {
          const v = bitmaps[i];
          if (v) {
            const ptr = v.#p || v.#createEmpty();
            if (ptr) {
              ptrArray[count++] = ptr;
            }
          }
        }
        if (count) {
          result.#setPtr(roaringWasm._roaring_bitmap_xor_many(count, mem));
        }
      } finally {
        roaringWasm._free(mem);
      }
    }
    return result;
  }

  /**
   * Swaps the content of two RoaringBitmap32 instances.
   *
   * @static
   * @param {RoaringBitmap32} a First RoaringBitmap32 instance to swap
   * @param {RoaringBitmap32} b Second RoaringBitmap32 instance to swap
   * @memberof RoaringBitmap32
   */
  public static swap(a: RoaringBitmap32, b: RoaringBitmap32): void {
    if (a.#v < 0 || b.#v < 0) {
      _throwFrozen();
    }
    if (a !== b) {
      const aptr = a.#p;
      const bptr = b.#p;

      if (aptr === false) {
        a.throwIfDisposed();
      }
      if (bptr === false) {
        b.throwIfDisposed();
      }

      if (_finalizationRegistry) {
        _finalizationRegistry.unregister(a);
        _finalizationRegistry.unregister(b);
      }

      const asz = a.#size;
      const bsz = b.#size;

      a.#p = 0;
      b.#p = 0;

      a.#setPtr(bptr);
      b.#setPtr(aptr);

      a.#size = bsz;
      b.#size = asz;
    }
  }

  /** This method is called after the bitmap is modified */
  protected invalidate(): void {
    this.#size = -1;
    ++this.#v;
  }

  #setPtr(newPtr: NullablePtr): void {
    const oldPtr = this.#p;
    if (oldPtr !== newPtr) {
      if (oldPtr) {
        if (_finalizationRegistry) {
          _finalizationRegistry.unregister(this);
        }
        roaringWasm._roaring_bitmap_free(oldPtr);
      }
      this.#p = newPtr;
      if (newPtr) {
        if (_finalizationRegistry) {
          _finalizationRegistry.register(this, newPtr, this);
        } else if (typeof FinalizationRegistry !== "undefined") {
          _finalizationRegistry = new FinalizationRegistry(roaringWasm._roaring_bitmap_free);
          _finalizationRegistry.register(this, newPtr, this);
        }
      }
      if (oldPtr || newPtr) {
        this.invalidate();
      }
    }
  }

  #createEmpty(): number {
    let ptr = this.#p;
    if (ptr === false) {
      throw new TypeError("RoaringBitmap32 was disposed");
    }
    ptr = roaringWasm._roaring_bitmap_create_js();
    if (!ptr) {
      throw new Error("Failed to allocate RoaringBitmap32");
    }
    if (_finalizationRegistry) {
      _finalizationRegistry.register(this, ptr, this);
    } else if (typeof FinalizationRegistry !== "undefined") {
      _finalizationRegistry = new FinalizationRegistry(roaringWasm._roaring_bitmap_free);
      _finalizationRegistry.register(this, ptr, this);
    }
    this.#p = ptr;
    this.#size = 0;
    return ptr;
  }

  #addTypedArray(values: BasicTypedArray): void {
    const len = values.length;
    if (len > 0) {
      const mem = roaringWasm._roaring_sync_bulk_add_init(this.#p || this.#createEmpty()) >>> 2;
      if (mem !== 0) {
        const { HEAPU32, _roaring_sync_bulk_add_chunk } = roaringWasm;
        if (len <= SYNC_TMP_BUF_SIZE) {
          HEAPU32.set(values, mem);
          _roaring_sync_bulk_add_chunk(len);
        } else {
          for (let readOffset = 0; ; ) {
            let readSize = len - readOffset;
            if (readSize > SYNC_TMP_BUF_SIZE) {
              readSize = SYNC_TMP_BUF_SIZE;
            }
            const readEnd = readOffset + readSize;
            HEAPU32.set(values.subarray(readOffset, readEnd), mem);
            _roaring_sync_bulk_add_chunk(readSize);
            if (readEnd >= len) {
              break;
            }
            readOffset = readEnd;
          }
        }
        this.invalidate();
      }
    }
  }

  #addIterable(values: Iterable<number | null | undefined | false | string>): void {
    const mem = roaringWasm._roaring_sync_bulk_add_init(this.#p || this.#createEmpty()) >>> 2;
    if (mem !== 0) {
      const { HEAPU32, _roaring_sync_bulk_add_chunk } = roaringWasm;
      let changed = false;
      let n = 0;
      for (let value of values) {
        if (value !== null && value !== undefined && value !== false && value !== "") {
          value = Number(value);
          if (value > -1 && value < 0x100000000) {
            HEAPU32[mem + n++] = value;
            if (n === SYNC_TMP_BUF_SIZE) {
              _roaring_sync_bulk_add_chunk(n);
              n = 0;
              changed = true;
            }
          }
        }
      }
      if (n > 0) {
        _roaring_sync_bulk_add_chunk(n);
        changed = true;
      }
      if (changed) {
        this.invalidate();
      }
    }
  }

  #removeTypedArray(values: BasicTypedArray): void {
    const len = values.length;
    if (len > 0) {
      const mem = roaringWasm._roaring_sync_bulk_remove_init(this.#p) >>> 2;
      const { HEAPU32, _roaring_sync_bulk_remove_chunk } = roaringWasm;
      if (len <= SYNC_TMP_BUF_SIZE) {
        HEAPU32.set(values, mem);
        _roaring_sync_bulk_remove_chunk(len);
      } else {
        for (let readOffset = 0; ; ) {
          let readSize = len - readOffset;
          if (readSize > SYNC_TMP_BUF_SIZE) {
            readSize = SYNC_TMP_BUF_SIZE;
          }
          const readEnd = readOffset + readSize;
          HEAPU32.set(values.subarray(readOffset, readEnd), mem);
          _roaring_sync_bulk_remove_chunk(readSize);
          if (readEnd >= len) {
            break;
          }
          readOffset = readEnd;
        }
      }
      this.invalidate();
    }
  }

  #removeIterable(values: Iterable<number | null | undefined | false | string>): void {
    const mem = roaringWasm._roaring_sync_bulk_remove_init(this.#p) >>> 2;
    const { HEAPU32, _roaring_sync_bulk_remove_chunk } = roaringWasm;
    let changed = false;
    let n = 0;
    for (let value of values) {
      if (value !== null && value !== undefined && value !== false && value !== "") {
        value = Number(value);
        if (value > -1 && value < 0x100000000) {
          HEAPU32[mem + n++] = value;
          if (n === SYNC_TMP_BUF_SIZE) {
            _roaring_sync_bulk_remove_chunk(n);
            n = 0;
            changed = true;
          }
        }
      }
    }
    if (n > 0) {
      _roaring_sync_bulk_remove_chunk(n);
      changed = true;
    }
    if (changed) {
      this.invalidate();
    }
  }

  static #orManyPtrs(
    mem: number,
    len: number,
    bitmaps: readonly (false | RoaringBitmap32 | null | undefined)[],
  ): number {
    const p = mem >>> 2;
    const ptrArray = roaringWasm.HEAPU32.subarray(p, p + len * 4);
    let count = 0;
    for (let i = 0; i < len; ++i) {
      const v = bitmaps[i];
      if (v) {
        const ptr = v.#p;
        if (ptr) {
          ptrArray[count++] = ptr;
        }
      }
    }
    return count;
  }

  /**
   * Internal property, do not use.
   * @internal
   */
  get _p(): number | false {
    return this.#p;
  }
}

const proto = RoaringBitmap32.prototype;
proto.remove = proto.delete;
proto.contains = proto.has;
proto.includes = proto.has;
