const path = require('path')
const util = require('util')
const globby = require('globby')
const mkdirpAsync = util.promisify(require('mkdirp'))
const root = require('./lib/root')
const logging = require('./lib/logging')
const spawnAsync = require('./lib/spawnAsync')
const emccConfig = require('./config/emcc-config')
const getFileSizesAsync = require('./lib/getFileSizesAsync')

async function listCppFiles() {
  const files = await globby(emccConfig.emcc.sources, { root })
  return files.map(file => path.relative(root, file))
}

async function compileWasm() {
  const files = await listCppFiles()
  await logging.time(`compile ${files.length} C files`, async () => {
    await mkdirpAsync(path.join(root, path.dirname(emccConfig.emcc.out)))
    await spawnAsync('emcc', [...files, ...emccConfig.emcc.args, '-o', emccConfig.emcc.out], {
      stdio: 'inherit',
      cwd: root,
      env: Object.assign({}, process.env, {
        EMCC_CLOSURE_ARGS: `${emccConfig.emcc.closureArgs.join(' ')} ${process.env.EMCC_CLOSURE_ARGS || ''}`
      })
    })
  })

  const fileSizes = await getFileSizesAsync(`${emccConfig.emcc.out.substr(0, emccConfig.emcc.out.lastIndexOf('.'))}.*`)
  for (const f of fileSizes) {
    logging.keyValue(f.path, f.sizeString)
  }
}

module.exports = compileWasm

require('./lib/executableModule')(module)
