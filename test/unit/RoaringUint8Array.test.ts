import IDisposable = require('idisposable')
import roaringWasm = require('roaring-wasm/lib/roaring-wasm')
import RoaringUint8Array = require('roaring-wasm/RoaringUint8Array')

function sameInstance(a: any, b: any): boolean {
  return a === b
}

describe('RoaringUint8Array', () => {
  it('allows creating empty arrays', () => {
    IDisposable.using(new RoaringUint8Array(0), p => {
      expect(p.length).toBe(0)
      expect(p.byteOffset).toBe(0)
      expect(p.byteLength).toBe(0)
      expect(p.BYTES_PER_ELEMENT).toBe(1)
      expect(p.heap).toBeInstanceOf(Uint8Array)
      expect(p.buffer).toBeInstanceOf(ArrayBuffer)
      expect(sameInstance(p.heap, roaringWasm.HEAPU8)).toBe(true)
      expect(sameInstance(p.buffer, roaringWasm.wasmMemory.buffer)).toBe(true)
      expect(p.toArray()).toEqual([])
      expect(p.isDisposed).toBe(true)
    })
  })

  it('allows creating a small array', () => {
    IDisposable.using(new RoaringUint8Array(12), p => {
      expect(p.length).toBe(12)
      expect(p.byteLength).toBe(12)
      expect(p.byteOffset).toBeGreaterThan(0)
      expect(p.BYTES_PER_ELEMENT).toBe(1)
      expect(p.heap).toBeInstanceOf(Uint8Array)
      expect(p.buffer).toBeInstanceOf(ArrayBuffer)
      expect(sameInstance(p.heap, roaringWasm.HEAPU8)).toBe(true)
      expect(sameInstance(p.buffer, roaringWasm.wasmMemory.buffer)).toBe(true)
      expect(p.isDisposed).toBe(false)
    })
  })

  it('copies arrays', () => {
    IDisposable.using(new RoaringUint8Array([1, 2, 3]), p => {
      expect(p.length).toBe(3)
      expect(p.byteLength).toBe(3)
      expect(p.byteOffset).toBeGreaterThan(0)
      expect(p.BYTES_PER_ELEMENT).toBe(1)
      expect(p.toArray()).toEqual([1, 2, 3])
      expect(p.isDisposed).toBe(false)
    })
  })
})
