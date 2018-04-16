import IDisposable = require('roaring-wasm/IDisposable')

describe('disposables', () => {
  class SimpleDisposable implements IDisposable {
    public disposeCount = 0
    public dispose(): boolean {
      return this.disposeCount++ === 0
    }
  }

  class ThrowingDisposable implements IDisposable {
    public disposeCalled = false
    public dispose(): boolean {
      this.disposeCalled = true
      throw new Error('dispose failed')
    }
  }

  describe('dispose', () => {
    it('should return false with null or undefined', () => {
      expect(IDisposable.dispose(null)).toBe(false)
      expect(IDisposable.dispose(undefined)).toBe(false)
    })

    it('should call dispose and returns true', () => {
      const disposable = new SimpleDisposable()
      expect(IDisposable.dispose(disposable)).toBe(true)
      expect(disposable.disposeCount).toBe(1)
    })

    it('should return false with non disposable objects', () => {
      const nonDisposableObjects = [1, 'string', {}]
      for (const disposable of nonDisposableObjects) {
        expect(IDisposable.dispose(disposable as any)).toBe(false)
      }
    })
  })

  describe('tryDispose', () => {
    it('should return false with null or undefined', () => {
      expect(IDisposable.tryDispose(null)).toBe(false)
      expect(IDisposable.tryDispose(undefined)).toBe(false)
    })

    it('should call dispose and returns true', () => {
      const disposable = new SimpleDisposable()
      expect(IDisposable.tryDispose(disposable)).toBe(true)
      expect(disposable.disposeCount).toBe(1)
    })

    it('should return false with non disposable objects', () => {
      const nonDisposableObjects = [1, 'string', {}]
      for (const disposable of nonDisposableObjects) {
        expect(IDisposable.tryDispose(disposable as any)).toBe(false)
      }
    })

    it('should return false and eat the exception if dispose trows an exception', () => {
      const disposable = new ThrowingDisposable()
      expect(IDisposable.tryDispose(disposable)).toBe(false)
      expect(disposable.disposeCalled).toBe(true)
    })

    it('should execute a functor and eat the exception', () => {
      const disposable = new ThrowingDisposable()
      expect(IDisposable.tryDispose(disposable)).toBe(false)
      expect(disposable.disposeCalled).toBe(true)
    })
  })

  describe('using', () => {
    describe('with a simple functor', () => {
      it('should execute, return result and dispose the disposable', () => {
        const disposable = new SimpleDisposable()
        const result = IDisposable.using(disposable, d => {
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
          IDisposable.using(disposable, () => {
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

        return IDisposable.using(disposable, functor).then(() => {
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
        return IDisposable.using(disposable, functor)
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
