import { roaringWasm } from "./lib/roaring-wasm";
import { RoaringUint32Array } from "./RoaringUint32Array";
import { RoaringUint8Array } from "./RoaringUint8Array";
import { RoaringArenaAlloc } from "./RoaringArenaAlloc";

const _clampToUint32 = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 0xffffffff) {
    return 0xffffffff;
  }
  return value >>> 0;
};

const _getPtr = (bitmap: RoaringBitmap32): number => {
  let ptr = (bitmap as unknown as { _ptr?: number | false })._ptr;

  if (!ptr) {
    if (ptr === false) {
      throw new TypeError("RoaringBitmap32 was disposed");
    }
    ptr = roaringWasm._roaring_bitmap_create_with_capacity(0);
    if (!ptr) {
      throw new Error("Failed to allocate RoaringBitmap32");
    }
    (bitmap as unknown as { _ptr?: number | null | undefined })._ptr = ptr;
  } else if (typeof ptr !== "number") {
    throw new TypeError("RoaringBitmap32 expected");
  }

  return ptr;
};

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * The roaring bitmap allocates in WASM memory, remember to dispose
 * the RoaringBitmap32 when not needed anymore to release WASM memory.
 *
 */
export class RoaringBitmap32 {
  private _ptr: number | false;

  /**
   * Creates a new roaring bitmap adding the specified values.
   *
   * The roaring bitmap allocates in WASM memory, remember to dispose
   * the RoaringBitmap32 when not needed anymore to release WASM memory.
   * @param values - The values to add
   */
  public constructor(
    values?: RoaringBitmap32 | RoaringUint32Array | Iterable<number> | ArrayLike<number> | null | undefined,
  ) {
    this._ptr = 0;

    try {
      this.addMany(values);
    } catch (error) {
      this.dispose();
      throw error;
    }

    RoaringArenaAlloc.register(this);
  }

  public static from(
    values: RoaringBitmap32 | RoaringUint32Array | Iterable<number> | ArrayLike<number> | null | undefined,
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
  public static of(...values: (number | string | null | undefined)[]): RoaringBitmap32 {
    const buf = new Uint32Array(values.length);
    let count = 0;
    for (let i = 0; i < values.length; ++i) {
      const v = values[i];
      if (v !== null && v !== undefined) {
        const n = Number(v);
        if (!isNaN(n) && n >= 0 && n < 0x100000000) {
          buf[count++] = n;
        }
      }
    }
    return new RoaringBitmap32(buf.subarray(0, count));
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
    bitmap._ptr = roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, _clampToUint32(step) || 1);
    return bitmap;
  }

  /**
   * Check whether a range of values from rangeStart (included) to rangeEnd (excluded) is present
   *
   * @param {number|undefined} rangeStart The start index (inclusive).
   * @param {number|undefined} [rangeEnd] The end index (exclusive).
   * @returns {boolean} True if the bitmap contains the whole range of values from rangeStart (included) to rangeEnd (excluded), false if not.
   * @memberof ReadonlyRoaringBitmap32
   */
  public hasRange(rangeStart: number = 0, rangeEnd: number = 0x10000000): boolean {
    return !!roaringWasm._roaring_bitmap_contains_range_js(this._ptr, rangeStart, rangeEnd);
  }

  /**
   * Gets the cardinality (number of elements) between rangeStart (included) to rangeEnd (excluded) of the bitmap.
   * Returns 0 if range is invalid or if no element was found in the given range.
   *
   * @param rangeStart - The start index (inclusive).
   * @param rangeEnd - The end index (exclusive).
   * @returns The number of elements between rangeStart (included) to rangeEnd (excluded).
   */
  public rangeCardinality(rangeStart: number = 0, rangeEnd: number = 0x10000000): number {
    return roaringWasm._roaring_bitmap_range_cardinality_js(this._ptr, rangeStart, rangeEnd);
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
    const ptr = this._ptr;
    if (ptr) {
      roaringWasm._roaring_bitmap_add_range_js(ptr, rangeStart, rangeEnd);
    } else {
      this._ptr = roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, 1);
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
    roaringWasm._roaring_bitmap_remove_range_js(this._ptr, rangeStart, rangeEnd);
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
    const ptr = this._ptr;
    if (ptr) {
      roaringWasm._roaring_bitmap_flip_range_inplace_js(ptr, rangeStart, rangeEnd);
    } else {
      this._ptr = roaringWasm._roaring_bitmap_from_range_js(rangeStart, rangeEnd, 1);
    }
    return this;
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
    const bitmap = new RoaringBitmap32();
    try {
      bitmap.deserialize(buffer, portable);
    } catch (error) {
      bitmap.dispose();
      throw error;
    }
    return bitmap;
  }

  /**
   * Utility function that serializes an array of uint32 to a new NodeJS buffer.
   * The returned buffer is automatically garbage collected.
   *
   * @param values - The values to serialize, a bitmap or an iterable of uint32 values.
   * @param portable - If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns The NodeJS buffer containing the serialized data.
   */
  public static serializeArrayToNewBuffer(
    values: RoaringUint32Array | Iterable<number>,
    portable: boolean = false,
  ): Buffer {
    const bitmap = new RoaringBitmap32(values);
    try {
      bitmap.optimize();
      return bitmap.serializeToNodeBuffer(portable);
    } finally {
      bitmap.dispose();
    }
  }

  /**
   * Utility function that deserializes a RoaringBitmap32 serialized in a buffer to an Array<number> of values.
   * The array can be very big, be careful when you use this function.
   *
   * @param buffer - The buffer to deserialize.
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns All the values in the bitmap.
   */
  public static deserializeToArray(
    buffer: RoaringUint8Array | Uint8Array | Iterable<number>,
    portable: boolean = false,
  ): number[] {
    const bitmap = new RoaringBitmap32();
    try {
      bitmap.deserialize(buffer, portable);
      return bitmap.toArray();
    } finally {
      bitmap.dispose();
    }
  }

  /**
   * Utility function that deserializes a RoaringBitmap32 serialized in a buffer to a Set<number> of values.
   * The array can be very big, be careful when you use this function.
   *
   * @param buffer - The buffer to deserialize.
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns All the values in the bitmap.
   */
  public static deserializeToSet(
    buffer: RoaringUint8Array | Uint8Array | Iterable<number>,
    portable: boolean = false,
  ): Set<number> {
    const bitmap = new RoaringBitmap32();
    try {
      bitmap.deserialize(buffer, portable);
      return bitmap.toSet();
    } finally {
      bitmap.dispose();
    }
  }

  /**
   * Returns a new bitmap that is a copy of this bitmap, same as new RoaringBitmap32(copy)
   * @returns A cloned RoaringBitmap32 instance
   */
  public clone(): RoaringBitmap32 {
    const result = new RoaringBitmap32();
    const ptr = this._ptr;
    result._ptr = ptr ? roaringWasm._roaring_bitmap_copy(ptr) : 0;
    return result;
  }

  /**
   * Clears the bitmap, removing all values.
   */
  public clear(): void {
    const ptr = this._ptr;
    if (ptr) {
      this._ptr = 0;
      roaringWasm._roaring_bitmap_free(ptr);
    }
  }

  /**
   * Overwrite the content of this bitmap with the content of another bitmap.
   * @param other - The other bitmap to copy.
   * @returns This RoaringBitmap32 instance.
   */
  public overwrite(other: RoaringBitmap32): this {
    roaringWasm._roaring_bitmap_overwrite(_getPtr(this), _getPtr(other));
    return this;
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
    result._ptr = roaringWasm._roaring_bitmap_add_offset_js(input._ptr, offset);
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
    result._ptr = roaringWasm._roaring_bitmap_flip_range_static_js(input._ptr, rangeStart, rangeEnd);
    return result;
  }

  /**
   * Returns true if this instance was disposed.
   */
  public get isDisposed(): boolean {
    return this._ptr === false;
  }

  /**
   * Disposes this object freeing all WASM memory associated to it.
   * Is safe to call this method more than once.
   */
  public dispose(): boolean {
    const ptr = this._ptr;
    if (ptr) {
      roaringWasm._roaring_bitmap_free(ptr);
      this._ptr = false;
      return true;
    }
    return false;
  }

  /**
   * Throws an exception if this object was disposed before.
   */
  public throwIfDisposed(): void | never {
    if (this._ptr === false) {
      throw new TypeError("RoaringBitmap32 was disposed");
    }
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   */
  public cardinality(): number {
    const ptr = this._ptr;
    return ptr ? roaringWasm._roaring_bitmap_get_cardinality(ptr) >>> 0 : 0;
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   */
  public get size(): number {
    const ptr = this._ptr;
    return ptr ? roaringWasm._roaring_bitmap_get_cardinality(ptr) >>> 0 : 0;
  }

  /**
   * Returns true if the bitmap has no elements.
   */
  public isEmpty(): boolean {
    const ptr = this._ptr;
    return !ptr || !!roaringWasm._roaring_bitmap_is_empty(ptr);
  }

  /**
   * Adds a 32 bit unsigned integer value.
   * Values are unique, this function does nothing if the value already exists.
   */
  public add(value: number): void {
    roaringWasm._roaring_bitmap_add(_getPtr(this), value);
  }

  /**
   * Adds a 32 bit unsigned integer value checking if the bitmap changes.
   * Use add() if you don't need to know if something changed.
   * Values are unique, this function does nothing and returns false if the value already exists.
   *
   * @param value - 32 bit unsigned integer to add in the set.
   * @returns True if the bitmap changed, false if not.
   */
  public addChecked(value: number): boolean {
    return !!roaringWasm._roaring_bitmap_add_checked(_getPtr(this), value);
  }

  /**
   * Adds multiple values.
   * Using this is faster than calling add() multiple times.
   * Inserting ordered or partially ordered arrays is faster.
   *
   * @param values - The values to add.
   */
  public addMany(
    values: RoaringBitmap32 | RoaringUint32Array | Iterable<number> | ArrayLike<number> | null | undefined,
  ): void {
    if (!values) {
      return;
    }

    const ptr = _getPtr(this);

    if (values instanceof RoaringUint32Array) {
      if (values.length > 0) {
        roaringWasm._roaring_bitmap_add_many(ptr, values.length, values.byteOffset);
      }
      return;
    }

    if (values instanceof RoaringBitmap32) {
      roaringWasm._roaring_bitmap_or_inplace(ptr, _getPtr(values));
      return;
    }

    const roaringArray = new RoaringUint32Array(values);
    try {
      if (roaringArray.length > 0) {
        roaringWasm._roaring_bitmap_add_many(ptr, roaringArray.length, roaringArray.byteOffset);
      }
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Removes a value from the set.
   * If the value does not exists, this function does nothing.
   *
   * @param value - The value to remove.
   */
  public remove(value: number): void {
    roaringWasm._roaring_bitmap_remove(_getPtr(this), value);
  }

  /**
   * Removes a value from the set checking if the bitmap changes.
   * Use remove() if you don't need to know if something changed.
   * If the value does not exists, this function does nothing and returns false.
   *
   * @param value - 32 bit unsigned integer to remove from the set.
   * @returns True if the bitmap changed, false if not.
   */
  public removeChecked(value: number): boolean {
    return !!roaringWasm._roaring_bitmap_remove_checked(_getPtr(this), value);
  }

  /**
   * Gets the minimum value stored in the bitmap.
   * If the bitmap is empty, returns 0xFFFFFFFF
   *
   * @returns The minimum 32 bit unsigned integer or 0xFFFFFFFF if empty.
   */
  public minimum(): number {
    const ptr = this._ptr;
    return ptr ? roaringWasm._roaring_bitmap_minimum(ptr) >>> 0 : 0xffffffff;
  }

  /**
   * Gets the maximum value stored in the bitmap.
   * If the bitmap is empty, returns 0.
   *
   * @returns The maximum 32 bit unsigned integer or 0 if empty.
   */
  public maximum(): number {
    const ptr = this._ptr;
    return ptr ? roaringWasm._roaring_bitmap_maximum(ptr) >>> 0 : 0;
  }

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param value - The value to look for.
   * @returns True if value exists in the set, false if not.
   */
  public contains(value: number): boolean {
    const ptr = this._ptr;
    return !!ptr && !!roaringWasm._roaring_bitmap_contains(ptr, value);
  }

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param other - the other bitmap
   * @returns true if the bitmap is subset of the other.
   */
  public isSubset(other: RoaringBitmap32): boolean {
    return !!roaringWasm._roaring_bitmap_is_subset(_getPtr(this), _getPtr(other));
  }

  /**
   * Returns true if this bitmap is strict subset of the other.
   *
   * @param other - The other bitmap
   * @returns True if this bitmap is a strict subset of other
   */
  public isStrictSubset(other: RoaringBitmap32): boolean {
    return !!roaringWasm._roaring_bitmap_is_strict_subset(_getPtr(this), _getPtr(other));
  }

  /**
   * Converts the bitmap to an array.
   * The array may be very big, use this function with caution.
   * The returned RoaringUint32Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @returns The RoaringUint32Array. Remember to manually dispose to free the memory.
   */
  public toRoaringUint32Array(): RoaringUint32Array {
    const cardinality = this.size;
    const result = new RoaringUint32Array(cardinality);
    if (cardinality > 0) {
      roaringWasm._roaring_bitmap_to_uint32_array(this._ptr as number, result.byteOffset);
    }
    return result;
  }

  /**
   * Converts the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @returns The array containing all values in the bitmap.
   */
  public toArray(): number[] {
    const roaringArray = this.toRoaringUint32Array();
    try {
      return roaringArray.toArray();
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Converts the bitmap to a JS Set<number>.
   * The resulting set may be very big, use this function with caution.
   *
   * @returns The set containing all values in the bitmap.
   */
  public toSet(): Set<number> {
    const roaringArray = this.toRoaringUint32Array();
    try {
      return new Set<number>(roaringArray.asTypedArray());
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Converts the bitmap to a JS Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @returns The array containing all values in the bitmap.
   */
  public toUint32Array(): Uint32Array {
    const roaringArray = this.toRoaringUint32Array();
    try {
      return roaringArray.toTypedArray();
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Checks wether two roaring bitmap contains the same data.
   *
   * @param other - The other bitmap.
   * @returns True if the bitmaps contains the same data, false if not.
   */
  public equals(other: RoaringBitmap32): boolean {
    if (this === other) {
      return true;
    }
    const a = this._ptr;
    if (!a) {
      return other.isEmpty();
    }
    const b = other && other._ptr;
    if (!b) {
      return this.isEmpty();
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
    return !!roaringWasm._roaring_bitmap_optimize_js(this._ptr);
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
    return roaringWasm._roaring_bitmap_select_js(this._ptr, rank);
  }

  /**
   * The at() method takes an integer value and returns the item at that index,
   * allowing for positive and negative integers. Negative integers count back from the last item in the set.
   *
   * @param index Zero-based index of the array element to be returned, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @returns The element in the set matching the given index. Always returns undefined if index < -array.length or index >= array.length without attempting to access the corresponding property.
   */
  public at(index: number): number | undefined {
    const result = roaringWasm._roaring_bitmap_at_js(this._ptr, index);
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
    return roaringWasm._roaring_bitmap_get_index_js(this._ptr, value);
  }

  /**
   * Computes the size of the intersection between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the intersection between two bitmaps.
   */
  public andCardinality(other: RoaringBitmap32): number {
    return roaringWasm._roaring_bitmap_and_cardinality(_getPtr(this), _getPtr(other)) >>> 0;
  }

  /**
   * Computes the size of the union of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the union of two bitmaps.
   */
  public orCardinality(other: RoaringBitmap32): number {
    return roaringWasm._roaring_bitmap_or_cardinality(_getPtr(this), _getPtr(other)) >>> 0;
  }

  /**
   * Computes the size of the difference (andnot) of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the difference (andnot) of two bitmaps.
   */
  public andNotCardinality(other: RoaringBitmap32): number {
    return roaringWasm._roaring_bitmap_andnot_cardinality(_getPtr(this), _getPtr(other)) >>> 0;
  }

  /**
   * Computes the size of the symmetric difference (xor) between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the symmetric difference (xor) of two bitmaps.
   */
  public xorCardinality(other: RoaringBitmap32): number {
    return roaringWasm._roaring_bitmap_xor_cardinality(_getPtr(this), _getPtr(other)) >>> 0;
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
    roaringWasm._roaring_bitmap_and_inplace(_getPtr(this), _getPtr(other));
  }

  /**
   * Adds the element of the other bitmap into this bitmap.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public orInPlace(other: RoaringBitmap32): void {
    roaringWasm._roaring_bitmap_or_inplace(_getPtr(this), _getPtr(other));
  }

  /**
   * Computes the difference between two bitmaps.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public xorInPlace(other: RoaringBitmap32): void {
    roaringWasm._roaring_bitmap_xor_inplace(_getPtr(this), _getPtr(other));
  }

  /**
   * Compute the difference between this and the provided bitmap,
   * writing the result in the current bitmap.
   * The provided bitmap is not modified.
   *
   * @param other - The other bitmap.
   */
  public andNotInPlace(other: RoaringBitmap32): void {
    roaringWasm._roaring_bitmap_andnot_inplace(_getPtr(this), _getPtr(other));
  }

  /**
   * Returns the number of integers that are smaller or equal to the given value.
   *
   * @param value - The value to rank
   * @returns The number of values smaller than the given value
   */
  public rank(value: number): number {
    const ptr = this._ptr;
    return ptr ? roaringWasm._roaring_bitmap_rank(ptr, value) >>> 0 : 0;
  }

  /**
   * Check whether the two bitmaps intersect (have at least one element in common).
   *
   * @param other - The other bitmap.
   * @returns True if the two bitmaps intersects, false if not.
   */
  public intersects(other: RoaringBitmap32): boolean {
    const a = this._ptr;
    const b = other._ptr;
    return !!(a && b && roaringWasm._roaring_bitmap_intersect(a, b));
  }

  /**
   * Check whether a bitmap and a closed range intersect.
   *
   * @param rangeStart The start of the range.
   * @param rangeEnd The end of the range.
   * @returns boolean True if the bitmap and the range intersects, false if not.
   */
  public intersectsWithRange(rangeStart: number = 0, rangeEnd: number = 0x10000000): boolean {
    return !!roaringWasm._roaring_bitmap_intersect_with_range_js(this._ptr, rangeStart, rangeEnd);
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
    return roaringWasm._roaring_bitmap_jaccard_index(_getPtr(this), _getPtr(other));
  }

  /**
   * How many bytes are required to serialize this bitmap.
   *
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   */
  public getSerializationSizeInBytes(portable: boolean = false): number {
    const ptr = _getPtr(this);
    return (
      (portable
        ? roaringWasm._roaring_bitmap_portable_size_in_bytes(ptr)
        : roaringWasm._roaring_bitmap_size_in_bytes(ptr)) >>> 0
    );
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
    const ptr = _getPtr(this);
    const size = this.getSerializationSizeInBytes(portable);
    const buf = roaringWasm._malloc(size);
    if (portable) {
      roaringWasm._roaring_bitmap_portable_serialize(ptr, buf);
    } else {
      roaringWasm._roaring_bitmap_serialize(ptr, buf);
    }
    return new RoaringUint8Array(size, buf);
  }

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param portable - If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns The Uint8Array that contains the serialized bitmap
   */
  public serializeToUint8Array(portable: boolean = false): Uint8Array {
    const roaringArray = this.serializeToRoaringUint8Array(portable);
    try {
      return roaringArray.toTypedArray();
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Serializes a bitmap to a NodeJS buffer.
   * The returned buffer is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param portable - If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns The NodeJS Buffer that contains the serialized bitmap
   */
  public serializeToNodeBuffer(portable: boolean = false): Buffer {
    const roaringArray = this.serializeToRoaringUint8Array(portable);
    try {
      return roaringArray.toNodeBuffer();
    } finally {
      roaringArray.dispose();
    }
  }

  /**
   * Reads a bitmap from a serialized version.
   * Throws an error if deserialization failed.
   *
   * @param buffer - The buffer to deserialize
   * @param portable - If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   */
  public deserialize(buffer: RoaringUint8Array | Uint8Array | Iterable<number>, portable: boolean = false): void {
    if (!(buffer instanceof RoaringUint8Array)) {
      if (typeof buffer === "number") {
        throw new TypeError("deserialize expects an array of bytes");
      }
      const roaringArray = new RoaringUint8Array(buffer);
      try {
        this.deserialize(roaringArray);
      } finally {
        roaringArray.dispose();
      }
      return;
    }

    const ptr = portable
      ? roaringWasm._roaring_bitmap_portable_deserialize(buffer.byteOffset)
      : roaringWasm._roaring_bitmap_deserialize(buffer.byteOffset);

    if (!ptr) {
      throw new Error(`RoaringBitmap32 deserialization failed`);
    }

    this._ptr = ptr;
  }

  /**
   * Remove run-length encoding even when it is more space efficient.
   *
   * Return whether a change was applied.
   *
   * @returns True if a change was applied, false if not.
   */
  public removeRunCompression(): boolean {
    const ptr = this._ptr;
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
    const ptr = this._ptr;
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
    return roaringWasm._roaring_bitmap_shrink_to_fit_js(this._ptr);
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
    const pa = _getPtr(a);
    const pb = _getPtr(b);
    const result = new RoaringBitmap32();
    result._ptr = roaringWasm._roaring_bitmap_and(pa, pb) >>> 0;
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
    const pa = _getPtr(a);
    const pb = _getPtr(b);
    const result = new RoaringBitmap32();
    result._ptr = roaringWasm._roaring_bitmap_or(pa, pb);
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
    const pa = _getPtr(a);
    const pb = _getPtr(b);
    const result = new RoaringBitmap32();
    result._ptr = roaringWasm._roaring_bitmap_xor(pa, pb);
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
    const pa = _getPtr(a);
    const pb = _getPtr(b);
    const result = new RoaringBitmap32();
    result._ptr = roaringWasm._roaring_bitmap_andnot(pa, pb);
    return result;
  }

  /**
   * Performs a union between all the given array of RoaringBitmap32 instances.
   *
   * This function is faster than calling or multiple times.
   *
   * @param bitmaps - An array of RoaringBitmap32 instances to or together.
   * @returns A new RoaringBitmap32 that contains the union of all the given bitmaps.
   */
  public static orMany(bitmaps: readonly RoaringBitmap32[]): RoaringBitmap32 {
    const len = bitmaps.length;
    const result = new RoaringBitmap32();
    if (len) {
      const ptrs = new RoaringUint32Array(len);
      try {
        const buf = ptrs.asTypedArray();
        let count = 0;
        for (let i = 0; i < len; ++i) {
          const ptr = bitmaps[i]._ptr;
          if (ptr) {
            buf[count++] = ptr;
          }
        }
        if (count) {
          result._ptr = roaringWasm._roaring_bitmap_or_many(count, ptrs.byteOffset);
        }
      } finally {
        ptrs.dispose();
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
  public static xorMany(bitmaps: readonly RoaringBitmap32[]): RoaringBitmap32 {
    const len = bitmaps.length;
    const result = new RoaringBitmap32();
    if (len) {
      const ptrs = new RoaringUint32Array(len);
      try {
        const buf = ptrs.asTypedArray();
        let count = 0;
        for (let i = 0; i < len; ++i) {
          const ptr = bitmaps[i]._ptr;
          if (ptr) {
            buf[count++] = ptr;
          }
        }
        if (count) {
          result._ptr = roaringWasm._roaring_bitmap_xor_many(count, ptrs.byteOffset);
        }
      } finally {
        ptrs.dispose();
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
    if (a !== b) {
      const aptr = a._ptr;
      const bptr = b._ptr;
      a._ptr = bptr;
      b._ptr = aptr;
    }
  }
}
