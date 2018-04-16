import IDisposable = require('./IDisposable')
import roaringWasm = require('./lib/roaring-wasm')
import RoaringUint32Array = require('./RoaringUint32Array')

const {
  _roaring_bitmap_create_with_capacity,
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
  _roaring_bitmap_flip_inplace
} = roaringWasm

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * @class RoaringBitmap32
 */
class RoaringBitmap32 implements IDisposable {
  private _ptr: number

  constructor(initialCapacity: number = 4) {
    this._ptr = 0
    if (!Number.isInteger(initialCapacity) || initialCapacity < 0 || initialCapacity > 0x7fffffff) {
      throw new TypeError(`Invalid ${initialCapacity}`)
    }
    if (initialCapacity < 4) {
      initialCapacity = 4
    }
    this._ptr = _roaring_bitmap_create_with_capacity(initialCapacity) || 0
    if (this._ptr === 0) {
      throw new Error(`${this.constructor.name} failed to allocate memory`)
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
    if (this.isDisposed) {
      throw new Error(`${this.constructor.name} was disposed`)
    }
  }

  /**
   * Get the cardinality of the bitmap (number of elements).
   *
   * @returns {number} Number of elements in this bitmap.
   */
  public cardinality(): number {
    const ptr: number = this._ptr
    return ptr ? _roaring_bitmap_get_cardinality(ptr) : 0
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
    _roaring_bitmap_add(this.getPtr(), value)
  }

  public addMany(values: RoaringUint32Array): void {
    if (values.length > 0) {
      _roaring_bitmap_add_many(this.getPtr(), values.length, values.byteOffset)
    }
  }

  public remove(value: number): void {
    _roaring_bitmap_remove(this.getPtr(), value)
  }

  public maximum(): number {
    return _roaring_bitmap_maximum(this.getPtr())
  }

  public minimum(): number {
    return _roaring_bitmap_minimum(this.getPtr())
  }

  public contains(value: number): boolean {
    return !!_roaring_bitmap_contains(this.getPtr(), value)
  }

  /**
   * Returns true if the bitmap is subset of the other.
   *
   * @param {RoaringBitmap32} other the other bitmap
   * @returns {boolean}
   */
  public isSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_subset(this.getPtr(), other.getPtr())
  }

  public isStrictSubset(other: RoaringBitmap32): boolean {
    return !!_roaring_bitmap_is_strict_subset(this.getPtr(), other.getPtr())
  }

  public toRoaringUint32Array(): RoaringUint32Array {
    const ptr = this.getPtr()
    const cardinality = _roaring_bitmap_get_cardinality(ptr)
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
    _roaring_bitmap_flip_inplace(this.getPtr(), start, end)
  }

  private getPtr(): number {
    const ptr = this._ptr
    if (!ptr) {
      this.throwIfDisposed()
    }
    return ptr
  }
}

export = RoaringBitmap32
