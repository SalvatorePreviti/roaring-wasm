import type { IDisposable } from "./IDisposable";
import { dispose } from "./IDisposable";

import { RoaringUint8Array } from "./RoaringUint8Array";
import { RoaringUint32Array } from "./RoaringUint32Array";
import { RoaringBitmap32 } from "./RoaringBitmap32";
import {
  _roaringArenaAllocator_head,
  _roaringArenaAllocator_pop,
  _roaringArenaAllocator_push,
} from "./lib/roaring-arena-allocator-stack";
import { RoaringBitmap32Iterator } from "./RoaringBitmap32Iterator";

export class RoaringArenaAllocator {
  #refs: Set<IDisposable> | null;
  #escaped: Set<IDisposable> | null;
  #started: number;

  public static get current(): RoaringArenaAllocator | null {
    return _roaringArenaAllocator_head;
  }

  /**
   * Starts a new arena allocator.
   * @returns The new arena allocator.
   */
  public static start(): RoaringArenaAllocator {
    return new RoaringArenaAllocator().start();
  }

  /**
   * Stops the current arena allocator.
   * @returns The stopped arena allocator.
   * @see start
   * @see current
   * @see with
   */
  public static stop(): RoaringArenaAllocator | null {
    const instance = _roaringArenaAllocator_head;
    return instance && instance.stop();
  }

  /**
   * Gets the number of references currently registered.
   * @returns The number of references, escaped or not.
   */
  public get size(): number {
    const refs = this.#refs;
    return refs ? refs.size : 0;
  }

  /**
   * Gets the number of references currently escaped.
   * Escaped references are not disposed when the arena is stopped.
   * @returns The number of escaped references.
   * @see escape
   */
  public get escaped(): number {
    const escaped = this.#escaped;
    return escaped ? escaped.size : 0;
  }

  public static with(
    fn: (allocator: RoaringArenaAllocator) => void,
    allocator: RoaringArenaAllocator = new RoaringArenaAllocator(),
  ): void {
    allocator.with(fn);
  }

  public constructor() {
    this.#refs = null;
    this.#escaped = null;
    this.#started = 0;
  }

  public disposeAll(): number {
    const refs = this.#refs;
    let result = 0;
    if (refs) {
      const escaped = this.#escaped;
      this.#refs = null;
      for (const ref of refs) {
        if (ref && (!escaped || !escaped.has(ref))) {
          if (dispose(ref)) {
            ++result;
          }
        }
      }
    }
    return result;
  }

  public start(): this {
    ++this.#started;
    _roaringArenaAllocator_push(this);
    return this;
  }

  public stop(): this {
    if (this.#started > 0) {
      _roaringArenaAllocator_pop(this);
      --this.#started;
    }
    this.disposeAll();
    return this;
  }

  public with<T>(fn: (allocator: RoaringArenaAllocator) => T): T {
    this.start();
    try {
      return fn(this);
    } finally {
      this.stop();
    }
  }

  public register<T extends IDisposable>(disposable: T): T {
    (this.#refs || (this.#refs = new Set())).add(disposable);
    return disposable;
  }

  public unregister(disposable: IDisposable | null | undefined): boolean {
    const refs = this.#refs;
    return !!refs && refs.delete(disposable!);
  }

  public escape<T extends IDisposable>(disposable: T): T {
    (this.#escaped || (this.#escaped = new Set())).add(disposable);
    return disposable;
  }

  public newRoaringUint8Array(lengthOrArray?: number | Iterable<number> | ArrayLike<number> | null | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RoaringUint8Array(lengthOrArray, this);
  }

  public newRoaringUint32Array(lengthOrArray?: number | Iterable<number> | ArrayLike<number> | null | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RoaringUint32Array(lengthOrArray, this);
  }

  public newRoaringBitmap32Iterator(bitmap?: RoaringBitmap32 | null | undefined): RoaringBitmap32Iterator {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RoaringBitmap32Iterator(bitmap, this);
  }

  public newRoaringBitmap32(
    valuesOrCapacity?:
      | RoaringBitmap32
      | RoaringUint32Array
      | Iterable<number>
      | ArrayLike<number>
      | number
      | null
      | undefined,
  ): RoaringBitmap32 {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RoaringBitmap32(valuesOrCapacity, this);
  }
}
