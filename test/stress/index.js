const fs = require("fs");
const path = require("path");

const RoaringBitmap32 = require("../../dist/RoaringBitmap32");
const RoaringUint32Array = require("../../dist/RoaringUint32Array");
const logging = require("../../scripts/lib/logging");

const randoms = [];
for (let i = 0; i < 500; ++i) {
  randoms[i] = (Math.random() * 20000) >>> 0;
}

const buffers = fs
  .readFileSync(path.join(__dirname, "data.txt"), "utf8")
  .split("\n")
  .map((x) => Buffer.from(x.substr(2), "hex"));

logging.time("stress test", () => {
  const additional = new RoaringUint32Array(randoms);
  for (let repeat = 0; repeat < 100; ++repeat) {
    const disposables = [];
    for (const buffer of buffers) {
      const bmp = RoaringBitmap32.deserialize(buffer);
      bmp.addMany(additional);
      disposables.push(bmp);
    }
    for (const d of disposables) {
      d.dispose();
    }
  }
  additional.dispose();
});
