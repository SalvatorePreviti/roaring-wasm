#!/usr/bin/env node

const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')

async function test() {
  await logging.time('test', async () => {
    await spawnAsync('jest')
  })
}

module.exports = test

require('./lib/executableModule')(module)
