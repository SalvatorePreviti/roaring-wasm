import IDisposable = require('idisposable')
import RoaringBitmap32 = require('roaring-wasm/RoaringBitmap32')
import RoaringUint32Array = require('roaring-wasm/RoaringUint32Array')

describe('RoaringBitmap32', () => {
  describe('addChecked', () => {
    it('returns false if nothing changes', () => {
      IDisposable.using(new RoaringBitmap32([123]), bitmap => {
        expect(bitmap.addChecked(123)).toBe(false)
        expect(bitmap.cardinality()).toBe(1)
      })
    })

    it('returns true if something changes', () => {
      IDisposable.using(new RoaringBitmap32([124]), bitmap => {
        expect(bitmap.addChecked(123)).toBe(true)
        expect(bitmap.cardinality()).toBe(2)
      })
    })
  })

  describe('removeChecked', () => {
    it('returns false if nothing changes', () => {
      IDisposable.using(new RoaringBitmap32([125]), bitmap => {
        expect(bitmap.removeChecked(123)).toBe(false)
        expect(bitmap.cardinality()).toBe(1)
      })
    })

    it('returns true if something changes', () => {
      IDisposable.using(new RoaringBitmap32([123]), bitmap => {
        expect(bitmap.removeChecked(123)).toBe(true)
        expect(bitmap.cardinality()).toBe(0)
      })
    })
  })

  describe('from array', () => {
    const array = [123, 189, 456, 789, 910]

    it('adds the array one by one', () => {
      IDisposable.using(new RoaringBitmap32(), bitmap => {
        for (const item of array) {
          bitmap.add(item)
        }
        expect(bitmap.toArray().sort()).toEqual(array)
      })
    })

    it('adds a RoaringUint32Array', () => {
      IDisposable.using(new RoaringUint32Array(array), buffer => {
        IDisposable.using(new RoaringBitmap32(), bitmap => {
          expect(buffer.toArray()).toEqual(array)
          bitmap.addMany(buffer)
          expect(buffer.isDisposed).toBe(false)
          expect(buffer.toArray()).toEqual(array)
          expect(bitmap.toArray().sort()).toEqual(array)
        })
      })
    })

    it('adds a simple array', () => {
      IDisposable.using(new RoaringBitmap32(), bitmap => {
        bitmap.addMany(array)
        expect(bitmap.toArray().sort()).toEqual(array)
      })
    })

    it('works in the constructor', () => {
      IDisposable.using(new RoaringBitmap32(array), bitmap => {
        expect(bitmap.toArray().sort()).toEqual(array)
      })
    })
  })
})
