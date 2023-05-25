import { expect } from "chai";
import { dispose, disposeThis, isDisposable, tryDispose, using } from "roaring-wasm-src";

describe("IDisposable utils", () => {
  describe("isDisposable", () => {
    it("should return true for an object with a dispose method", () => {
      expect(isDisposable({ dispose: () => true })).eq(true);
    });
    it("should return false for an object without a dispose method", () => {
      expect(isDisposable({})).eq(false);
    });
    it("should return false for a null object", () => {
      expect(isDisposable(null)).eq(false);
    });
    it("should return false for a number", () => {
      expect(isDisposable(1)).eq(false);
    });
    it("should return false for a string", () => {
      expect(isDisposable("")).eq(false);
    });
    it("should return false for a boolean", () => {
      expect(isDisposable(true)).eq(false);
    });
    it("should return false for undefined", () => {
      expect(isDisposable(undefined)).eq(false);
    });
  });

  describe("dispose", () => {
    it("should return false for undefined", () => {
      expect(dispose(undefined)).eq(false);
    });
    it("should return false for null", () => {
      expect(dispose(null)).eq(false);
    });
    it("should return false for an object without a dispose method", () => {
      expect(dispose({} as any)).eq(false);
    });
    it("should return true for an object with a dispose method", () => {
      expect(dispose({ dispose: () => true })).eq(true);
    });
  });

  describe("disposeThis", () => {
    it("should return false for undefined", () => {
      // eslint-disable-next-line no-useless-call
      expect(disposeThis.call(undefined)).eq(false);
    });
    it("should return false for null", () => {
      // eslint-disable-next-line no-useless-call
      expect(disposeThis.call(null)).eq(false);
    });
    it("should return false for an object without a dispose method", () => {
      expect(disposeThis.call({} as any)).eq(false);
    });
    it("should return true for an object with a void dispose method", () => {
      expect(disposeThis.call({ dispose: () => {} })).eq(true);
    });
    it("should return true for an object with a dispose method", () => {
      let disposeCount = 0;
      const obj = {
        dispose: () => {
          return ++disposeCount === 1;
        },
      };
      expect(disposeThis.call(obj)).eq(true);
      expect(disposeCount).eq(1);
      expect(disposeThis.call(obj)).eq(false);
      expect(disposeCount).eq(2);
    });
  });

  describe("tryDispose", () => {
    it("should return false for undefined", () => {
      expect(tryDispose(undefined)).eq(false);
    });
    it("should return false for null", () => {
      expect(tryDispose(null)).eq(false);
    });
    it("should return false for an object without a dispose method", () => {
      expect(tryDispose({} as any)).eq(false);
    });
    it("should return true for an object with a void dispose method", () => {
      expect(tryDispose({ dispose: () => {} })).eq(true);
    });
    it("should return true for an object with a dispose method", () => {
      let disposeCount = 0;
      const obj = {
        dispose: () => {
          return ++disposeCount === 1;
        },
      };
      expect(tryDispose(obj)).eq(true);
      expect(disposeCount).eq(1);
      expect(tryDispose(obj)).eq(false);
      expect(disposeCount).eq(2);
    });
    it("should return false if dispose throws", () => {
      const obj = {
        dispose: () => {
          throw new Error("test");
        },
      };
      expect(tryDispose(obj)).eq(false);
    });
  });

  describe("using", () => {
    describe("using with function", () => {
      it("should dispose the object if the callback throws", () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        expect(() =>
          using(obj, (v) => {
            expect(v).eq(obj);
            throw new Error("using-test");
          }),
        ).to.throw("using-test");
        expect(disposeCount).eq(1);
      });

      it("should dispose the object if the callback returns a value", () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        expect(
          using(obj, (v) => {
            expect(v).eq(obj);
            return 112;
          }),
        ).eq(112);
        expect(disposeCount).eq(1);
      });

      it("should dispose the object if the callback returns a promise that rejects", async () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        const error = new Error("using-test");
        let thrown: unknown;
        try {
          await using(obj, (v) => {
            expect(v).eq(obj);
            return Promise.reject(error);
          });
        } catch (e) {
          thrown = e;
        }
        expect(disposeCount).eq(1);
        expect(thrown).eq(error);
      });

      it("should dispose the object if the callback returns a promise that resolves", async () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        await using(obj, (v) => {
          expect(v).eq(obj);
          return Promise.resolve();
        });
        expect(disposeCount).eq(1);
      });
    });

    describe("using with value", () => {
      it("should just dispose the object and return the value if is not a promise", () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        expect(using(obj, 112)).eq(112);
        expect(disposeCount).eq(1);
      });

      it("should dispose the object if the value is a promise that rejects", async () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        const error = new Error("using-test");
        let thrown: unknown;
        try {
          await using(obj, Promise.reject(error));
        } catch (e) {
          thrown = e;
        }
        expect(disposeCount).eq(1);
        expect(thrown).eq(error);
      });

      it("should dispose the object if the value is a promise that resolves", async () => {
        let disposeCount = 0;
        const obj = {
          dispose: () => {
            ++disposeCount;
          },
        };
        await using(obj, Promise.resolve());
        expect(disposeCount).eq(1);
      });
    });
  });
});
