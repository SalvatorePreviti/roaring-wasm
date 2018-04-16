import roaringWasm = require('./roaring-wasm')

/**
 * Base class for typed arrays allocted directly in roaring library WASM memory.
 * Note: Meory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * @abstract
 * @class RoaringTypedArray
 * @template TypedArray
 */
abstract class RoaringTypedArray<TypedArray extends Uint8Array | Uint16Array | Uint32Array> {
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
  public abstract get BYTES_PER_ELEMENT(): number

  /**
   * The length in bytes of the array.
   *
   * @readonly
   * @type {number}
   */
  public abstract get byteLength(): number

  /**
   * The ArrayBuffer instance referenced by the array.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned buffer for short periods of time.
   *
   * @readonly
   * @type {ArrayBuffer}
   */
  public get buffer(): ArrayBuffer {
    return roaringWasm.wasmMemory.buffer
  }

  /**
   * The full WASM heap in hich this array is allocated.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned array for short periods of time.
   *
   * @readonly
   * @type {TypedArray}
   */
  public abstract get heap(): TypedArray

  /**
   * Returns true if this object was deallocated.
   *
   * @readonly
   * @type {boolean}
   */
  public get isDisposed(): boolean {
    return this.byteOffset !== 0
  }

  protected constructor(lengthOrArray: number | ReadonlyArray<number> | TypedArray | RoaringTypedArray<TypedArray>, bytesPerElement: number) {
    let length: number

    if (lengthOrArray instanceof RoaringTypedArray) {
      lengthOrArray = lengthOrArray.asTypedArray()
    }

    if (typeof lengthOrArray === 'number') {
      length = lengthOrArray
    } else if (Array.isArray(lengthOrArray)) {
      length = lengthOrArray.length
    } else if (lengthOrArray instanceof Uint8Array && lengthOrArray instanceof Uint16Array && lengthOrArray instanceof Uint32Array) {
      if (lengthOrArray.BYTES_PER_ELEMENT !== bytesPerElement) {
        throw new TypeError(`Typed array mismatch, expected ${bytesPerElement} bytes per element, received ${lengthOrArray.BYTES_PER_ELEMENT}`)
      }
      length = lengthOrArray.length
    } else {
      throw new TypeError('Invalid argument')
    }

    if (length === 0) {
      this.byteOffset = 0
      this.length = 0
    } else {
      const byteOffset: number = roaringWasm._malloc(length * bytesPerElement)
      if (byteOffset === 0) {
        throw new Error(`Failed to allocate ${length * bytesPerElement} bytes`)
      }
      this.byteOffset = byteOffset
      this.length = length

      if (typeof lengthOrArray !== 'number') {
        this.set(lengthOrArray)
      }
    }
  }

  /**
   * Writes the given array at the specified position
   * @param array A typed or untyped array of values to set.
   * @param offset The index in the current array at which the values are to be written.
   */
  public set(array: ArrayLike<number>, offset: number = 0): this {
    if (!Number.isInteger(offset) || offset < 0 || offset + array.length > this.length) {
      throw new TypeError(`Invalid offset ${offset}`)
    }
    this.heap.set(array, this.byteOffset / this.BYTES_PER_ELEMENT + offset)
    return this
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
    ;(this as { length: number }).length = 0
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

  /**
   * Gets a new Uint8Array instance that shares the memory used by this buffer.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * Use the returned array for short periods of time.
   *
   * @returns {Uint8Array} A new instance of Uint8Array
   */
  public abstract asTypedArray(): TypedArray

  /**
   * Copies the content of this typed array into a standard JS array of numbers and returns it.
   *
   * @returns {number[]} A new array.
   */
  public toArray(): number[] {
    return Array.from(this.asTypedArray())
  }

  /**
   * Returns a string representation of an array.
   */
  public toString(): string {
    return this.asTypedArray().toString()
  }
}

export = RoaringTypedArray
