import IDisposable = require('./IDisposable')
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
  _roaring_bitmap_run_optimize,
  _roaring_bitmap_remove_run_compression,
  _roaring_bitmap_shrink_to_fit,
  _roaring_bitmap_select_js,
  _roaring_bitmap_and_cardinality,
  _roaring_bitmap_or_cardinality,
  _roaring_bitmap_andnot_cardinality,
  _roaring_bitmap_xor_cardinality,
  _roaring_bitmap_rank,
  _roaring_bitmap_portable_size_in_bytes,
  _roaring_bitmap_portable_serialize_alloc_js,
  _roaring_bitmap_portable_deserialize_js
} = roaringWasm

function throwDisposed() {
  throw new Error('RoaringBitmap32 was disposed')
}

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * @class RoaringBitmap32
 */
class RoaringBitmap32 implements IDisposable {
  private _ptr: number

  public constructor(initialCapacity: number = 0) {
    this._ptr = 0
    if (!Number.isInteger(initialCapacity) || initialCapacity < 0 || initialCapacity > 0x7fffffff) {
      throw new TypeError(`${this.constructor.name}: Invalid initial capacity: ${initialCapacity}`)
    }
    this._ptr = _roaring_bitmap_create_js(initialCapacity) >>> 0
    if (this._ptr === 0) {
      throw new Error(`${this.constructor.name}: failed to allocate memory`)
    }
  }

  /**
   * Returns true if this instance was disposed.
   *
   * @readonly
   * @type {boolean}
   */
  public get isDisposed(): boolean {
    return !this._ptr
  }

  /**
   * Disposes this object freeing all WASM memory associated to it.
   * Is safe to call this method more than once.
   *
   * @returns {boolean} True if disposed during this call, false if not.
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
   */
  public throwIfDisposed(): void | never {
    if (!this._ptr) {
      throwDisposed()
    }
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   *
   * @returns {number} Number of elements in this bitmap.
   */
  public cardinality(): number {
    const ptr: number = this._ptr
    return ptr ? _roaring_bitmap_get_cardinality(ptr) >>> 0 : 0
  }

  /**
   * Returns true if the bitmap has no elements.
   *
   * @returns {boolean} True if the bitmap is empty.
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
   * @returns {this}
   */
  public add(value: number): void {
    _roaring_bitmap_add(this._getPtr(), value)
  }

  public addMany(values: RoaringUint32Array): void {
    if (values.length > 0) {
      _roaring_bitmap_add_many(this._getPtr(), values.length, values.byteOffset)
    }
  }

  public remove(value: number): void {
    _roaring_bitmap_remove(this._getPtr(), value)
  }

  public maximum(): number {
    return _roaring_bitmap_maximum(this._getPtr()) >>> 0
  }

  public minimum(): number {
    return _roaring_bitmap_minimum(this._getPtr()) >>> 0
  }

  public contains(value: number): boolean {
    return !!_roaring_bitmap_contains(this._getPtr(), value)
  }

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param {RoaringBitmap32} other the other bitmap
   * @returns {boolean}
   */
  public isSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_subset(this._getPtr(), other._getPtr())
  }

  public isStrictSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_strict_subset(this._getPtr(), other._getPtr())
  }

  public toRoaringUint32Array(): RoaringUint32Array {
    const ptr = this._getPtr()
    const cardinality = _roaring_bitmap_get_cardinality(ptr) >>> 0
    const result = new RoaringUint32Array(cardinality)
    if (cardinality > 0) {
      _roaring_bitmap_to_uint32_array(ptr, result.byteOffset)
    }
    return result
  }

  public toArray(): number[] {
    return IDisposable.using(this.toRoaringUint32Array(), typedArray => typedArray.toArray())
  }

  public equals(other: RoaringBitmap32): boolean {
    if (!(other instanceof RoaringBitmap32) || !this._ptr || !other._ptr) {
      return false
    }
    return this._ptr === other._ptr || !!_roaring_bitmap_equals(this._ptr, other._ptr)
  }

  public flipRange(start: number, end: number): void {
    _roaring_bitmap_flip_inplace(this._getPtr(), start, end)
  }

  public removeRunCompression(): boolean {
    return !!_roaring_bitmap_remove_run_compression(this._getPtr())
  }

  public runOptimize(): boolean {
    return !!_roaring_bitmap_run_optimize(this._getPtr())
  }

  public shrinkToFit(): number {
    return _roaring_bitmap_shrink_to_fit(this._getPtr())
  }

  /**
   * If the size of the roaring bitmap is strictly greater than rank, then
   * this function returns the element of given rank.
   * Otherwise, it returns NaN.
   *
   * @param {number} rank
   * @returns {number} element or NaN
   */
  public select(rank: number): number {
    return _roaring_bitmap_select_js(this._getPtr(), rank)
  }

  public andCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_and_cardinality(this._getPtr(), other._getPtr()) >>> 0
  }

  public orCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_or_cardinality(this._getPtr(), other._getPtr()) >>> 0
  }

  public andNotCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_andnot_cardinality(this._getPtr(), other._getPtr()) >>> 0
  }

  public xorCardinality(other: RoaringBitmap32): number {
    return _roaring_bitmap_xor_cardinality(this._getPtr(), other._getPtr()) >>> 0
  }

  public rank(value: number): number {
    return _roaring_bitmap_rank(this._getPtr(), value) >>> 0
  }

  public getSerializationSizeInBytesPortable(): number {
    return _roaring_bitmap_portable_size_in_bytes(this._getPtr()) >>> 0
  }

  public serializePortable(): RoaringUint8Array {
    const ptr = this._getPtr()
    if (!_roaring_bitmap_portable_serialize_alloc_js(ptr)) {
      throw new Error('RoaringBitmap32 serialization failed')
    }

    const tempPtr = (ptr + roaringWasm.roaring_bitmap_temp_offset) / 4
    return new RoaringUint8Array(roaringWasm.HEAPU32[tempPtr], roaringWasm.HEAPU32[tempPtr + 1])
  }

  public deserializePortable(buffer: RoaringUint8Array | Uint8Array): this {
    if (buffer instanceof Uint8Array) {
      return IDisposable.using(new RoaringUint8Array(buffer), p => this.deserializePortable(p))
    }

    if (!(buffer instanceof RoaringUint8Array)) {
      throw new TypeError('RoaringBitmap32 deserialize expects a RoaringUint8Array')
    }

    if (!_roaring_bitmap_portable_deserialize_js(this._getPtr(), buffer.byteOffset, buffer.length)) {
      throw new Error('RoaringBitmap32 deserialization failed')
    }

    return this
  }

  private _getPtr(): number {
    const ptr = this._ptr
    if (!ptr) {
      throwDisposed()
    }
    return ptr
  }
}

export = RoaringBitmap32
