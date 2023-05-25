import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";

let _finalizationRegistry: FinalizationRegistry<number> | undefined;

export abstract class RoaringAllocatedMemory {
  #ptr: number;
  #bytes: number;

  /**
   * The offset in bytes of the array (the location of the first byte in WASM memory).
   */
  public get byteOffset(): number {
    return this.#ptr;
  }

  /**
   * The length in bytes of the array.
   * For RoaringUint8Array it is equal to this.length
   * For RoaringUint32Array it is equal to this.length * 4
   */
  public get byteLength(): number {
    return this.#bytes;
  }

  public constructor(
    ptr: number,
    bytes: number,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    arenaAllocator: RoaringArenaAllocator | null = _roaringArenaAllocator_head,
  ) {
    this.#ptr = ptr;
    this.#bytes = bytes;

    if (ptr) {
      if (_finalizationRegistry) {
        _finalizationRegistry.register(this, ptr, this);
      } else if (typeof FinalizationRegistry !== "undefined") {
        _finalizationRegistry = new FinalizationRegistry(roaringWasm._free);
        _finalizationRegistry.register(this, ptr, this);
      }
      if (arenaAllocator) {
        arenaAllocator.register(this);
      }
    }
  }

  /**
   * The ArrayBuffer instance referenced by the array.
   * Note that the buffer may become invalid if the WASM allocated memory grows.
   * When the WASM grows the preallocated memory this property will return the new allocated buffer.
   * Use the returned buffer for short periods of time.
   */
  public get buffer(): ArrayBuffer {
    return roaringWasm.HEAPU8.buffer;
  }

  /**
   * Returns true if this object was deallocated.
   */
  public get isDisposed(): boolean {
    return !this.#ptr;
  }

  /**
   * Frees the allocated memory.
   * Is safe to call this method more than once.
   * @returns True if memory gets freed during this call, false if not.
   */
  public dispose(): boolean {
    const ptr = this.#ptr;
    if (ptr) {
      this.#ptr = 0;
      this.#bytes = 0;
      if (_finalizationRegistry) {
        _finalizationRegistry.unregister(this);
      }
      roaringWasm._free(ptr);
      return true;
    }
    return false;
  }

  protected toJSON(): unknown {
    return {};
  }

  /**
   * Decreases the size of the allocated memory.
   * It does nothing if the new length is greater or equal to the current length.
   * If the new length is less than 1, it disposes the allocated memory.
   * NOTE: if the value is non zero, this does not reallocate the consumed memory, it just chances the reported size in byteLength and length properties.
   * @param newLength - The new length in bytes.
   * @returns True if the memory was shrunk, false if not.
   */
  public shrink(newLength: number): boolean {
    newLength = Math.ceil(newLength);
    if (Number.isNaN(newLength)) {
      return false;
    }
    if (newLength < 1) {
      return this.dispose();
    }
    if (newLength >= this.#bytes) {
      return false;
    }
    this.#bytes = newLength >>> 0;
    return true;
  }
}
