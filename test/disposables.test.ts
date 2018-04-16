import disposables = require('roaring/disposables')

describe('disposables', () => {
  class SimpleDisposable implements disposables.IDisposable {
    public disposeCount = 0
    public dispose(): boolean {
      return this.disposeCount++ === 0
    }
  }

  describe('dispose', () => {
    it('should call dispose and returns true', () => {
      const disposable = new SimpleDisposable()
      expect(disposable.dispose()).toBe(true)
      expect(disposable.disposeCount).toBe(1)
    })

    it('should return false with null or undefined', () => {
      expect(disposables.dispose(null)).toBe(false)
      expect(disposables.dispose(undefined)).toBe(false)
    })

    it('should return false with non disposable objects', () => {
      const nonDisposableObjects = [1, 'string', {}]
      for (const disposable of nonDisposableObjects) {
        expect(disposables.dispose(disposable as any)).toBe(false)
      }
    })
  })

  describe('using', () => {
    describe('with a simple functor', () => {
      it('should execute, return result and dispose the disposable', () => {
        const disposable = new SimpleDisposable()
        const result = disposables.using(disposable, d => {
          expect(d).toBe(disposable)
          return '-result-'
        })
        expect(result).toBe('-result-')
        expect(disposable.disposeCount).toBe(1)
      })

      it('should dispose also if there was an exception', () => {
        const disposable = new SimpleDisposable()
        const error = new Error()
        try {
          disposables.using(disposable, () => {
            throw error
          })
        } catch (e) {
          expect(e).toBe(error)
        } finally {
          expect(disposable.disposeCount).toBe(1)
        }
      })
    })

    describe('with a functor that returns a Promise', () => {
      it('should execute, return the promise and dispose the disposable after the promise completes', () => {
        const disposable = new SimpleDisposable()

        function functor(d: SimpleDisposable) {
          expect(d).toBe(disposable)
          return new Promise(resolve => {
            expect(disposable.disposeCount).toBe(0)
            resolve()
          })
        }

        return disposables.using(disposable, functor).then(() => {
          expect(disposable.disposeCount).toBe(1)
        })
      })

      it('should dispose also if the promise fails', () => {
        const error = new Error()
        const disposable = new SimpleDisposable()

        function functor(d: SimpleDisposable) {
          expect(d).toBe(disposable)
          return new Promise((_resolve, reject) => {
            reject(error)
          })
        }

        let catchedError: Error
        return disposables
          .using(disposable, functor)
          .catch(e => {
            catchedError = e
          })
          .then(() => {
            expect(catchedError).toBe(error)
            expect(disposable.disposeCount).toBe(1)
          })
      })
    })
  })
})
