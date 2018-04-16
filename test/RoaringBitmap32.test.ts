import IDisposable = require('roaring/IDisposable')
import RoaringBitmap32 = require('roaring/RoaringBitmap32')

describe('RoaringBitmap32', () => {
  describe('constructor', () => {
    it('allocates and deallocates', () => {
      const bitmap = new RoaringBitmap32()
      expect(bitmap.dispose()).toBe(true)
      expect(bitmap.dispose()).toBe(false)
      expect(bitmap.isDisposed).toBe(true)
      expect(bitmap.isEmpty()).toBe(true)
      expect(bitmap.cardinality()).toBe(0)
    })

    it('creates an empty bitmap', () => {
      IDisposable.using(new RoaringBitmap32(), bitmap => {
        expect(bitmap.isEmpty()).toBe(true)
        expect(bitmap.cardinality()).toBe(0)
      })
    })
  })
})
