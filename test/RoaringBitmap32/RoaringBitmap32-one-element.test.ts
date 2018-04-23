import IDisposable = require('idisposable')
import RoaringBitmap32 = require('roaring-wasm/RoaringBitmap32')

describe('RoaringBitmap32 one element', () => {
  describe('read', () => {
    let instance: RoaringBitmap32

    beforeAll(() => {
      instance = new RoaringBitmap32()
      instance.add(123)
    })

    afterAll(() => {
      IDisposable.dispose(instance)
    })

    it('should not be empty', () => {
      expect(instance.isEmpty()).toBe(false)
    })

    it('should have cardinality() === 1', () => {
      expect(instance.cardinality()).toBe(1)
    })

    it('should have minimum === 123', () => {
      expect(instance.minimum()).toBe(123)
    })

    it('should have maximum === 123', () => {
      expect(instance.maximum()).toBe(123)
    })

    it('should not contain 0', () => {
      expect(instance.contains(0)).toBe(false)
    })

    it('should contain 123', () => {
      expect(instance.contains(123)).toBe(true)
    })

    it('has a toRoaringUint32Array() that returns [123]', () => {
      IDisposable.using(instance.toRoaringUint32Array(), p => {
        expect(p.toArray()).toEqual([123])
      })
    })

    it('has a toArray() that returns [123]', () => {
      expect(instance.toArray()).toEqual([123])
    })

    it('should have a portable serialization size 18', () => {
      expect(instance.getSerializationSizeInBytesPortable()).toBe(18)
    })

    it('should serialize as (portable)', () => {
      const array = IDisposable.using(instance.serializePortable(), buffer => buffer.toArray())
      expect(array).toEqual([58, 48, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 123, 0])
    })

    it('should have a native serialization size 9', () => {
      expect(instance.getSerializationSizeInBytesNative()).toBe(9)
    })

    it('should serialize as (native)', () => {
      const array = IDisposable.using(instance.serializeNative(), buffer => buffer.toArray())
      expect(array).toEqual([1, 1, 0, 0, 0, 123, 0, 0, 0])
    })

    it('should be a subset of itself', () => {
      expect(instance.isSubset(instance)).toBe(true)
    })

    it('should not be a strict subset of itself', () => {
      expect(instance.isStrictSubset(instance)).toBe(false)
    })

    it('should be equal to itself', () => {
      expect(instance.equals(instance))
    })

    it('should not be equal to an empty instance', () => {
      IDisposable.using(new RoaringBitmap32(), second => {
        expect(instance.equals(second)).toBe(false)
      })
    })

    it('should select', () => {
      expect(instance.select(0)).toBe(123)
      expect(instance.select(1)).toBe(NaN)
    })

    it('should rank', () => {
      expect(instance.rank(1)).toBe(0)
      expect(instance.rank(123)).toBe(1)
      expect(instance.rank(12300)).toBe(1)
    })

    it('should have AND cardinality of 1 with itself', () => {
      expect(instance.andCardinality(instance)).toBe(1)
    })

    it('should have OR cardinality of 1 with itself', () => {
      expect(instance.orCardinality(instance)).toBe(1)
    })

    it('should have XOR cardinality of 0 with itself', () => {
      expect(instance.xorCardinality(instance)).toBe(0)
    })

    it('should have AND NOT cardinality of 0 with itself', () => {
      expect(instance.andNotCardinality(instance)).toBe(0)
    })

    it('has a valid jaccard index with itself', () => {
      expect(instance.jaccardIndex(instance)).toEqual(1)
    })
  })
})
