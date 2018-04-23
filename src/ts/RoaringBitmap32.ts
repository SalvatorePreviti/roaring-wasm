import IDisposable = require('idisposable')
import roaringWasm = require('./lib/roaring-wasm')
import RoaringUint32Array = require('./RoaringUint32Array')
import RoaringUint8Array = require('./RoaringUint8Array')

const {
  _roaring_bitmap_create_js,
  _roaring_bitmap_free,
  _roaring_bitmap_get_cardinality,
  _roaring_bitmap_is_empty,
  _roaring_bitmap_add,
  _roaring_bitmap_add_many,
  _roaring_bitmap_remove,
  _roaring_bitmap_maximum,
  _roaring_bitmap_minimum,
  _roaring_bitmap_contains,
  _roaring_bitmap_is_subset,
  _roaring_bitmap_is_strict_subset,
  _roaring_bitmap_to_uint32_array,
  _roaring_bitmap_equals,
  _roaring_bitmap_flip_inplace,
  _roaring_bitmap_optimize_js,
  _roaring_bitmap_select_js,
  _roaring_bitmap_and_cardinality,
  _roaring_bitmap_or_cardinality,
  _roaring_bitmap_andnot_cardinality,
  _roaring_bitmap_xor_cardinality,
  _roaring_bitmap_rank,
  _roaring_bitmap_and_inplace,
  _roaring_bitmap_or_inplace,
  _roaring_bitmap_xor_inplace,
  _roaring_bitmap_andnot_inplace,
  _roaring_bitmap_intersect,
  _roaring_bitmap_jaccard_index,

  _roaring_bitmap_portable_size_in_bytes,
  _roaring_bitmap_portable_serialize_js,
  _roaring_bitmap_portable_deserialize_js,

  _roaring_bitmap_native_size_in_bytes_js,
  _roaring_bitmap_native_deserialize_js,
  _roaring_bitmap_native_serialize_js
} = roaringWasm

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 * The roaring bitmap allocates in WASM memory, remember to dispose
 * the RoaringBitmap32 when not needed anymore to release WASM memory.
 *
 * Implements IDisposable
 *
 * @class RoaringBitmap32
 * @implements {IDisposable}
 */
class RoaringBitmap32 implements IDisposable {
  private _ptr: number

  public constructor(initialCapacity: number = 0) {
    this._ptr = 0
    if (!Number.isInteger(initialCapacity) || initialCapacity < 0 || initialCapacity > 0x7fffffff) {
      throw new TypeError(`${this.constructor.name}: Invalid initial capacity: ${initialCapacity}`)
    }
    this._ptr = _roaring_bitmap_create_js(initialCapacity) >>> 0
    if (!this._ptr) {
      throw new Error(`${this.constructor.name}: failed to allocate RoaringBitmap32`)
    }
  }

  /**
   * Returns true if this instance was disposed.
   *
   * @readonly
   * @type {boolean}
   * @memberof RoaringBitmap32
   */
  public get isDisposed(): boolean {
    return !this._ptr
  }

  /**
   * Disposes this object freeing all WASM memory associated to it.
   * Is safe to call this method more than once.
   *
   * @returns {boolean} True if disposed during this call, false if not.
   * @memberof RoaringBitmap32
   */
  public dispose(): boolean {
    const ptr: number = this._ptr
    if (ptr) {
      _roaring_bitmap_free(ptr)
      this._ptr = 0
      return true
    }
    return false
  }

  /**
   * Throws an exception if this object was disposed before.
   *
   * @returns {(void | never)}
   * @memberof RoaringBitmap32
   */
  public throwIfDisposed(): void | never {
    if (!this._ptr) {
      _throwDisposed()
    }
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   *
   * @returns {number} Number of elements in this bitmap.
   * @memberof RoaringBitmap32
   */
  public cardinality(): number {
    const ptr: number = this._ptr
    return ptr ? _roaring_bitmap_get_cardinality(ptr) >>> 0 : 0
  }

  /**
   * Returns true if the bitmap has no elements.
   *
   * @returns {boolean} True if the bitmap is empty.
   * @memberof RoaringBitmap32
   */
  public isEmpty(): boolean {
    const ptr: number = this._ptr
    return !ptr || !!_roaring_bitmap_is_empty(ptr)
  }

  /**
   * Adds a 32 bit unsigned integer value.
   * Values are unique, this function does nothing if the value already exists.
   *
   * @param {number} value 32 bit unsigned integer to add in the set.
   * @memberof RoaringBitmap32
   */
  public add(value: number): void {
    _roaring_bitmap_add(_getPtr(this), value)
  }

  /**
   * Adds multiple values.
   * Using this is faster than calling add() multiple times.
   * Inserting ordered or partialky ordered arrays is faster.
   *
   * @param {RoaringUint32Array} values
   * @memberof RoaringBitmap32
   */
  public addMany(values: RoaringUint32Array): void {
    if (values.length > 0) {
      _roaring_bitmap_add_many(_getPtr(this), values.length, values.byteOffset)
    }
  }

  /**
   * Removes a value from the set.
   * If the value does not exists, this function does nothing.
   *
   * @param {number} value The value to remove.
   * @memberof RoaringBitmap32
   */
  public remove(value: number): void {
    _roaring_bitmap_remove(_getPtr(this), value)
  }

  /**
   * Gets the maximum value stored in the bitmap.
   * If the bitmap is empty, returns 0.
   *
   * @returns {number} The maximum 32 bit unsigned integer or 0 if empty.
   * @memberof RoaringBitmap32
   */
  public maximum(): number {
    return _roaring_bitmap_maximum(_getPtr(this)) >>> 0
  }

  /**
   * Gets the minimum value stored in the bitmap.
   * If the bitmap is empty, returns 0xFFFFFFFF
   *
   * @returns {number} The minimum 32 bit unsigned integer or 0xFFFFFFFF if empty.
   * @memberof RoaringBitmap32
   */
  public minimum(): number {
    return _roaring_bitmap_minimum(_getPtr(this)) >>> 0
  }

  /**
   * Checks whether the given value is contained in the set.
   *
   * @param {number} value The value to look for.
   * @returns {boolean} True if value exists in the set, false if not.
   * @memberof RoaringBitmap32
   */
  public contains(value: number): boolean {
    return !!_roaring_bitmap_contains(_getPtr(this), value)
  }

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param {RoaringBitmap32} other the other bitmap
   * @returns {boolean}
   * @memberof RoaringBitmap32
   */
  public isSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_subset(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Returns true if this bitmap is strict subset of the other.
   *
   * @param {RoaringBitmap32} other The other bitmap
   * @returns {boolean} True if this bitmap is a strict subset of other
   * @memberof RoaringBitmap32
   */
  public isStrictSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_strict_subset(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Converts the bitmap to an array.
   * The array may be very big, use this function with caution.
   * The returned RoaringUint32Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @returns {RoaringUint32Array} The RoaringUint32Array. Remember to manually dispose to free the memory.
   * @memberof RoaringBitmap32
   */
  public toRoaringUint32Array(): RoaringUint32Array {
    const ptr = _getPtr(this)
    const cardinality = _roaring_bitmap_get_cardinality(ptr) >>> 0
    const result = new RoaringUint32Array(cardinality)
    if (cardinality > 0) {
      _roaring_bitmap_to_uint32_array(ptr, result.byteOffset)
    }
    return result
  }

  /**
   * Converts the bitmap to a JS array.
   * The array may be very big, use this function with caution.
   *
   * @returns {number[]} The array containing all values in the set.
   * @memberof RoaringBitmap32
   */
  public toArray(): number[] {
    return IDisposable.using(this.toRoaringUint32Array(), typedArray => typedArray.toArray())
  }

  /**
   * Checks wether two roaring bitmap contains the same data.
   *
   * @param {RoaringBitmap32} other
   * @returns {boolean} True if the bitmaps contains the same data, false if not.
   * @memberof RoaringBitmap32
   */
  public equals(other: RoaringBitmap32): boolean {
    if (!(other instanceof RoaringBitmap32) || !this._ptr || !other._ptr) {
      return false
    }
    return this._ptr === other._ptr || !!_roaring_bitmap_equals(this._ptr, other._ptr)
  }

  /**
   * Negates in place the bitmap within a specified interval.
   * Areas outside the range are passed through unchanged.
   *
   * @param {number} start Range start.
   * @param {number} end Range end.
   * @memberof RoaringBitmap32
   */
  public flipRange(start: number, end: number): void {
    start >>>= 0
    end >>>= 0
    if (end > start) {
      return
    }
    _roaring_bitmap_flip_inplace(_getPtr(this), start, end)
  }

  /**
   * Optimizes the bitmap releasing unused memory and compressing containers.
   * Returns true if something changed.
   *
   * @returns {boolean} True if something changed.
   * @memberof RoaringBitmap32
   */
  public optimize(): boolean {
    return !!_roaring_bitmap_optimize_js(_getPtr(this))
  }

  /**
   * If the size of the roaring bitmap is strictly greater than rank, then
   * this function returns the element of given rank.
   * Otherwise, it returns NaN.
   *
   * @param {number} rank Element rank
   * @returns {number} element or NaN
   * @memberof RoaringBitmap32
   */
  public select(rank: number): number {
    return _roaring_bitmap_select_js(_getPtr(this), rank)
  }

  /**
   * Computes the size of the intersection between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param {RoaringBitmap32} other
   * @returns {number} Cardinality of the intersection between two bitmaps.
   * @memberof RoaringBitmap32
   */
  public andCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_and_cardinality(_getPtr(this), _getOtherPtr(other)) >>> 0
  }

  /**
   * Computes the size of the union of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param {RoaringBitmap32} other
   * @returns {number} Cardinality of the union of two bitmaps.
   * @memberof RoaringBitmap32
   */
  public orCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_or_cardinality(_getPtr(this), _getOtherPtr(other)) >>> 0
  }

  /**
   * Computes the size of the difference (andnot) of two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param {RoaringBitmap32} other
   * @returns {number} Cardinality of the difference (andnot) of two bitmaps.
   * @memberof RoaringBitmap32
   */
  public andNotCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_andnot_cardinality(_getPtr(this), _getOtherPtr(other)) >>> 0
  }

  /**
   * Computes the size of the symmetric difference (xor) between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param {RoaringBitmap32} other
   * @returns {number} Cardinality of the symmetric difference (xor) of two bitmaps.
   */
  public xorCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_xor_cardinality(_getPtr(this), _getOtherPtr(other)) >>> 0
  }

  /**
   * Intersects this bitmap with another.
   * Removes the elements from this bitmap that don't exists in the other.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public andWith(other: RoaringBitmap32): void {
    _roaring_bitmap_and_inplace(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Adds the element of the other bitmap into this bitmap.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public orWith(other: RoaringBitmap32): void {
    _roaring_bitmap_or_inplace(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Computes the difference between two bitmaps.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public xorWith(other: RoaringBitmap32): void {
    _roaring_bitmap_xor_inplace(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Compute the difference between this and the provided bitmap,
   * writing the result in the current bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public andNotWith(other: RoaringBitmap32): void {
    _roaring_bitmap_andnot_inplace(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Returns the number of integers that are smaller or equal to the given value.
   *
   * @param {number} value The value to rank
   * @returns {number} The number of values smaller than the given value
   * @memberof RoaringBitmap32
   */
  public rank(value: number): number {
    return _roaring_bitmap_rank(_getPtr(this), value) >>> 0
  }

  /**
   * Check whether the two bitmaps intersect (have at least one element in common).
   *
   * @param {RoaringBitmap32} other The other bitmap.
   * @returns {boolean} True if the two bitmaps intersects, false if not.
   * @memberof RoaringBitmap32
   */
  public intersects(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_intersect(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * Computes the Jaccard index between two bitmaps.
   * (Also known as the Tanimoto distance, or the Jaccard similarity coefficient)
   * See https://en.wikipedia.org/wiki/Jaccard_index
   *
   * The Jaccard index is undefined if both bitmaps are empty.
   *
   * @returns {number} The Jaccard index
   * @memberof RoaringBitmap32
   */
  public jaccardIndex(other: RoaringBitmap32): number {
    return _roaring_bitmap_jaccard_index(_getPtr(this), _getOtherPtr(other))
  }

  /**
   * How many bytes are required to serialize this bitmap in a portable way.
   * The portable serialization is compatible with Java and Go versions of this library.
   *
   * @memberof RoaringBitmap32
   */
  public getSerializationSizeInBytesPortable(): number {
    const ptr = this._ptr
    return ptr ? _roaring_bitmap_portable_size_in_bytes(ptr) >>> 0 : 0
  }

  /**
   * Serializes a bitmap to a byte buffer allocated in WASM memory.
   * This is meant to be compatible with the Java and Go versions of the library.
   *
   * The returned RoaringUint8Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @returns {RoaringUint8Array} The RoaringUint8Array. Remember to manually dispose to free the memory.
   * @memberof RoaringBitmap32
   */
  public serializePortable(): RoaringUint8Array {
    const ptr = _getPtr(this)
    const code = _roaring_bitmap_portable_serialize_js(ptr)
    if (code !== 0) {
      throw new Error(`RoaringBitmap32 portable serialization failed, code:${code}`)
    }

    const tempPtr = (ptr + roaringWasm.roaring_bitmap_temp_offset) / 4
    return new RoaringUint8Array(roaringWasm.HEAPU32[tempPtr], roaringWasm.HEAPU32[tempPtr + 1])
  }

  /**
   * Reads a bitmap from a serialized version.
   * This is meant to be compatible with the Java and Go versions of the library.
   * Throws an error if deserialization failed.
   *
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer The containing the data to deserialize.
   * @memberof RoaringBitmap32
   */
  public deserializePortable(buffer: RoaringUint8Array | Uint8Array | number[]): void {
    if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
      _getPtr(this)
      IDisposable.using(new RoaringUint8Array(buffer), p => {
        this.deserializePortable(p)
      })
    } else {
      if (!(buffer instanceof RoaringUint8Array)) {
        throw new TypeError('RoaringBitmap32 deserialize expects a RoaringUint8Array')
      }

      const code = _roaring_bitmap_portable_deserialize_js(_getPtr(this), buffer.byteOffset, buffer.length)
      if (code !== 0) {
        throw new Error(`RoaringBitmap32 deserialization failed, code:${code}`)
      }
    }
  }

  /**
   * How many bytes are required to serialize this bitmap in a portable way.
   * The native serialization is compatible with the C version of the library.
   * Native serialization may return more compressed buffer than the portable version.
   *
   * @memberof RoaringBitmap32
   */
  public getSerializationSizeInBytesNative(): number {
    const ptr = this._ptr
    return ptr ? _roaring_bitmap_native_size_in_bytes_js(ptr) >>> 0 : 0
  }

  /**
   * Serializes a bitmap to a byte buffer allocated in WASM memory.
   * This is meant to be compatible with the C++ version of the library.
   * Can generate smaller outputs than the portable version.
   *
   * The returned RoaringUint8Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @returns {RoaringUint8Array} The RoaringUint8Array. Remember to manually dispose to free the memory.
   * @memberof RoaringBitmap32
   */
  public serializeNative(): RoaringUint8Array {
    const ptr = _getPtr(this)
    const code = _roaring_bitmap_native_serialize_js(ptr)
    if (code !== 0) {
      throw new Error(`RoaringBitmap32 compressed serialization failed, code:${code}`)
    }
    const tempPtr = (ptr + roaringWasm.roaring_bitmap_temp_offset) / 4
    return new RoaringUint8Array(roaringWasm.HEAPU32[tempPtr], roaringWasm.HEAPU32[tempPtr + 1])
  }

  /**
   * Reads a bitmap from a serialized version.
   * This is meant to be compatible with the Java and Go versions of the library.
   * Throws an error if deserialization failed.
   *
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer The containing the data to deserialize.
   * @memberof RoaringBitmap32
   */
  public deserializeNative(buffer: RoaringUint8Array | Uint8Array | number[]): void {
    if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
      _getPtr(this)
      IDisposable.using(new RoaringUint8Array(buffer), p => {
        this.deserializeNative(p)
      })
    } else {
      if (!(buffer instanceof RoaringUint8Array)) {
        throw new TypeError('RoaringBitmap32 deserialize expects a RoaringUint8Array')
      }
      const code = _roaring_bitmap_native_deserialize_js(_getPtr(this), buffer.byteOffset, buffer.length)
      if (code !== 0) {
        throw new Error(`RoaringBitmap32 deserialization failed, code:${code}`)
      }
    }
  }
}

function _getPtr(bitmap: RoaringBitmap32): number {
  const ptr = (bitmap as any)._ptr
  if (!ptr) {
    _throwDisposed()
  }
  return ptr
}

function _getOtherPtr(bitmap: RoaringBitmap32): number {
  if (!(bitmap instanceof RoaringBitmap32)) {
    throw new TypeError('RoaringBitmap32 expected')
  }

  const ptr = (bitmap as any)._ptr
  if (!ptr) {
    throw new TypeError('RoaringBitmap32 was disposed')
  }
  return ptr
}

function _throwDisposed() {
  throw new TypeError('RoaringBitmap32 was disposed')
}

export = RoaringBitmap32
