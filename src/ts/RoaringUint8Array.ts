import roaringWasm = require('./lib/roaring-wasm')
import RoaringTypedArray = require('./RoaringTypedArray')

/**
 * Array of bytes allocted directly in roaring library WASM memory.
 * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
 *
 * Extends RoaringTypedArray<Uint8Array>.
 * Implements IDisposable
 *
 * @class RoaringUint8Array
 * @extends {RoaringTypedArray}
 * @implements {RoaringTypedArray}
 * @implements {IDisposable}
 */
class RoaringUint8Array extends RoaringTypedArray<Uint8Array> {
  public get BYTES_PER_ELEMENT(): 1 {
    return 1
  }

  public get byteLength(): number {
    return this.length
  }

  public get heap(): Uint8Array {
    return roaringWasm.HEAPU8
  }

  /**
   * Allocates an array in the roaring WASM heap.
   * Note: Memory is not garbage collected, you are responsible to free the allocated memory calling "dispose" method.
   *
   * @param {(number | RoaringUint8Array | Uint8Array | ReadonlyArray<number>)} lengthOrArray Length of the array to allocate or the array to copy
   * @memberof RoaringUint32Array
   */
  public constructor(lengthOrArray: number | Uint8Array | RoaringUint8Array | ReadonlyArray<number>, pointer?: number) {
    super(lengthOrArray, 1, pointer)
  }

  public toTypedArray(): Uint8Array {
    const array = new Uint8Array(this.length)
    array.set(this.asTypedArray())
    return array
  }

  public asTypedArray(): Uint8Array {
    return new Uint8Array(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length)
  }

  public asNodeBuffer(): Buffer {
    return Buffer.from(roaringWasm.wasmMemory.buffer, this.byteOffset, this.length)
  }
}

Object.defineProperty(RoaringUint8Array.prototype, 'BYTES_PER_ELEMENT', {
  value: 1,
  writable: false,
  configurable: false,
  enumerable: false
})

export = RoaringUint8Array
