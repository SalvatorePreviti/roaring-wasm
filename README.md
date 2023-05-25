# roaring-wasm

WebAssembly port of [Roaring Bitmaps](http://roaringbitmap.org) for Node, Browser and Deno.
It is interoperable with other implementations via the [Roaring format](https://github.com/RoaringBitmap/RoaringFormatSpec/).

Roaring bitmaps are compressed bitmaps. They can be hundreds of times faster.

## NOTE

This package is intended as a stripped down cross platform and broewser alternative to [roaring-node](https://www.npmjs.com/package/roaring), [repository](https://github.com/SalvatorePreviti/roaring-node).
If you are using just NodeJS, [roaring-node](https://github.com/SalvatorePreviti/roaring-node) is faster, has a better API that fully leverages the v8 garbage collector and the native CPU SIMD instructions, and has also asynchronous operations.

## installation

```sh
npm install --save roaring-wasm
```

Try it live - <https://npm.runkit.com/roaring-wasm>

Code sample:

```javascript
// npm install --save roaring-wasm
// create this file as demo.js
// type node demo.js or nodejs demo.js depending on your system

import { RoaringBitmap32, roaringLibraryInitialize } from "roaring-wasm";

// This is needed in browser (and in this case we are using top level await), in nodejs this is not required.
await roaringLibraryInitialize();

var bitmap1 = new RoaringBitmap32();
bitmap1.addMany([1, 2, 3, 4, 5, 100, 1000]);
console.log("bitmap1.toSet():", bitmap1.toSet());

var bitmap2 = new RoaringBitmap32();
bitmap2.addMany([3, 4, 1000]);
console.log("bitmap2.toSet():", bitmap1.toSet());

var bitmap3 = new RoaringBitmap32();
console.log("bitmap1.cardinality():", bitmap1.cardinality());
console.log("bitmap2.contains(3):", bitmap2.contains(3));

bitmap3.add(111);
bitmap3.add(544);
bitmap3.orInPlace(bitmap1);
bitmap1.optimize();
console.log(bitmap3.toString());

console.log("bitmap3.toArray():", bitmap3.toArray());
console.log("bitmap3.maximum():", bitmap3.maximum());
console.log("bitmap3.rank(100):", bitmap3.rank(100));

bitmap1.dispose();
bitmap2.dispose();
bitmap3.dispose();
```

## Documentation

[https://salvatorepreviti.github.io/roaring-wasm](https://salvatorepreviti.github.io/roaring-wasm/modules.html)

## References

- [roaring for NodeJS](https://www.npmjs.com/package/roaring), [repository](https://github.com/SalvatorePreviti/roaring-node)

- This package - <https://www.npmjs.com/package/roaring-wasm>

- Source code and build tools for this package - <https://github.com/SalvatorePreviti/roaring-wasm>

- Roaring Bitmaps - <http://roaringbitmap.org/>

- Portable Roaring bitmaps in C - <https://github.com/RoaringBitmap/CRoaring>

- emscripten - <https://github.com/kripken/emscripten/wiki>

# Licenses

- This package is provided as open source software using Apache License.

- CRoaring is provided as open source software using Apache License.

# API

See the [roaring module documentation](https://salvatorepreviti.github.io/roaring-wasm/modules.html)

# Other

Wanna play an open source game made by the author of this library? Try [Dante](https://github.com/SalvatorePreviti/js13k-2022)

# Development, local building

This project requires emsdk installed and activated. See <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

On mac you can install emscripten with homebrew:

```
brew install emscripten
```

To download the repository:

```
git clone https://github.com/SalvatorePreviti/roaring-wasm.git

cd roaring-wasm

git submodule update --init --recursive

npm install
```

To compile and run test

```
npm run build
```

Output will be generated in the `packages/roaring-wasm` folder

The build system was tried on Linux and MacOSX, is not tested/maintained for other system or Windows.
