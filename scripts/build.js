#!/usr/bin/env node

const logging = require('./lib/logging')
const clean = require('./clean')
const compileWasm = require('./compile-wasm')
const compileTs = require('./compile-ts')
const test = require('./test')

async function build() {
  await logging.time('build', async () => {
    logging.log()
    await clean()
    await compileWasm()
    await compileTs()
    await test()
    logging.log()
  })
  logging.log()
}

module.exports = build

require('./lib/executableModule')(module)
