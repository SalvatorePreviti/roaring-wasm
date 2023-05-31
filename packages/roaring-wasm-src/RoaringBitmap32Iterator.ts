import type { IDisposable } from "./IDisposable";
import { _free_finalizationRegistry, _free_finalizationRegistry_init } from "./lib/free-finalization-registry";
import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import type { NullablePtr } from "./lib/roaring-wasm";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";
import { RoaringBitmap32 } from "./RoaringBitmap32";

const _done = <R extends IteratorResult<number>>(r: R) => {
  r.done = true;
  r.value = undefined;
  return r;
};

export class RoaringBitmap32Iterator implements IDisposable, IterableIterator<number> {
  #bitmap: RoaringBitmap32;
  #ver: number | false;
  #ptr: NullablePtr;
  #idx: number;
  #size: number;
  #min: number;
  #val: number | undefined;
  #r: IteratorResult<number>;
  #alloc: RoaringArenaAllocator | null;

  public constructor(
    bitmap?: RoaringBitmap32 | null,
    arenaAllocator: RoaringArenaAllocator | null = _roaringArenaAllocator_head,
  ) {
    this.#bitmap = bitmap || new RoaringBitmap32();
    this.#ptr = 0;
    this.#idx = 0;
    this.#size = 0;
    this.#ver = false;
    this.#min = 0;
    this.#r = { done: true, value: undefined };
    this.#alloc = arenaAllocator;
  }

  public get isDisposed(): boolean {
    return this.#ptr === false;
  }

  public get done(): boolean {
    return this.#ptr === false;
  }

  public get value(): number | undefined {
    return this.#val;
  }

  return?(_value?: unknown): IteratorResult<number> {
    this.dispose();
    return this.#r;
  }

  throw?(e?: unknown): never {
    this.dispose();
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw e;
  }

  [Symbol.iterator](): IterableIterator<number> {
    return this;
  }

  public clone(allocator?: RoaringArenaAllocator | null | undefined): RoaringBitmap32Iterator {
    const result = new RoaringBitmap32Iterator(this.#bitmap, allocator);
    const ptr = this.#ptr;
    result.#ptr = ptr ? roaringWasm._roaring_iterator_js_clone(ptr) : ptr;
    result.#idx = this.#idx;
    result.#size = this.#size;
    result.#ver = this.#ver;
    result.#min = this.#min;
    result.#val = this.#val;
    return result;
  }

  public next(result = this.#r): IteratorResult<number> {
    if (this.#ver !== this.#bitmap.v) {
      if (!this.#init()) {
        return _done(result);
      }
    }

    if (this.#idx >= this.#size) {
      if (!this.#advance()) {
        return _done(result);
      }
    }

    const value = roaringWasm.HEAPU32[((this.#ptr as number) >>> 2) + this.#idx++];
    this.#val = value;
    result.done = false;
    result.value = value;
    return result;
  }

  public reset(minimumValue: number = this.#min): this {
    const ptr = this.#ptr;
    if (ptr) {
      if (_free_finalizationRegistry) {
        _free_finalizationRegistry.unregister(this);
      }
      roaringWasm._free(ptr);
    }
    this.#ptr = 0;
    this.#idx = 0;
    this.#size = 0;
    this.#ver = false;
    this.#min = minimumValue;
    this.#val = undefined;
    _done(this.#r);
    return this;
  }

  public dispose(): boolean {
    const ptr = this.#ptr;
    if (ptr === false) {
      return false;
    }
    if (ptr) {
      this.reset();
      const allocator = this.#alloc;
      if (allocator) {
        allocator.unregister(this);
      }
    }
    this.#ptr = false;
    return true;
  }

  #init(): NullablePtr {
    const bitmap = this.#bitmap;
    let ptr = this.#ptr;

    if (ptr === false) {
      return false;
    }

    const val = this.#val;

    this.reset();
    ptr = roaringWasm._roaring_iterator_js_new_gte(bitmap._ptr, val !== undefined ? val + 1 : this.#min) || false;
    this.#ptr = ptr;
    if (ptr) {
      this.#ver = bitmap.v;
      this.#size = 1;
      const allocator = this.#alloc;
      if (allocator) {
        allocator.register(this);
      }
      const finalizationRegistry = _free_finalizationRegistry || _free_finalizationRegistry_init();
      if (finalizationRegistry) {
        finalizationRegistry.register(this, ptr, this);
      }
    }
    return ptr;
  }

  #advance(): boolean {
    const sz = roaringWasm._roaring_iterator_js_next(this.#ptr);
    this.#idx = 0;
    this.#size = sz;
    if (!sz) {
      this.#val = undefined;
      this.#ptr = false;
      if (_free_finalizationRegistry) {
        _free_finalizationRegistry.unregister(this);
      }
      return false;
    }
    return true;
  }
}
