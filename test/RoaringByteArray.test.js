const RoaringByteArray = require('../RoaringByteArray')

describe('RoaringByteArray', () => {
  describe('creation', () => {
    it('should allocate 123 bytes', () => {
      RoaringByteArray.using(123, byteArray => {
        expect(byteArray.size).toBe(123)
      })
    })

    it('allows creation from an array', () => {
      RoaringByteArray.using([1, 2, 3], byteArray => {
        expect(byteArray.size).toBe(3)
        expect(byteArray.toArray()).toEqual([1, 2, 3])
      })
    })

    it('allows creation from Buffer', () => {
      const buffer = Buffer.from([1, 2, 3])
      RoaringByteArray.using(buffer, byteArray => {
        expect(byteArray.size).toBe(3)
        expect(byteArray.toArray()).toEqual([1, 2, 3])
      })
    })

    it('allows creation from Buffer view', () => {
      const sourceBuffer = Buffer.from([0, 1, 2, 3, 4, 5])
      const buffer = Buffer.from(sourceBuffer.buffer, sourceBuffer.byteOffset + 1, 3)
      RoaringByteArray.using(buffer, byteArray => {
        expect(byteArray.size).toBe(3)
        expect(byteArray.toArray()).toEqual([1, 2, 3])
      })
    })

    it('allows creation from an Uint8Array', () => {
      const buffer = Uint8Array.from([1, 2, 3])
      RoaringByteArray.using(buffer, byteArray => {
        expect(byteArray.size).toBe(3)
        expect(byteArray.toArray()).toEqual([1, 2, 3])
      })
    })

    it('allows creationg from an Uint8Array view', () => {
      const sourceBuffer = Uint8Array.from([0, 1, 2, 3, 4, 5])
      const buffer = sourceBuffer.subarray(1, 4)
      RoaringByteArray.using(buffer, byteArray => {
        expect(byteArray.size).toBe(3)
        expect(byteArray.toArray()).toEqual([1, 2, 3])
      })
    })

    it('should work with size 0', () => {
      let functorCalled = false
      RoaringByteArray.using(0, byteArray => {
        functorCalled = true
        expect(byteArray.size).toBe(0)
        expect(byteArray.typedArray.length).toBe(0)
      })
      expect(functorCalled).toBe(true)
    })

    it('creates a valid type', () => {
      RoaringByteArray.using(0, byteArray => {
        expect(byteArray).toBeInstanceOf(RoaringByteArray)
      })
    })
  })

  describe('clone', () => {
    it('should clone an empty array', () => {
      RoaringByteArray.using(0, byteArray => {
        RoaringByteArray.using(byteArray.clone(), cloned => {
          expect(cloned !== byteArray).toBe(true)
          expect(cloned.size).toBe(0)
        })
      })
    })
  })

  describe('typedArray', () => {
    it('should have a valid typedArray', () => {
      RoaringByteArray.using(123, byteArray => {
        const typedArray = byteArray.typedArray
        expect(typedArray).toBeInstanceOf(Uint8Array)
        expect(typedArray).toHaveLength(123)

        for (let i = 0; i < 123; ++i) {
          typedArray[i] = i
        }

        for (let i = 0; i < 123; ++i) {
          expect(typedArray[i]).toBe(i)
        }
      })
    })

    it('should return always the same instance of typedArray', () => {
      RoaringByteArray.using(123, byteArray => {
        expect(byteArray.typedArray).toBe(byteArray.typedArray)
      })
    })
  })

  describe('buffer', () => {
    it('should returns always the same instance', () => {
      RoaringByteArray.using(3, byteArray => {
        expect(byteArray.buffer).toBe(byteArray.buffer)
      })
    })

    it('should have a valid buffer', () => {
      RoaringByteArray.using(3, byteArray => {
        byteArray.typedArray[0] = 1
        byteArray.typedArray[1] = 2
        byteArray.typedArray[2] = 3
        expect(byteArray.buffer.byteLength).toEqual(3)
        expect(Array.from(byteArray.buffer)).toEqual([1, 2, 3])
      })
    })

    it('should be a view', () => {
      RoaringByteArray.using(2, byteArray => {
        byteArray.typedArray[0] = 1
        byteArray.typedArray[1] = 2
        byteArray.buffer[0] = 100
        byteArray.buffer[1] = 101
        expect(byteArray.typedArray[0]).toBe(100)
        expect(byteArray.typedArray[1]).toBe(101)
      })
    })

    it('should behave with size 0', () => {
      RoaringByteArray.using(0, byteArray => {
        expect(byteArray.buffer.byteLength).toBe(0)
      })
    })
  })

  describe('toArray', () => {
    it('should return an empty array for an empty RoaringByteArray', () => {
      RoaringByteArray.using(0, byteArray => {
        expect(byteArray.toArray()).toEqual([])
      })
    })

    it('should return a valid array', () => {
      RoaringByteArray.using(2, byteArray => {
        byteArray.typedArray[0] = 10
        byteArray.typedArray[1] = 20
        expect(byteArray.toArray()).toEqual([10, 20])
      })
    })
  })
})
