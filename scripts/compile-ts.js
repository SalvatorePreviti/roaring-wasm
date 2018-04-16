#!/usr/bin/env node

const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')
const root = require('./lib/root')

async function compileTs() {
  await logging.time('compile typescript', async () => {
    await spawnAsync('tsc', [], {
      stdio: 'inherit',
      cwd: root
    })
  })

  await logging.time('prettify output', async () => {
    await spawnAsync('prettier', ['--write', 'dist/**/*.js', 'dist/**/*.ts', 'dist/**/*.json'], {
      stdio: 'inherit',
      cwd: root
    })
  })
}

module.exports = compileTs

require('./lib/executableModule')(module)
