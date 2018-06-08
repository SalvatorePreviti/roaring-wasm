# roaring-wasm

WebAssembly port of [Roaring Bitmaps](http://roaringbitmap.org) for NodeJS. It is interoperable with other implementations via the [Roaring format](https://github.com/RoaringBitmap/RoaringFormatSpec/).

Roaring bitmaps are compressed bitmaps. They can be hundreds of times faster.

## NOTE

Implementation of all features is not complete.
For a complete native implementation, much faster and easier to use than this package, you can use:

- [roaring](https://www.npmjs.com/package/roaring) - NodeJS Roaring bitmaps as a native addon. https://github.com/SalvatorePreviti/roaring-node
- [roaring-aws](https://www.npmjs.com/package/roaring-aws) - NodeJS roaring bitmaps precompiled for AWS Lambda (Serverless compatible). ttps://github.com/SalvatorePreviti/roaring-node-aws

## motivation

This project was born to use Roaring WASM in AWS Lambdas without the need to compile a node-gyp module.
AWS Lambda supports node 8.10 and supports WASM.

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

var roaring = require('roaring-wasm')

var bitmap1 = new roaring.RoaringBitmap32()
bitmap1.addMany([1, 2, 3, 4, 5, 100, 1000])
console.log('bitmap1.toSet():', bitmap1.toSet())

var bitmap2 = new roaring.RoaringBitmap32()
bitmap2.addMany([3, 4, 1000])
console.log('bitmap2.toSet():', bitmap1.toSet())

var bitmap3 = new roaring.RoaringBitmap32()
console.log('bitmap1.cardinality():', bitmap1.cardinality())
console.log('bitmap2.contains(3):', bitmap2.contains(3))

bitmap3.add(111)
bitmap3.add(544)
bitmap3.orInPlace(bitmap1)
bitmap1.optimize()
console.log(bitmap3.toString())

console.log('bitmap3.toArray():', bitmap3.toArray())
console.log('bitmap3.maximum():', bitmap3.maximum())
console.log('bitmap3.rank(100):', bitmap3.rank(100))

bitmap1.dispose()
bitmap2.dispose()
bitmap3.dispose()
```

## references

This package - <https://www.npmjs.com/package/roaring-wasm>

Source code and build tools for this package - <https://github.com/SalvatorePreviti/roaring-wasm>

Roaring Bitmaps - <http://roaringbitmap.org/>

Portable Roaring bitmaps in C - <https://github.com/RoaringBitmap/CRoaring>

emscripten - <https://github.com/kripken/emscripten/wiki>

AWS Lambda - <https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html>

# licenses

- This package is provided as open source software using Apache License.

- CRoaring is provided as open source software using Apache License.

# API

API documentation [dist/README.md](dist/README.md)

# Development, local building

This project requires emsdk installed and activated. See <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

On a \*nix machine, run `sh source .envrc` to initialize paths, nvm (if present) and emsdk.

To compile, run test and generate the documentation

```
git submodule update --init --recursive

npm start
```

Output will be generated in the `dist` folder

The build system was tried on MacOSX, is not tested/maintained for other system.
