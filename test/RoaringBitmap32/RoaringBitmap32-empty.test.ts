import IDisposable = require('roaring-wasm/IDisposable')
import RoaringBitmap32 = require('roaring-wasm/RoaringBitmap32')

describe('RoaringBitmap32 empty', () => {
  let instance: RoaringBitmap32

  beforeAll(() => {
    instance = new RoaringBitmap32()
  })

  afterAll(() => {
    IDisposable.dispose(instance)
  })

  it('should have isEmpty() === true', () => {
    expect(instance.isEmpty()).toBe(true)
  })

  it('should have cardinality() === 0', () => {
    expect(instance.cardinality()).toBe(0)
  })

  it('has a toArray() that returns an empty array', () => {
    expect(instance.toArray()).toEqual([])
  })

  it('should have minimum === 4294967295', () => {
    expect(instance.minimum()).toBe(4294967295)
  })

  it('should have maximum === 0', () => {
    expect(instance.maximum()).toBe(0)
  })

  it('should not contain 0', () => {
    expect(instance.contains(0)).toBe(false)
  })

  it('should do nothing during optimization', () => {
    expect(instance.runOptimize()).toBe(false)
  })

  it('should have a portable serialization size 8', () => {
    expect(instance.getSerializationSizeInBytesPortable()).toBe(8)
  })

  /*  describe('constructor', () => {
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

    it('xserialize', () => {
      IDisposable.using(new RoaringBitmap32(), bitmap => {
        console.log(bitmap.serialize().toArray())
      })
    })
  })*/
})
