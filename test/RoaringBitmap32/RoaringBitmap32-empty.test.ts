import IDisposable = require('idisposable')
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

  it('should have a portable serialization size 8', () => {
    expect(instance.getSerializationSizeInBytesPortable()).toBe(8)
  })

  it('should serialize as "empty" (portable)', () => {
    const array = IDisposable.using(instance.serializePortable(), buffer => buffer.toArray())
    expect(array).toEqual([58, 48, 0, 0, 0, 0, 0, 0])
  })

  it('should have a native serialization size 5', () => {
    expect(instance.getSerializationSizeInBytesNative()).toBe(5)
  })

  it('should serialize as "empty" (native)', () => {
    const array = IDisposable.using(instance.serializeNative(), buffer => buffer.toArray())
    expect(array).toEqual([1, 0, 0, 0, 0])
  })

  it('should be a subset of itself', () => {
    expect(instance.isSubset(instance)).toBe(true)
  })

  it('should not be a strict subset of itself', () => {
    expect(instance.isStrictSubset(instance)).toBe(false)
  })
})
