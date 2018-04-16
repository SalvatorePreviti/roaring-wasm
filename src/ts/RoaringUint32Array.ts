import roaringWasm = require('./lib/roaring-wasm')
import RoaringTypedArray = require('./lib/RoaringTypedArray')

/**
 * Array of unsigned 32 bit integers allocted directly in roaring library WASM memory.
 * Note: Meory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * @class RoaringUint32Array
 */
class RoaringUint32Array extends RoaringTypedArray<Uint32Array> {
  public get BYTES_PER_ELEMENT(): number {
    return 1
  }

  public get byteLength(): number {
    return this.byteOffset
  }

  public get heap(): Uint32Array {
    return roaringWasm.HEAPU32
  }

  /**
   * Allocates an array in the roaring WASM heap.
   * Note: Meory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
   * @param {number} length Number of elements to allocate.
   */
  public constructor(lengthOrArray: number | Uint32Array | ReadonlyArray<number>) {
    super(lengthOrArray, 1)
  }

  /**
   * Gets a new Uint32Array instance that shares the memory used by this buffer.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * Use the returned array for short periods of time.
   *
   * @returns {Uint32Array} A new instance of Uint32Array
   */
  public asTypedArray(): Uint32Array {
    return new Uint32Array(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length)
  }

  /**
   * Gets a new Buffer instance that shares the memory used by this buffer.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * Use the returned array for short periods of time.
   *
   * @returns {Buffer} A new instance of node Buffer
   */
  public asNodeBuffer(): Buffer {
    return Buffer.from(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length)
  }
}

export = RoaringUint32Array
