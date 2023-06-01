import type { IDisposable } from "./IDisposable";
import { _free_finalizationRegistry, _free_finalizationRegistry_init } from "./lib/free-finalization-registry";
import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import type { NullablePtr } from "./lib/roaring-wasm";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";
import { RoaringBitmap32 } from "./RoaringBitmap32";

export class RoaringBitmap32Iterator implements IDisposable, IterableIterator<number> {
  #bitmap: RoaringBitmap32 | null;
  #ptr: NullablePtr;
  #min: number;
  #r: IteratorResult<number>;
  #alloc: RoaringArenaAllocator | null;

  public constructor(
    bitmap?: RoaringBitmap32 | null,
    arenaAllocator: RoaringArenaAllocator | null = _roaringArenaAllocator_head,
  ) {
    this.#bitmap = bitmap || new RoaringBitmap32();
    this.#ptr = 0;
    this.#min = 0;
    this.#r = { done: true, value: undefined };
    this.#alloc = arenaAllocator;
  }

  public get isDisposed(): boolean {
    return this.#ptr === false;
  }

  public get value(): number | undefined {
    return this.#r.value;
  }

  public get done(): boolean {
    return this.#ptr === false;
  }

  public return(_value?: unknown): IteratorResult<number> {
    this.dispose();
    return this.#r;
  }

  public throw(e?: unknown): never {
    this.dispose();
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw e;
  }

  [Symbol.iterator](): IterableIterator<number> {
    return this;
  }

  public clone(allocator?: RoaringArenaAllocator | null | undefined): RoaringBitmap32Iterator {
    const thisPtr = this.#ptr;
    const result = new RoaringBitmap32Iterator(this.#bitmap, allocator);
    result.#min = this.#min;
    result.#ptr = thisPtr ? roaringWasm._roaring_iterator_js_clone(thisPtr) : thisPtr;
    if (result.#ptr) {
      result.#init();
    }
    return result;
  }

  public next(): IteratorResult<number> {
    const result = this.#r;
    let ptr = this.#ptr;
    const bitmap = this.#bitmap;
    if (!ptr) {
      ptr = this.#init();
      if (!ptr) {
        return result;
      }
    }

    const value = roaringWasm._roaring_iterator_js_next(ptr, bitmap!._p, bitmap!.v);
    if (value < 0) {
      this.#end();
    } else {
      result.value = value;
    }
    return result;
  }

  public reset(minimumValue: number = this.#min): this {
    const r = this.#r;
    const ptr = this.#ptr;
    if (ptr) {
      if (_free_finalizationRegistry) {
        _free_finalizationRegistry.unregister(this);
      }
      roaringWasm._free(ptr);
    }
    this.#ptr = 0;
    this.#min = minimumValue;
    r.done = false;
    r.value = undefined;
    return this;
  }

  public dispose(): boolean {
    const ptr = this.#ptr;
    if (ptr) {
      roaringWasm._free(ptr);
    } else if (ptr === false) {
      return false;
    }
    this.#end();
    return true;
  }

  #init() {
    const r = this.#r;
    const bitmap = this.#bitmap;
    const ptr =
      this.#ptr !== false &&
      !!bitmap &&
      (roaringWasm._roaring_iterator_js_new(bitmap._p, bitmap.v, this.#min) || false);

    if (ptr) {
      const allocator = this.#alloc;
      if (allocator) {
        allocator.register(this);
      }
      const finalizationRegistry = _free_finalizationRegistry || _free_finalizationRegistry_init();
      if (finalizationRegistry) {
        finalizationRegistry.register(this, this.#ptr as number, this);
      }
      r.done = false;
    } else {
      r.value = undefined;
      r.done = true;
    }
    this.#ptr = ptr;
    return ptr;
  }

  #end() {
    const r = this.#r;
    const alloc = this.#alloc;
    if (alloc) {
      alloc.unregister(this);
    }
    if (_free_finalizationRegistry && this.#ptr) {
      _free_finalizationRegistry.unregister(this);
    }
    this.#ptr = false;
    r.done = true;
    r.value = undefined;
    return r;
  }
}
