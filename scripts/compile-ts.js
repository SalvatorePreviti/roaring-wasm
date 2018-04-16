#!/usr/bin/env node

const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')

async function compileTs() {
  await logging.time('compile typescript', async () => {
    await Promise.all([spawnAsync('tslint', ['-p', 'tsconfig.json', '-t', 'stylish']), spawnAsync('tsc', ['-p', 'tsconfig.json'])])
    await Promise.all([spawnAsync('tslint', ['-p', 'test/tsconfig.json', '-t', 'stylish']), spawnAsync('tsc', ['-p', 'test/tsconfig.json'])])
  })

  await logging.time('prettify output', async () => {
    await spawnAsync('eslint', ['--fix', 'dist/**/*.js'])
    await spawnAsync('prettier', ['--write', 'dist/**/*.js', 'dist/**/*.ts', 'dist/**/*.json'])
  })
}

module.exports = compileTs

require('./lib/executableModule')(module)
