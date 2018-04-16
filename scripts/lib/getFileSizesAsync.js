const fs = require('fs')
const util = require('util')
const globby = require('globby')
const path = require('path')
const statAsync = util.promisify(fs.stat)
const root = require('./root')

async function getFileSizesAsync(patterns) {
  const files = await globby(patterns)
  return Promise.all(
    files.map(async filePath => {
      const stats = await statAsync(filePath)
      return {
        path: path.relative(root, filePath),
        size: stats.size,
        sizeString: `${(stats.size * 0.001).toFixed(1)}kb`
      }
    })
  )
}

module.exports = getFileSizesAsync
