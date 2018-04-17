#!/usr/bin/env node

const path = require('path')
const globby = require('globby')
const root = require('./lib/root')
const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')

async function doc() {
  const paths = [path.join(root, 'dist', '*.js'), path.join(root, 'dist', 'lib', '*.js')]
  const files = await globby(paths)
  files.sort()

  const args = ['readme', ...files, '--section=API']

  await logging.time('generate documentation', async () => {
    await spawnAsync('documentation', args, {
      stdio: 'inherit',
      cwd: path.join(root, 'dist')
    })
  })
}

module.exports = doc

require('./lib/executableModule')(module)
