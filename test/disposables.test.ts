import disposables = require('roaring/disposables')

describe('disposables', () => {
  class SimpleDisposable implements disposables.IDisposable {
    public disposeCount = 0
    public dispose(): boolean {
      return this.disposeCount++ === 0
    }
  }

  let simpleDisposable: SimpleDisposable

  beforeEach(() => {
    simpleDisposable = new SimpleDisposable()
  })

  describe('dispose', () => {
    it('should call dispose and returns true', () => {
      expect(simpleDisposable.dispose()).toBe(true)
      expect(simpleDisposable.disposeCount).toBe(1)
    })
  })
})
