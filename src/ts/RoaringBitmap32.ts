import IDisposable = require('./IDisposable')
import roaringWasm = require('./lib/roaring-wasm')

/**
 * A Roaring Bitmap that supports 32 bit unsigned integers.
 *
 * @class RoaringBitmap32
 */
class RoaringBitmap32 implements IDisposable {
  private _ptr: number

  constructor(initialCapacity: number = 4) {
    this._ptr = 0
    if (!Number.isInteger(initialCapacity) || initialCapacity < 0 || initialCapacity > 0x0fffffff) {
      throw new TypeError(`Invalid ${initialCapacity}`)
    }
    if (initialCapacity < 4) {
      initialCapacity = 4
    }
    this._ptr = roaringWasm._roaring_bitmap_create_with_capacity(initialCapacity) || 0
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
    if (!ptr) {
      return false
    }
    roaringWasm._roaring_bitmap_free(ptr)
    this._ptr = 0
    return true
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
    return ptr ? roaringWasm._roaring_bitmap_get_cardinality(ptr) : 0
  }

  /**
   * Returns true if the bitmap has no elements.
   *
   * @returns {boolean} True if the bitmap is empty.
   */
  public isEmpty(): boolean {
    const ptr: number = this._ptr
    return !ptr || !!roaringWasm._roaring_bitmap_is_empty(ptr)
  }
}

export = RoaringBitmap32
