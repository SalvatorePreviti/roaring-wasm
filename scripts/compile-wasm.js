#!/usr/bin/env node

const path = require('path')
const util = require('util')
const globby = require('globby')
const mkdirpAsync = util.promisify(require('mkdirp'))
const root = require('./lib/root')
const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')
const emccConfig = require('./config/emcc-config')
const getFileSizesAsync = require('./lib/getFileSizesAsync')
const optimizeWasm = require('./optimize-wasm')
const executablePathFromEnv = require('./lib/executablePathFromEnv')

function emcc(files) {
  const emccPath = executablePathFromEnv('EMSCRIPTEN', null, 'emcc')

  return spawnAsync(emccPath, [...files, ...emccConfig.args, '-o', emccConfig.out], {
    stdio: 'inherit',
    cwd: root,
    env: Object.assign({}, process.env, {
      EMCC_CLOSURE_ARGS: `${emccConfig.closureArgs.join(' ')} ${process.env.EMCC_CLOSURE_ARGS || ''}`,
      EMMAKEN_CFLAGS: `-Wall -Wno-error=unused-local-typedefs -flto ${process.env.EMCC_CLOSURE_ARGS || ''}`,
    })
  })
}

async function compileWasm() {
  await mkdirpAsync(path.join(root, path.dirname(emccConfig.out)))

  const files = await globby(emccConfig.files, { root })

  await logging.time(`compile ${files.length} .c files`, () => emcc(files))

  const fileSizes = await getFileSizesAsync(`${emccConfig.out.substr(0, emccConfig.out.lastIndexOf('.'))}.*`)
  for (const f of fileSizes) {
    logging.keyValue(f.path, f.sizeString)
  }

  await optimizeWasm()
}

module.exports = compileWasm

require('./lib/executableModule')(module)
