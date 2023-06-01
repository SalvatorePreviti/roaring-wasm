import type { IDisposable } from "./IDisposable";
import { _free_finalizationRegistry, _free_finalizationRegistry_init } from "./lib/free-finalization-registry";
import { _roaringArenaAllocator_head } from "./lib/roaring-arena-allocator-stack";
import type { NullablePtr } from "./lib/roaring-wasm";
import { roaringWasm } from "./lib/roaring-wasm";
import type { RoaringArenaAllocator } from "./RoaringArenaAllocator";
import type { RoaringBitmap32 } from "./RoaringBitmap32";

export class RoaringBitmap32Iterator implements IDisposable, IterableIterator<number> {
  #bmp: RoaringBitmap32 | null;
  #p: NullablePtr;
  #r: IteratorResult<number>;
  #alloc: RoaringArenaAllocator | null;

  public constructor(
    bitmap: RoaringBitmap32 | null = null,
    arenaAllocator: RoaringArenaAllocator | null = _roaringArenaAllocator_head,
  ) {
    this.#bmp = bitmap;
    this.#p = 0;
    this.#r = { done: true, value: undefined };
    this.#alloc = arenaAllocator;
  }

  public get isDisposed(): boolean {
    return this.#p === false;
  }

  public get value(): number | undefined {
    return this.#r.value;
  }

  public get done(): boolean {
    return this.#p === false;
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
    const thisPtr = this.#p;
    const result = new RoaringBitmap32Iterator(this.#bmp, allocator);
    result.#p = thisPtr ? roaringWasm._roaring_iterator_js_clone(thisPtr) : thisPtr;
    if (result.#p) {
      result.#init();
    }
    return result;
  }

  public next(): IteratorResult<number> {
    const r = this.#r;
    let p = this.#p;
    const bitmap = this.#bmp;
    if (!p) {
      p = this.#init();
      if (!p) {
        return r;
      }
    }
    const value = roaringWasm._roaring_iterator_js_next(p, bitmap!._p, bitmap!.v);
    if (value < 0) {
      this.#end();
    } else {
      r.value = value;
    }
    return r;
  }

  public reset(): this {
    const r = this.#r;
    const ptr = this.#p;
    if (ptr) {
      if (_free_finalizationRegistry) {
        _free_finalizationRegistry.unregister(this);
      }
      roaringWasm._free(ptr);
    }
    this.#p = 0;
    r.done = false;
    r.value = undefined;
    return this;
  }

  public moveToGreaterEqual(minimumValue: number): this {
    let p = this.#p;
    if (!p) {
      p = this.#init();
      if (!p) {
        return this;
      }
    }
    const bitmap = this.#bmp;
    const v = roaringWasm._roaring_iterator_js_gte(p, bitmap!._p, bitmap!.v, minimumValue);
    if (v < 0) {
      this.#end();
    } else {
      this.#p = p;
      const r = this.#r;
      r.value = v;
      r.done = false;
    }
    return this;
  }

  public dispose(): boolean {
    const ptr = this.#p;
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
    const bitmap = this.#bmp;
    const ptr = this.#p !== false && !!bitmap && (roaringWasm._roaring_iterator_js_new(bitmap._p, bitmap.v) || false);

    if (ptr) {
      const allocator = this.#alloc;
      if (allocator) {
        allocator.register(this);
      }
      const finalizationRegistry = _free_finalizationRegistry || _free_finalizationRegistry_init();
      if (finalizationRegistry) {
        finalizationRegistry.register(this, this.#p as number, this);
      }
      r.done = false;
    } else {
      r.value = undefined;
      r.done = true;
    }
    this.#p = ptr;
    return ptr;
  }

  #end() {
    const r = this.#r;
    const alloc = this.#alloc;
    if (alloc) {
      alloc.unregister(this);
    }
    if (_free_finalizationRegistry && this.#p) {
      _free_finalizationRegistry.unregister(this);
    }
    this.#p = false;
    r.done = true;
    r.value = undefined;
    return r;
  }
}
