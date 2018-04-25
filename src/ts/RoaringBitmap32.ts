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

  _roaring_bitmap_add_checked_js,
  _roaring_bitmap_remove_checked_js,

  _roaring_bitmap_portable_size_in_bytes,
  _roaring_bitmap_portable_serialize_js,
  _roaring_bitmap_portable_deserialize_js,

  _roaring_bitmap_native_size_in_bytes_js,
  _roaring_bitmap_native_deserialize_js,
  _roaring_bitmap_native_serialize_js
} = roaringWasm

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * The roaring bitmap allocates in WASM memory, remember to dispose
 * the RoaringBitmap32 when not needed anymore to release WASM memory.
 *
 *
 * @class RoaringBitmap32
 */
class RoaringBitmap32 {
  private _ptr: number | undefined

  /**
   * Creates a new roaring bitmap adding the specified values.
   *
   * The roaring bitmap allocates in WASM memory, remember to dispose
   * the RoaringBitmap32 when not needed anymore to release WASM memory.
   * @constructor
   * @param { Set<number> | RoaringUint32Array | Uint32Array | ReadonlyArray<number>} values The values to add
   * @memberof RoaringBitmap32
   */
  public constructor(values?: RoaringUint32Array | Uint32Array | ReadonlyArray<number> | Set<number>) {
    this._ptr = 0

    if (values) {
      try {
        this.addMany(values)
      } catch (error) {
        this.dispose()
        throw error
      }
    }
  }

  /**
   * Creates a new roaring bitmap deserializing it from a buffer
   *
   * The roaring bitmap allocates in WASM memory, remember to dispose
   * the RoaringBitmap32 when not needed anymore to release WASM memory.
   *
   * @static
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer The buffer to deserialize
   * @param {boolean} [portable=false] If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns {RoaringBitmap32} The reulting bitmap. Remember to dispose the instance when finished using it.
   * @memberof RoaringBitmap32
   */
  public static deserialize(buffer: RoaringUint8Array | Uint8Array | number[], portable: boolean = false): RoaringBitmap32 {
    const bitmap = new RoaringBitmap32()
    try {
      bitmap.deserialize(buffer, portable)
    } catch (error) {
      bitmap.dispose()
      throw error
    }
    return bitmap
  }

  /**
   * Utility function that serializes an array of uint32 to a new NodeJS buffer.
   * The returned buffer is automatically garbage collected.
   *
   * @static
   * @param {(RoaringUint32Array | Uint32Array | ReadonlyArray<number> | Set<number>)} values
   * @param {boolean} [portable=false] If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns {Buffer} The NodeJS buffer containing the serialized data.
   * @memberof RoaringBitmap32
   */
  public static serializeArrayToNewBuffer(
    values: RoaringUint32Array | Uint32Array | ReadonlyArray<number> | Set<number>,
    portable: boolean = false
  ): Buffer {
    const bitmap = new RoaringBitmap32(values)
    try {
      bitmap.optimize()
      return bitmap.serializeToNodeBuffer(portable)
    } finally {
      bitmap.dispose()
    }
  }

  /**
   * Utility function that deserializes a RoaringBitmap32 serialized in a buffer to an Array<number> of values.
   * The array can be very big, be careful when you use this function.
   *
   * @static
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer The buffer to deserialize.
   * @param {boolean} [portable=false] If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns {number[]} All the values in the bitmap.
   * @memberof RoaringBitmap32
   */
  public static deserializeToArray(buffer: RoaringUint8Array | Uint8Array | number[], portable: boolean = false): number[] {
    const bitmap = new RoaringBitmap32()
    try {
      bitmap.deserialize(buffer, portable)
      return bitmap.toArray()
    } finally {
      bitmap.dispose()
    }
  }

  /**
   * Utility function that deserializes a RoaringBitmap32 serialized in a buffer to a Set<number> of values.
   * The array can be very big, be careful when you use this function.
   *
   * @static
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer The buffer to deserialize.
   * @param {boolean} [portable=false] If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns {number[]} All the values in the bitmap.
   * @memberof RoaringBitmap32
   */
  public static deserializeToSet(buffer: RoaringUint8Array | Uint8Array | number[], portable: boolean = false): Set<number> {
    const bitmap = new RoaringBitmap32()
    try {
      bitmap.deserialize(buffer, portable)
      return bitmap.toSet()
    } finally {
      bitmap.dispose()
    }
  }

  /**
   * Returns true if this instance was disposed.
   *
   * @readonly
   * @property
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
    const ptr = this._ptr
    if (ptr) {
      _roaring_bitmap_free(ptr)
      this._ptr = undefined
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
    const ptr = this._ptr
    return ptr ? _roaring_bitmap_get_cardinality(ptr) >>> 0 : 0
  }

  /**
   * Returns true if the bitmap has no elements.
   *
   * @returns {boolean} True if the bitmap is empty.
   * @memberof RoaringBitmap32
   */
  public isEmpty(): boolean {
    const ptr = this._ptr
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
   * Adds a 32 bit unsigned integer value checking if the bitmap changes.
   * Use add() if you don't need to know if something changed.
   * Values are unique, this function does nothing and returns false if the value already exists.
   *
   * @param {number} value 32 bit unsigned integer to add in the set.
   * @returns {boolean} True if the bitmap changed, false if not.
   * @memberof RoaringBitmap32
   */
  public addChecked(value: number): boolean {
    return !!_roaring_bitmap_add_checked_js(_getPtr(this), value)
  }

  /**
   * Adds multiple values.
   * Using this is faster than calling add() multiple times.
   * Inserting ordered or partially ordered arrays is faster.
   *
   * @param {RoaringUint32Array | Uint32Array | ReadonlyArray<number> | Set<number>} values The values to add.
   * @memberof RoaringBitmap32
   */
  public addMany(values: RoaringUint32Array | Uint32Array | ReadonlyArray<number> | Set<number>): void {
    if (values instanceof RoaringUint32Array) {
      if (values.length > 0) {
        _roaring_bitmap_add_many(_getPtr(this), values.length, values.byteOffset)
      }
    } else {
      const roaringArray = new RoaringUint32Array(values)
      try {
        if (roaringArray.length > 0) {
          _roaring_bitmap_add_many(_getPtr(this), roaringArray.length, roaringArray.byteOffset)
        }
      } finally {
        roaringArray.dispose()
      }
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
   * Removes a value from the set checking if the bitmap changes.
   * Use remove() if you don't need to know if something changed.
   * If the value does not exists, this function does nothing and returns false.
   *
   * @param {number} value 32 bit unsigned integer to remove from the set.
   * @returns {boolean} True if the bitmap changed, false if not.
   * @memberof RoaringBitmap32
   */
  public removeChecked(value: number): boolean {
    return !!_roaring_bitmap_remove_checked_js(_getPtr(this), value)
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
    return !!_roaring_bitmap_is_subset(_getPtr(this), _getPtr(other))
  }

  /**
   * Returns true if this bitmap is strict subset of the other.
   *
   * @param {RoaringBitmap32} other The other bitmap
   * @returns {boolean} True if this bitmap is a strict subset of other
   * @memberof RoaringBitmap32
   */
  public isStrictSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_strict_subset(_getPtr(this), _getPtr(other))
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
   * The resulting array may be very big, use this function with caution.
   *
   * @returns {number[]} The array containing all values in the bitmap.
   * @memberof RoaringBitmap32
   */
  public toArray(): number[] {
    const roaringArray = this.toRoaringUint32Array()
    try {
      return roaringArray.toArray()
    } finally {
      roaringArray.dispose()
    }
  }

  /**
   * Converts the bitmap to a JS Set<number>.
   * The resulting set may be very big, use this function with caution.
   *
   * @returns {Set<number>} The set containing all values in the bitmap.
   * @memberof RoaringBitmap32
   */
  public toSet(): Set<number> {
    const roaringArray = this.toRoaringUint32Array()
    try {
      return new Set<number>(roaringArray.asTypedArray())
    } finally {
      roaringArray.dispose()
    }
  }

  /**
   * Converts the bitmap to a JS Uint32Array.
   * The resulting array may be very big, use this function with caution.
   *
   * @returns {Uint32Array} The array containing all values in the bitmap.
   * @memberof RoaringBitmap32
   */
  public toUint32Array(): Uint32Array {
    const roaringArray = this.toRoaringUint32Array()
    try {
      return roaringArray.toTypedArray()
    } finally {
      roaringArray.dispose()
    }
  }

  /**
   * Checks wether two roaring bitmap contains the same data.
   *
   * @param {RoaringBitmap32} other
   * @returns {boolean} True if the bitmaps contains the same data, false if not.
   * @memberof RoaringBitmap32
   */
  public equals(other: RoaringBitmap32): boolean {
    if (this === other) {
      return true
    }
    if (!(other instanceof RoaringBitmap32)) {
      return false
    }
    const a = _getPtr(this)
    const b = _getPtr(other)
    if (a === b) {
      return true
    }
    return !!_roaring_bitmap_equals(a, b)
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
    return _roaring_bitmap_and_cardinality(_getPtr(this), _getPtr(other)) >>> 0
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
    return _roaring_bitmap_or_cardinality(_getPtr(this), _getPtr(other)) >>> 0
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
    return _roaring_bitmap_andnot_cardinality(_getPtr(this), _getPtr(other)) >>> 0
  }

  /**
   * Computes the size of the symmetric difference (xor) between two bitmaps.
   * Both bitmaps are unchanged.
   *
   * @param {RoaringBitmap32} other
   * @returns {number} Cardinality of the symmetric difference (xor) of two bitmaps.
   */
  public xorCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_xor_cardinality(_getPtr(this), _getPtr(other)) >>> 0
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
  public andInPlace(other: RoaringBitmap32): void {
    _roaring_bitmap_and_inplace(_getPtr(this), _getPtr(other))
  }

  /**
   * Adds the element of the other bitmap into this bitmap.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public orInPlace(other: RoaringBitmap32): void {
    _roaring_bitmap_or_inplace(_getPtr(this), _getPtr(other))
  }

  /**
   * Computes the difference between two bitmaps.
   * Stores the result in this bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public xorInPlace(other: RoaringBitmap32): void {
    _roaring_bitmap_xor_inplace(_getPtr(this), _getPtr(other))
  }

  /**
   * Compute the difference between this and the provided bitmap,
   * writing the result in the current bitmap.
   * The provided bitmap is not modified.
   *
   * @param {RoaringBitmap32} other
   * @memberof RoaringBitmap32
   */
  public andNotInPlace(other: RoaringBitmap32): void {
    _roaring_bitmap_andnot_inplace(_getPtr(this), _getPtr(other))
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
    return !!_roaring_bitmap_intersect(_getPtr(this), _getPtr(other))
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
    return _roaring_bitmap_jaccard_index(_getPtr(this), _getPtr(other))
  }

  /**
   * How many bytes are required to serialize this bitmap.
   *
   * @param {boolean} [portable=false] If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @memberof RoaringBitmap32
   */
  public getSerializationSizeInBytes(portable: boolean = false): number {
    const ptr = _getPtr(this)
    return portable ? _roaring_bitmap_portable_size_in_bytes(ptr) : _roaring_bitmap_native_size_in_bytes_js(ptr) >>> 0
  }

  /**
   * Serializes a bitmap to a byte buffer allocated in WASM memory.
   *
   * The returned RoaringUint8Array is allocated in WASM memory and not garbage collected,
   * it need to be freed manually calling dispose().
   *
   * @param {boolean} [portable=false] If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns {RoaringUint8Array} The RoaringUint8Array. Remember to manually dispose to free the memory.
   * @memberof RoaringBitmap32
   */
  public serializeToRoaringUint8Array(portable: boolean = false): RoaringUint8Array {
    const ptr = _getPtr(this)
    const code = portable ? _roaring_bitmap_portable_serialize_js(ptr) : _roaring_bitmap_native_serialize_js(ptr)
    if (code !== 0) {
      throw new Error(`RoaringBitmap32 serialization failed, code:${code}`)
    }
    const tempPtr = (ptr + roaringWasm.roaring_bitmap_temp_offset) / 4
    return new RoaringUint8Array(roaringWasm.HEAPU32[tempPtr], roaringWasm.HEAPU32[tempPtr + 1])
  }

  /**
   * Serializes a bitmap to a typed Uint8Array.
   * The returned array is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param {boolean} [portable=false] If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns {Uint8Array} The Uint8Array that contains the serialized bitmap
   * @memberof RoaringBitmap32
   */
  public serializeToUint8Array(portable: boolean = false): Uint8Array {
    const roaringArray = this.serializeToRoaringUint8Array(portable)
    try {
      return roaringArray.toTypedArray()
    } finally {
      roaringArray.dispose()
    }
  }

  /**
   * Serializes a bitmap to a NodeJS buffer.
   * The returned buffer is automatically garbage collected and there is no need to be disposed manually.
   *
   * @param {boolean} [portable=false] If true, serialization is compatible with the Java and Go versions of the library.
   * If false, serialization is compatible with the C version of the library. Default is false.
   * @returns {Buffer} The NodeJS Buffer that contains the serialized bitmap
   * @memberof RoaringBitmap32
   */
  public serializeToNodeBuffer(portable: boolean = false): Buffer {
    const roaringArray = this.serializeToRoaringUint8Array(portable)
    try {
      return roaringArray.toNodeBuffer()
    } finally {
      roaringArray.dispose()
    }
  }

  /**
   * Reads a bitmap from a serialized version.
   * Throws an error if deserialization failed.
   *
   * @param {(RoaringUint8Array | Uint8Array | number[])} buffer
   * @param {boolean} [portable=false] If true, deserialization is compatible with the Java and Go versions of the library.
   * If false, deserialization is compatible with the C version of the library. Default is false.
   * @returns {void}
   * @memberof RoaringBitmap32
   */
  public deserialize(buffer: RoaringUint8Array | Uint8Array | number[], portable: boolean = false): void {
    if (!(buffer instanceof RoaringUint8Array)) {
      if (typeof buffer === 'number') {
        throw new TypeError('deserialize expects an array of bytes')
      }
      _getPtr(this)
      const roaringArray = new RoaringUint8Array(buffer)
      try {
        this.deserialize(roaringArray)
      } finally {
        roaringArray.dispose()
      }
      return
    }

    const code = portable
      ? _roaring_bitmap_portable_deserialize_js(_getPtr(this), buffer.byteOffset, buffer.length)
      : _roaring_bitmap_native_deserialize_js(_getPtr(this), buffer.byteOffset, buffer.length)

    if (code !== 0) {
      throw new Error(`RoaringBitmap32 deserialization failed, code:${code}`)
    }
  }
}

function _getPtr(bitmap: RoaringBitmap32): number {
  if (!(bitmap instanceof RoaringBitmap32)) {
    throw new TypeError('RoaringBitmap32 expected')
  }

  let ptr = (bitmap as any)._ptr

  if (ptr === null || ptr === undefined) {
    _throwDisposed()
  }

  if (ptr === 0) {
    ptr = _roaring_bitmap_create_js(0) >>> 0
    if (!ptr) {
      throw new Error('Failed to allocate RoaringBitmap32')
    }
    ;(bitmap as any)._ptr = ptr
  }

  return ptr
}

function _throwDisposed() {
  throw new TypeError('RoaringBitmap32 was disposed')
}

export = RoaringBitmap32
