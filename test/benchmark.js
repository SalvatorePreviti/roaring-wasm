/* eslint node/no-unpublished-require:0 */

const RoaringUint32Array = require("../dist/RoaringUint32Array");
const RoaringBitmap32 = require("../dist/RoaringBitmap32");
const { timed } = require("../scripts/lib/utils");

function randomRoaringUint32Array(size, maxValue, seed = 18397123) {
  const set = new Set();
  while (set.size < size) {
    seed = (seed * 16807) % 2147483647;
    set.add(seed & maxValue);
  }

  return new RoaringUint32Array(set);
}

let src;

timed("random data", () => {
  src = randomRoaringUint32Array(1000000, 0xffffff);
});

timed(`sort`, () => {
  src.asTypedArray().sort();
});

const bitmap = new RoaringBitmap32();

timed(`add ${src.length} values`, () => {
  bitmap.addMany(src);
});

let buf;

timed("serialize", () => {
  buf = bitmap.serializeToRoaringUint8Array();
});

// eslint-disable-next-line no-console
console.log("*", buf.byteLength, "bytes serialized");

timed("dispose", () => {
  src.dispose();
  buf.dispose();
  bitmap.dispose();
});
