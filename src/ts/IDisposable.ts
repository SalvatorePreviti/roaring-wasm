/**
 * A disposable object.
 *
 * @interface IDisposable
 */
interface IDisposable {
  /**
   * Disposes the given object.
   *
   * @abstract
   * @returns {boolean} True if disposed during this call, false if not.
   */
  dispose(): boolean
}

/**
 * Disposable object helper functions
 */
abstract class IDisposable implements IDisposable {
  /**
   * Disposes the given disposable.
   *
   * @static
   * @param {IDisposable} instance The IDisposable to dispose.
   * @returns {boolean} True if disposed during this call, false if not
   */
  public static dispose(instance: IDisposable | null | undefined): boolean {
    if (instance === null || typeof instance !== 'object' || typeof instance.dispose !== 'function') {
      return false
    }
    return Boolean(instance.dispose())
  }

  /**
   * Try to dispose the given instance, ignoring errors.
   *
   * @static
   * @param instance The IDisposable to dispose.
   */
  public static tryDispose(disposable: (() => IDisposable) | IDisposable | null | undefined): boolean {
    try {
      if (typeof disposable === 'function') {
        return IDisposable.dispose(disposable())
      }
      return IDisposable.dispose(disposable)
    } catch (_error) {
      return false
    }
  }

  /**
   * Safe function that disposes the given object when the functor or the promise returned by the functor completes.
   *
   * @static
   * @template TDisposable Disposable object type
   * @template TResult Functor return type
   * @param {TDisposable} instance The instance to use and dispose when the functor completes.
   * @param {(instance: TDisposable) => TResult} functor The functor to execute. It can return a Promise.
   * @returns {TResult}
   */
  public static using<TDisposable extends IDisposable, TResult extends any | PromiseLike<any> | Promise<any>>(
    instance: TDisposable,
    functor: (instance: TDisposable) => TResult
  ): TResult {
    let status: number = 0
    try {
      let result: TResult = functor(instance)

      if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
        result = result.then((promiseResult: any) => {
          if (status === 1) {
            IDisposable.dispose(instance)
            status = -1
          }
          return promiseResult
        })

        if (typeof result.catch === 'function') {
          result = result.catch((error: Error) => {
            if (status === 1) {
              IDisposable.dispose(instance)
              status = -1
            }
            throw error
          })
        }

        status = 1
      }

      return result
    } finally {
      if (status === 0) {
        IDisposable.dispose(instance)
      }
    }
  }

  /**
   * Disposes the given object.
   *
   * @abstract
   * @returns {boolean} True if disposed during this call, false if not.
   */
  public dispose(): boolean {
    return false
  }
}

export = IDisposable
