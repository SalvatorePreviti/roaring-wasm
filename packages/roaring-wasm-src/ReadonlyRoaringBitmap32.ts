import type { RoaringBitmap32 } from "./RoaringBitmap32";
import type { RoaringBitmap32Iterator } from "./RoaringBitmap32Iterator";
import type { RoaringUint8Array } from "./RoaringUint8Array";
import type { SerializationFormatType } from "./enums";

export interface ReadonlyRoaringBitmap32 {
  /**
   * The number of values in the set.
   * Alias to this.size
   */
  get length(): number;

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

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param format - The serialization format.
   * @returns The Uint8Array that contains the serialized bitmap
   */
  serialize(format: SerializationFormatType): Uint8Array;

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param format - The serialization format.
   * @param output - The output that will contain the serialized bitmap. If not provided, a new array is created.
   * @returns The Uint8Array that contains the serialized bitmap
   */
  serialize<TOutput extends Uint8Array | RoaringUint8Array | typeof RoaringUint8Array = Uint8Array>(
    format: SerializationFormatType,
    output: TOutput,
  ): TOutput extends RoaringUint8Array
    ? RoaringUint8Array
    : TOutput extends typeof RoaringUint8Array
      ? RoaringUint8Array
      : Uint8Array;

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param output - The Uint8Array that will contain the serialized bitmap.
   * @param format - The serialization format.
   * @returns The Uint8Array that contains the serialized bitmap
   */
  serialize<TOutput extends Uint8Array | RoaringUint8Array = Uint8Array>(
    output: TOutput,
    format: SerializationFormatType,
  ): TOutput extends RoaringUint8Array ? RoaringUint8Array : Uint8Array;

  /**
   * Serializes a bitmap to a byte buffer allocated in WASM memory.
   *
   * The returned RoaringUint8Array is allocated in WASM memory and not garbage collected,
   * it should to be freed manually calling dispose() as soon as possible.
   *
   * @param format - The serialization format.
   * @returns The RoaringUint8Array, a buffer allocated in WASM memory.
   */
  serializeToRoaringUint8Array(format: SerializationFormatType, output?: RoaringUint8Array): RoaringUint8Array;

  /**
   * A number that changes every time the bitmap might have changed.
   * Do not make assumptions about the value of this property, it is not guaranteed to be sequential.
   * The value might change after some operations also if the content of the bitmap does not change, because it would be too expensive to check if the content changed.
   * This property is useful to check if the bitmap changed since the last time you checked it.
   */
  get v(): number;

  /**
   * Returns true if this instance was disposed.
   * A disposed bitmap cannot be used anymore.
   */
  get isDisposed(): boolean;

  /**
   * Property. True if the bitmap is read-only.
   * A read-only bitmap cannot be modified, every operation will throw an error.
   * You can freeze a bitmap using the freeze() method.
   * A bitmap cannot be unfrozen.
   */
  get isFrozen(): boolean;

  /**
   * Get the cardinality of the bitmap (number of elements).
   */
  get size(): number;

  /**
   * Returns true if the bitmap has no elements.
   */
  get isEmpty(): boolean;

  [Symbol.iterator](): RoaringBitmap32Iterator;

  /**
   * Throws an exception if this object was disposed before.
   */
  throwIfDisposed(): void | never;

  /**
   * Returns a new bitmap that is a copy of this bitmap, same as new ReadonlyRoaringBitmap32(copy)
   * @returns A cloned RoaringBitmap32 instance
   */
  clone(): RoaringBitmap32;

  /**
   * Check whether a range of values from rangeStart (included) to rangeEnd (excluded) is present
   *
   * @param rangeStart - The start value (inclusive).
   * @param rangeEnd - The end value (exclusive).
   * @returns True if the bitmap contains the whole range of values from rangeStart (included) to rangeEnd (excluded), false if not.
   * @memberof ReadonlyRoaringBitmap32
   */
  hasRange(rangeStart?: number | undefined, rangeEnd?: number | undefined): boolean;

  /**
   * Gets the cardinality (number of elements) between rangeStart (included) to rangeEnd (excluded) of the bitmap.
   * Returns 0 if range is invalid or if no element was found in the given range.
   *
   * @param rangeStart - The start value (inclusive).
   * @param rangeEnd - The end value (exclusive).
   * @returns The number of elements between rangeStart (included) to rangeEnd (excluded).
   */
  rangeCardinality(rangeStart?: number | undefined, rangeEnd?: number | undefined): number;

  /**
   * Gets the minimum value stored in the bitmap.
   * If the bitmap is empty, returns 0xFFFFFFFF
   *
   * @returns The minimum 32 bit unsigned integer or 0xFFFFFFFF if empty.
   */
  minimum(): number;

  /**
   * Gets the maximum value stored in the bitmap.
   * If the bitmap is empty, returns 0.
   *
   * @returns The maximum 32 bit unsigned integer or 0 if empty.
   */
  maximum(): number;

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param value - The value to look for.
   * @returns True if value exists in the set, false if not.
   */
  has(value: unknown): boolean;

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param other - the other bitmap
   * @returns true if the bitmap is subset of the other.
   */
  isSubset(other: ReadonlyRoaringBitmap32): boolean;

  /**
   * Returns true if this bitmap is strict subset of the other.
   *
   * @param other - The other bitmap
   * @returns True if this bitmap is a strict subset of other
   */
  isStrictSubset(other: ReadonlyRoaringBitmap32): boolean;

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
  toUint32Array(output?: Uint32Array | number | undefined): Uint32Array;

  /**
   * Converts the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @returns The array containing all values in the bitmap.
   */
  toArray(): number[];

  /**
   * Converts the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param maxLength - The maximum length of the output array.
   * @returns The array containing all values in the bitmap.
   */
  toArray(maxLength: number): number[];

  /**
   * Append all items in the bitmap to a JS array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param output - The output array. If not specified, a new array is created.
   * @param maxLength - The optional maximum number of values to read from the bitmap and push in the array.
   * @returns The array containing all values in the bitmap.
   */
  toArray(output: number[], maxLength?: number | undefined): number[];

  /**
   * Converts the bitmap to a JS Set<number>.
   * The resulting set may be very big, use this function with caution.
   *
   * @param output - The output Set. If not specified, a new Set is created.
   * @param maxLength - The optional maximum number of values to read from the bitmap and add in the set.
   * @returns The set containing all values in the bitmap.
   */
  toSet(output?: Set<number> | undefined, maxLength?: number | undefined): Set<number>;

  /**
   * Converts the bitmap to a string in the format "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param sepatator - The optional separator to use between values, defaults to ",".
   * @param maxStringLength - The optional approximate maximum number of characters the output string can contain.
   */
  join(sepatator?: string | undefined, maxStringLength?: number | undefined): string;

  /**
   * Converts a range of the bitmap to a Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given range in the bitmap.
   */
  rangeUint32Array(
    minimumValue?: number | undefined,
    maximumValue?: number | undefined,
    output?: Uint32Array | undefined,
  ): Uint32Array;

  /**
   * Converts a range of the bitmap to an JS Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given range in the bitmap.
   */
  rangeArray(
    minimumValue?: number | undefined,
    maximumValue?: number | undefined,
    output?: number[] | undefined,
  ): number[];

  /**
   * Converts a range of the bitmap to a Set.
   * The resulting set may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param output - The output set. If not specified, a new set is created.
   * @returns The set containing all values within the given range in the bitmap.
   */
  rangeSet(
    minimumValue?: number | undefined,
    maximumValue?: number | undefined,
    output?: Set<number> | undefined,
  ): Set<number>;

  /**
   * Converts a range of the bitmap to a string in the form "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param minimumValue - The range start value (inclusive).
   * @param maximumValue - The range end value (exclusive).
   * @param separator - The separator to use between values. Defaults to ",".
   * @returns The string containing all values within the given range in the bitmap.
   */
  rangeJoin(
    minimumValue?: number | undefined,
    maximumValue?: number | undefined,
    separator?: string | undefined,
  ): string;

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given slice in the bitmap.
   */
  sliceUint32Array(start?: number | undefined, end?: number | undefined, output?: Uint32Array | undefined): Uint32Array;

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a number array.
   * The resulting array may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output array. If not specified, a new array is created.
   * @returns The array containing all values within the given slice in the bitmap.
   */
  sliceArray(start?: number | undefined, end?: number | undefined, output?: number[] | undefined): number[];

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a Set.
   * The resulting set may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param output - The output set. If not specified, a new set is created.
   * @returns The set containing all values within the given slice in the bitmap.
   */
  sliceSet(start?: number | undefined, end?: number | undefined, output?: Set<number> | undefined): Set<number>;

  /**
   * Converts a slice, define by start index (included) and end index (excluded) of the bitmap to a string in the form "1,2,3,4,5".
   * The resulting string may be very big, use this function with caution.
   *
   * @param start - The slice start index (inclusive).
   * @param end - The slice end index (exclusive).
   * @param separator - The separator to use between values. Defaults to ",".
   * @returns The string containing all values within the given slice in the bitmap.
   */
  sliceJoin(start?: number | undefined, end?: number | undefined, separator?: string | undefined): string;

  /**
   * Checks wether two roaring bitmap contains the same data.
   *
   * @param other - The other bitmap.
   * @returns True if the bitmaps contains the same data, false if not.
   */
  isEqual(other: ReadonlyRoaringBitmap32): boolean;

  /**
   * If the size of the roaring bitmap is strictly greater than rank, then
   * this function returns the element of given rank.
   * Otherwise, it returns NaN.
   *
   * @param rank - Element rank
   * @returns element or NaN
   */
  select(rank: number): number;

  /**
   * The at() method takes an integer value and returns the item at that index,
   * allowing for positive and negative integers. Negative integers count back from the last item in the set.
   *
   * @param index Zero-based index of the array element to be returned, converted to an integer. Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.
   * @returns The element in the set matching the given index. Always returns undefined if index < -array.length or index >= array.length without attempting to access the corresponding property.
   */
  at(index: number): number | undefined;

  /**
   * Finds the index of the nth set element.
   * Returns -1 if not found.
   *
   * @param value - Element value
   * @returns element index or -1 if not found
   */
  indexOf(value: number): number;

  /**
   * Computes the size of the intersection between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the intersection between two bitmaps.
   */
  andCardinality(other: ReadonlyRoaringBitmap32): number;

  /**
   * Computes the size of the union of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the union of two bitmaps.
   */
  orCardinality(other: ReadonlyRoaringBitmap32): number;

  /**
   * Computes the size of the difference (andnot) of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the difference (andnot) of two bitmaps.
   */
  andNotCardinality(other: ReadonlyRoaringBitmap32): number;

  /**
   * Computes the size of the symmetric difference (xor) between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param other - The other bitmap.
   * @returns Cardinality of the symmetric difference (xor) of two bitmaps.
   */
  xorCardinality(other: ReadonlyRoaringBitmap32): number;

  /**
   * Returns the number of integers that are smaller or equal to the given value.
   *
   * @param value - The value to rank
   * @returns The number of values smaller than the given value
   */
  rank(value: number): number;

  /**
   * Check whether the two bitmaps intersect (have at least one element in common).
   *
   * @param other - The other bitmap.
   * @returns True if the two bitmaps intersects, false if not.
   */
  intersects(other: ReadonlyRoaringBitmap32): boolean;

  /**
   * Check whether a bitmap and a closed range intersect.
   *
   * @param rangeStart The start of the range.
   * @param rangeEnd The end of the range.
   * @returns boolean True if the bitmap and the range intersects, false if not.
   */
  intersectsWithRange(rangeStart?: number | undefined, rangeEnd?: number | undefined): boolean;

  /**
   * Computes the Jaccard index between two bitmaps.
   * (Also known as the Tanimoto distance, or the Jaccard similarity coefficient)
   * See https://en.wikipedia.org/wiki/Jaccard_index
   *
   * The Jaccard index is undefined if both bitmaps are empty.
   *
   * @returns The Jaccard index
   */
  jaccardIndex(other: ReadonlyRoaringBitmap32): number;
}
