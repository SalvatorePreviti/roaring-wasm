import roaringWasm = require('./lib/roaring-wasm')
import RoaringTypedArray = require('./lib/RoaringTypedArray')

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * Extends RoaringTypedArray<Uint32Array>.
 * Implements IDisposable
 *
 * @class RoaringUint32Array
 * @extends {RoaringTypedArray}
 * @implements {RoaringTypedArray<Uint32Array>}
 * @implements {IDisposable}
 */
class RoaringUint32Array extends RoaringTypedArray<Uint32Array> {
  public get BYTES_PER_ELEMENT(): 4 {
    return 4
  }

  public get byteLength(): number {
    return this.length * 4
  }

  public get heap(): Uint32Array {
    return roaringWasm.HEAPU32
  }

  /**
   * Allocates an array in the roaring WASM heap.
   * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
   *
   * @param {(number | RoaringUint32Array | Uint32Array | ReadonlyArray<number>)} lengthOrArray Length of the array to allocate or the array to copy
   * @memberof RoaringUint32Array
   */
  public constructor(lengthOrArray: number | RoaringUint32Array | Uint32Array | ReadonlyArray<number>, pointer?: number) {
    super(lengthOrArray, 4, pointer)
  }

  public asTypedArray(): Uint32Array {
    return new Uint32Array(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length)
  }

  public asNodeBuffer(): Buffer {
    return Buffer.from(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length * 4)
  }
}

Object.defineProperty(RoaringUint32Array.prototype, 'BYTES_PER_ELEMENT', {
  value: 4,
  writable: false,
  configurable: false,
  enumerable: false
})

export = RoaringUint32Array
