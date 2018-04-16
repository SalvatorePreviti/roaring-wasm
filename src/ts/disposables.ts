/**
 * Disposable object helper functions
 */
namespace disposables {
  /**
   * A disposable object.
   *
   * @interface IDisposable
   */
  export interface IDisposable {
    /**
     * Disposes the given object.
     *
     * @returns {boolean} True if disposed during this call, false if not.
     */
    dispose(): boolean
  }

  /**
   * Disposes the given disposable.
   *
   * @param {IDisposable} instance The IDisposable to dispose.
   * @returns {boolean} True if disposed during this call, false if not
   */
  export function dispose(instance: IDisposable | null | undefined): boolean {
    if (instance === null || typeof instance !== 'object' || typeof instance.dispose !== 'function') {
      return false
    }
    return Boolean(instance.dispose())
  }

  /**
   * Try to dispose the given instance, ignoring errors.
   *
   * @param instance The IDisposable to dispose.
   */
  export function tryDispose(disposable: (() => IDisposable) | IDisposable | null | undefined): boolean {
    try {
      if (typeof disposable === 'function') {
        return dispose(disposable())
      }
      return dispose(disposable)
    } catch (_error) {
      return false
    }
  }

  /**
   * Safe function that disposes the given object when the functor or the promise returned by the functor completes.
   *
   * @template TDisposable Disposable object type
   * @template TResult Functor return type
   * @param {TDisposable} instance The instance to use and dispose when the functor completes.
   * @param {(instance: TDisposable) => TResult} functor The functor to execute. It can return a Promise.
   * @returns {TResult}
   */
  export function using<TDisposable extends IDisposable, TResult extends any | PromiseLike<any> | Promise<any>>(
    instance: TDisposable,
    functor: (instance: TDisposable) => TResult
  ): TResult {
    let status: number = 0
    try {
      let result: TResult = functor(instance)

      if (typeof result === 'object' && result !== null) {
        if (typeof result.then === 'function') {
          if (typeof result.catch === 'function') {
            result = result.catch((error: Error) => {
              if (status === 1) {
                dispose(instance)
                status = -1
              }
              throw error
            })
          }

          result = result.then((promiseResult: any) => {
            if (status === 1) {
              dispose(instance)
              status = -1
            }
            return promiseResult
          })

          status = 1
        }
        return result
      }
      return result
    } finally {
      if (status === 0) {
        dispose(instance)
      }
    }
  }
}

export = disposables
