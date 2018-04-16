#!/usr/bin/env node

const logging = require('./lib/logging')
const clean = require('./clean')
const compileWasm = require('./compile-wasm')
const compileTs = require('./compile-ts')

async function compile() {
  await logging.time('compile', async () => {
    logging.log()
    await clean()
    await compileWasm()
    await compileTs()
    logging.log()
  })
  logging.log()
}

module.exports = compile

require('./lib/executableModule')(module)
