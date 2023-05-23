let _stack: RoaringArenaAlloc[] | undefined;
let _head: RoaringArenaAlloc | undefined;

/**
 * A class that can be used to allocate memory that can be freed all at once.
 * This is useful for allocating memory for temporary objects that are used in a function.
 * When the function returns, all allocated memory can be freed at once.
 * This reduces the chances of memory leaks.
 * All the objects allocated during the lifetime of a RoaringArenaAlloc instance can be freed by calling the dispose method, or alternatively, using the synchronous run method
 */
export class RoaringArenaAlloc {
  private s: Set<Readonly<{ dispose(): boolean }>> | null;

  public readonly dispose: () => boolean;

  constructor() {
    this.s = null;

    this.dispose = (): boolean => {
      const set = this.s;
      if (!set) {
        return false;
      }
      this.s = null;
      for (const instance of set) {
        instance.dispose();
      }
      if (_stack) {
        if (_stack[_stack.length - 1] === this) {
          _stack.pop();
          _head = _stack[_stack.length - 1];
        } else {
          const index = _stack.lastIndexOf(this);
          if (index >= 0) {
            _stack.splice(index, 1);
          }
        }
      }
      return true;
    };
  }

  public start(): this {
    if (!_stack) {
      _stack = [];
    }
    _stack.push(this);
    _head = this;
    if (!this.s) {
      this.s = new Set();
    }
    return this;
  }

  public run<T>(callback: () => T): T {
    this.start();
    try {
      return callback();
    } finally {
      this.dispose();
    }
  }

  public static run<T>(callback: () => T): T {
    return new RoaringArenaAlloc().run(callback);
  }

  public register<T extends Readonly<{ dispose(): boolean }>>(instance: T): T {
    if (this.s) {
      this.s.add(instance);
    }
    return instance;
  }

  public unregister<T extends Readonly<{ dispose(): boolean }>>(instance: T): T {
    if (this.s) {
      this.s.delete(instance);
    }
    return instance;
  }

  public static register<T extends Readonly<{ dispose(): boolean }>>(instance: T): T {
    if (_head) {
      _head.s!.add(instance);
    }
    return instance;
  }

  public static unregister<T extends Readonly<{ dispose(): boolean }>>(instance: T): T {
    if (_stack) {
      for (let i = _stack.length - 1; i >= 0; --i) {
        const t = _stack[i];
        if (t.s!.delete(instance)) {
          return instance;
        }
      }
    }
    return instance;
  }

  public static push(): RoaringArenaAlloc {
    return new RoaringArenaAlloc().start();
  }

  public static pop(): boolean {
    const instance = _stack && _stack[_stack.length - 1];
    return !!instance && instance.dispose();
  }
}
