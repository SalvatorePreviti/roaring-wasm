export interface IDisposable {
  dispose(): boolean | void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnsafeAny = any;

const _thenableToPromise = async (thenable: PromiseLike<unknown>): Promise<unknown> => thenable;

/**
 * Checks if the given value is an instance of `IDisposable`.
 * Returns true only if value is a non null object and has a method "dispose"
 * @param value The value to check.
 * @returns true if the value is an instance of `IDisposable`, false otherwise.
 */
export const isDisposable = (value: unknown): value is IDisposable =>
  typeof value === "object" && value !== null && typeof (value as unknown as IDisposable).dispose === "function";

/**
 * Disposes the given IDisposable instance.
 * @param disposable The object to dispose.
 * @returns true if the object was disposed, false otherwise.
 */
export const dispose = (disposable: IDisposable | null | undefined): boolean => {
  const ret = !!disposable && typeof disposable.dispose === "function" && disposable.dispose();
  return ret === undefined || ret === true;
};

/**
 * Disposes the IDisposable passed as "this".
 * @example
 * ```ts
 * const disposable: IDisposable = ...;
 * const disposeFn = disposeThis.bind(disposable);
 * disposeFn();
 * ```
 * @returns true if the object was disposed, false otherwise.
 */
export function disposeThis(this: IDisposable | null | undefined): boolean {
  const ret = !!this && typeof this.dispose === "function" && this.dispose();
  return ret === undefined || ret === true;
}

/**
 * Tries to dispose the given object.
 * Does not throw and eats the exception if any.
 * @param disposable The object to dispose or a promise of the object to dispose.
 * @returns true if the object was disposed, false otherwise.
 */
export const tryDispose = (disposable: IDisposable | null | undefined): boolean => {
  if (disposable) {
    try {
      const ret = typeof disposable.dispose === "function" && disposable.dispose();
      return ret === undefined || ret;
    } catch {
      // Ignore exception
    }
  }
  return false;
};

export const using: {
  <
    TFn extends (disposable: TDisposable) => UnsafeAny,
    TDisposable extends Readonly<IDisposable> | null | undefined = IDisposable,
  >(
    disposable: TDisposable,
    what: TFn,
  ): ReturnType<TFn> extends never
    ? never
    : ReturnType<TFn> extends PromiseLike<Awaited<infer TReturn>>
    ? Promise<TReturn>
    : ReturnType<TFn>;

  <TValue, TDisposable extends Readonly<IDisposable> | null | undefined = IDisposable>(
    disposable: TDisposable,
    what: TValue,
  ): TValue extends never ? never : TValue extends PromiseLike<Awaited<infer TReturn>> ? Promise<TReturn> : TValue;
} = (disposable: UnsafeAny, what: UnsafeAny) => {
  let result: UnsafeAny;
  try {
    result = typeof what === "function" ? what(disposable) : what;
    if (typeof result === "object" && result !== null && typeof result.then === "function") {
      return (typeof result.finally === "function" ? result : _thenableToPromise(result)).finally(
        disposeThis.bind(disposable),
      );
    }
  } catch (e) {
    tryDispose(disposable);
    throw e;
  }
  dispose(disposable);
  return result;
};

export const disposeAll = (
  ...disposables: readonly (
    | readonly (IDisposable | null | undefined | false | readonly (IDisposable | null | undefined | false)[])[]
    | IDisposable
    | null
    | undefined
    | false
  )[]
): number => {
  let result = 0;
  let errorToThrow: Error | undefined;
  for (const disposable of disposables) {
    try {
      if (isDisposable(disposable)) {
        if (dispose(disposable)) {
          ++result;
        }
      }
    } catch (e) {
      errorToThrow = e as Error;
    }
    if (Array.isArray(disposable)) {
      disposeAll(...disposable);
    }
  }
  if (errorToThrow !== undefined) {
    throw errorToThrow;
  }
  return result;
};
