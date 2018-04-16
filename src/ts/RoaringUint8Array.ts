import roaringWasm = require('./lib/roaring-wasm')

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: Meory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * @class RoaringUint8Array
 */
class RoaringUint8Array {
  /**
   * The offset in bytes of the array (the location of the first byte in WASM memory).
   * @readonly
   * @type {number}
   */
  public readonly byteOffset: number

  /**
   * Number of elements allocated in this array.
   *
   * @readonly
   * @type {number}
   */
  public readonly length: number

  /**
   * The size in bytes of each element in the array.
   *
   * @readonly
   * @type {number}
   */
  public get BYTES_PER_ELEMENT(): number {
    return 1
  }

  /**
   * The length in bytes of the array.
   *
   * @readonly
   * @type {number}
   */
  public get byteLength(): number {
    return this.byteOffset
  }

  /**
   * The ArrayBuffer instance referenced by the array.
   * Note that this instance can change if the memory allocated for the WASM module grows.
   *
   * @readonly
   * @type {ArrayBuffer}
   */
  public get buffer(): ArrayBuffer {
    return roaringWasm.wasmMemory.buffer
  }

  /**
   * Returns true if this object was deallocated.
   *
   * @readonly
   * @type {boolean}
   */
  public get isDisposed(): boolean {
    return this.byteOffset !== 0
  }

  /**
   * Allocates an array of the given size.
   * Note: Meory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
   * @param {number} length Number of elements to allocate.
   */
  public constructor(length: number) {
    if (!Number.isInteger(length) || length < 0 || length >= 0x0fffffff) {
      throw new TypeError(`${this.constructor.name} invalid length to allocate: ${length}`)
    }
    this.length = length
    this.byteOffset = roaringWasm._malloc(length)
    if (this.byteOffset === 0) {
      throw new Error(`${this.constructor.name} Failed to allocate ${this.byteLength} bytes`)
    }
  }

  /**
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   *
   * @returns {boolean} True if memory gets freed during this call, false if not.
   */
  public dispose(): boolean {
    if (this.byteOffset === 0) {
      return false
    }
    roaringWasm._free(this.byteOffset)
    ;(this as { byteOffset: number }).byteOffset = 0
    ;(this as { byteLength: number }).byteLength = 0
    return true
  }

  /**
   * Throws an error if the memory was freed.
   *
   * @returns {(void | never)}
   * @memberof RoaringUint8Array
   */
  public throwIfDisposed(): void | never {
    if (this.isDisposed) {
      throw new Error(`${this.constructor.name} memory was freed`)
    }
  }
}

export = RoaringUint8Array
