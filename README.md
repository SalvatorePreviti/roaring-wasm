# roaring-wasm

WebAssembly port of Roaring Bitmaps for NodeJS.

Roaring bitmaps are compressed bitmaps. They can be hundreds of times faster.

## motivation

This project was born to use Roaring WASM in AWS Lambdas without the need to compile a node-gyp module.
AWS Lambda supports node 8.10 and supports WASM.

## installation

```sh
npm install --save roaring-wasm
```

Try it live - <https://npm.runkit.com/roaring-wasm>

## references

This package - <https://www.npmjs.com/package/roaring-wasm>

Source code and build tools for this package - <https://github.com/SalvatorePreviti/roaring-wasm>

Roaring Bitmaps - <http://roaringbitmap.org/>

Portable Roaring bitmaps in C - <https://github.com/RoaringBitmap/CRoaring>

emscripten - <https://github.com/kripken/emscripten/wiki>

AWS Lambda - <https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html>

# licenses

* This package is provided as open source software using Apache License.

* CRoaring is provided as open source software using Apache License.

# API

API documentation [dist/README.md](dist/README.md)

# Development, local building

This project requires emsdk installed and activated. See <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

On a \*nix machine, run `sh source .envrc` to initialize paths, nvm (if present) and emsdk.

To compile, run test and generate the documentation

```
npm start
```

Output will be generated in the `dist` folder

The build system was tried on MacOSX, is not tested/maintained for other system.
