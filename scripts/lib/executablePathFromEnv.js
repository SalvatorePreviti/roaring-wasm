const path = require('path')
const logging = require('./logging')

function executablePathFromEnv(envVariableName, subfolder, executableName) {
  const v = process.env[envVariableName]
  if (!v) {
    logging.warning(`environment variable ${envVariableName} not found`)
    return executableName
  }
  if (subfolder) {
    return path.resolve(path.join(v, subfolder, executableName))
  }
  return path.resolve(path.join(v, executableName))
}

module.exports = executablePathFromEnv
