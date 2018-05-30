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

  describe('asTypedArray', () => {
    it('returns a valid view', () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), p => {
        const buf = p.asTypedArray()
        expect(buf.length).toBe(3)
        expect(buf[0]).toBe(1)
        expect(buf[1]).toBe(2)
        expect(buf[2]).toBe(3)
        expect(buf.buffer === p.buffer).toBeTruthy()
      })
    })
  })

  describe('toTypedArray', () => {
    it('returns a copy', () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), p => {
        const buf = p.toTypedArray()
        expect(buf.length).toBe(3)
        expect(buf[0]).toBe(1)
        expect(buf[1]).toBe(2)
        expect(buf[2]).toBe(3)
        expect(buf.buffer !== p.buffer).toBeTruthy()
      })
    })
  })

  describe('asNodeBuffer', () => {
    it('returns a valid view', () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), p => {
        const buf = p.asNodeBuffer()
        expect(buf.length).toBe(3)
        expect(buf[0]).toBe(1)
        expect(buf[1]).toBe(2)
        expect(buf[2]).toBe(3)
        expect(buf.buffer === p.buffer).toBeTruthy()
      })
    })
  })

  describe('toNodeBuffer', () => {
    it('returns a copy', () => {
      IDisposable.using(new RoaringUint8Array([1, 2, 3]), p => {
        const buf = p.toNodeBuffer()
        expect(buf.length).toBe(3)
        expect(buf[0]).toBe(1)
        expect(buf[1]).toBe(2)
        expect(buf[2]).toBe(3)
        expect(buf.buffer !== p.buffer).toBeTruthy()
      })
    })
  })

  describe('dispose', () => {
    it('can be called twice', () => {
      const p = new RoaringUint8Array([1, 2, 3])
      expect(p.dispose()).toBe(true)
      expect(p.isDisposed).toBe(true)
      expect(p.dispose()).toBe(false)
      expect(p.isDisposed).toBe(true)
    })

    it('resets everything', () => {
      const p = new RoaringUint8Array([1, 2, 3])
      expect(p.dispose()).toBe(true)
      expect(p.byteLength).toBe(0)
      expect(p.byteOffset).toBe(0)
    })
  })

  describe('throwIfDisposed', () => {
    it('does not throw if not disposed', () => {
      IDisposable.using(new RoaringUint8Array(5), p => {
        p.throwIfDisposed()
      })
    })

    it('throws if disposed', () => {
      const t = new RoaringUint8Array(4)
      t.dispose()
      expect(() => t.throwIfDisposed()).toThrow()
    })
  })
})
