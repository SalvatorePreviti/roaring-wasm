import IDisposable = require('idisposable')
import roaringWasm = require('./lib/roaring-wasm')

/**
 * Base class for typed arrays allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * @abstract
 * @class RoaringTypedArray
 * @template TypedArray Uint8Array | Uint16Array | Uint32Array
 */
abstract class RoaringTypedArray<TypedArray extends Uint8Array | Uint16Array | Uint32Array> implements IDisposable {
  /**
   * The offset in bytes of the array (the location of the first byte in WASM memory).
   * @readonly
   * @type {number}
   * @memberof RoaringTypedArray
   */
  public readonly byteOffset: number

  /**
   * Number of elements allocated in this array.
   *
   * @readonly
   * @type {number}
   * @memberof RoaringTypedArray
   */
  public readonly length: number

  /**
   * The size in bytes of each element in the array.
   *
   * @readonly
   * @type {number}
   * @memberof RoaringTypedArray
   */
  public abstract get BYTES_PER_ELEMENT(): number

  /**
   * The length in bytes of the array.
   *
   * @readonly
   * @type {number}
   * @memberof RoaringTypedArray
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
   * @memberof RoaringTypedArray
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
   * @memberof RoaringTypedArray
   */
  public abstract get heap(): TypedArray

  /**
   * Returns true if this object was deallocated.
   *
   * @readonly
   * @type {boolean}
   * @memberof RoaringTypedArray
   */
  public get isDisposed(): boolean {
    return this.byteOffset === 0
  }

  /**
   * Creates an instance of RoaringTypedArray.
   * @param {(number | ReadonlyArray<number> | TypedArray | RoaringTypedArray<TypedArray>)} lengthOrArray The length to create or the array to clone.
   * @param {number} bytesPerElement Number of bytes per element.
   * @memberof RoaringTypedArray
   */
  protected constructor(
    lengthOrArray: number | ReadonlyArray<number> | TypedArray | RoaringTypedArray<TypedArray> | Set<number>,
    bytesPerElement: number,
    _pointer?: number
  ) {
    let length: number

    if (lengthOrArray instanceof RoaringTypedArray) {
      lengthOrArray = lengthOrArray.asTypedArray()
    }

    if (typeof lengthOrArray === 'number') {
      length = lengthOrArray
    } else if (Array.isArray(lengthOrArray)) {
      length = lengthOrArray.length
    } else if (
      lengthOrArray instanceof Uint8Array ||
      lengthOrArray instanceof Uint16Array ||
      lengthOrArray instanceof Uint32Array ||
      // tslint:disable-next-line:no-typeof-undefined
      (typeof Buffer !== 'undefined' && lengthOrArray instanceof Buffer)
    ) {
      if (lengthOrArray.BYTES_PER_ELEMENT !== bytesPerElement) {
        throw new TypeError(
          `Typed array mismatch, expected ${bytesPerElement} bytes per element, received ${lengthOrArray.BYTES_PER_ELEMENT}`
        )
      }
      length = lengthOrArray.length
    } else if (lengthOrArray instanceof Set) {
      length = lengthOrArray.size
    } else {
      throw new TypeError('Invalid argument')
    }

    if (length === 0) {
      this.byteOffset = 0
      this.length = 0
    } else {
      if (_pointer === undefined) {
        _pointer = roaringWasm._malloc(length * bytesPerElement)
      }
      if (!_pointer) {
        throw new Error(`Failed to allocate ${length * bytesPerElement} bytes`)
      }
      this.byteOffset = _pointer
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
   * @memberof RoaringTypedArray
   */
  public set(array: ArrayLike<number> | Set<number>, offset: number = 0): this {
    let length = (array as ArrayLike<number>).length

    if (!Number.isInteger(offset) || offset < 0) {
      throw new TypeError(`Invalid offset ${offset}`)
    }

    if (length > 0) {
      if (offset + length > this.length) {
        throw new TypeError(`Invalid offset ${offset}`)
      }
      this.heap.set(array as ArrayLike<number>, this.byteOffset / this.BYTES_PER_ELEMENT + offset)
      return this
    }

    if (array instanceof Set) {
      length = array.size
      if (length <= 0) {
        return this
      }
      if (offset + length > this.length) {
        throw new TypeError(`Invalid offset ${offset}`)
      }
      const heap = this.heap
      let p = this.byteOffset / this.BYTES_PER_ELEMENT + offset
      for (const x of array) {
        heap[p++] = x
      }
    }

    return this
  }

  /**
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   *
   * @returns {boolean} True if memory gets freed during this call, false if not.
   * @memberof RoaringTypedArray
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
      throw new TypeError(`${this.constructor.name} memory was freed`)
    }
  }

  /**
   * Gets a new typed array instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns {TypedArray} A new instance of Uint8Array
   * @memberof RoaringTypedArray
   */
  public abstract asTypedArray(): TypedArray

  /**
   * Gets a new NodeJS Buffer instance that shares the memory used by this buffer.
   * Note that the buffer may point to an outdated WASM memory if the WASM allocated memory grows while using the returned buffer.
   * Use the returned array for short periods of time.
   *
   * @returns {Buffer} A new instance of NodeJS Buffer
   * @memberof RoaringTypedArray
   */
  public abstract asNodeBuffer(): Buffer

  /**
   * Copies the content of this buffer to a typed array.
   * The returned array is garbage collected and don't need to be disposed manually.
   *
   * @returns {TypedArray} A new typed array that contains a copy of this buffer
   * @memberof RoaringTypedArray
   */
  public abstract toTypedArray(): TypedArray

  /**
   * Copies the content of this buffer to a NodeJS Buffer.
   * The returned buffer is garbage collected and don't need to be disposed manually.
   *
   * @returns {Buffer} A new instance of NodeJS Buffer that contains a copy of this buffer
   * @memberof RoaringTypedArray
   */
  public toNodeBuffer(): Buffer {
    return Buffer.from(this.asNodeBuffer())
  }

  /**
   * Copies the content of this typed array into a standard JS array of numbers and returns it.
   *
   * @returns {number[]} A new array.
   * @memberof RoaringTypedArray
   */
  public toArray(): number[] {
    return Array.from(this.asTypedArray())
  }

  /**
   * Returns a string representation of an array.
   * @memberof RoaringTypedArray
   */
  public toString(): string {
    return this.asTypedArray().toString()
  }

  /**
   * Iterator that iterates through all values in the array.
   *
   * @returns {IterableIterator<number>}
   * @memberof RoaringUint32Array
   */
  public [Symbol.iterator](): IterableIterator<number> {
    return this.asTypedArray()[Symbol.iterator]()
  }
}

export = RoaringTypedArray
