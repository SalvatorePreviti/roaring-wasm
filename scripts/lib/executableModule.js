/* eslint no-console:0 */

const logging = require("./logging");

function handleError(error) {
  process.exitCode = -1;
  logging.error(error);
}

function executableModule(module, execute = module.exports) {
  if (require.main === module) {
    try {
      const result = execute();
      if (result && typeof result.then === "function" && typeof result.catch === "function") {
        result.then(() => {}).catch(handleError);
      }
    } catch (error) {
      handleError(error);
    }
  }
}

module.exports = executableModule;
