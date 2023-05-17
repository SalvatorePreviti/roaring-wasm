const childProcess = require("child_process");
const root = require("./root");

function promisifyChildProcess(child, command = "operation") {
  return new Promise((resolve, reject) => {
    let errored = false;

    function handleError(error) {
      if (!errored) {
        errored = true;
        if (error instanceof Error) {
          reject(error);
        } else {
          if (typeof error === "number") {
            error = `ErrorCode:${error}`;
          }
          const e = new Error(`${command} failed. ${error}`);
          e.stack = e.message;
          reject(e);
          e.stack = e.message;
        }
      }
    }

    try {
      if (typeof child === "function") {
        child = child();
      }

      child.on("error", handleError);
      child.on("exit", (error) => {
        if (!errored) {
          if (error) {
            handleError(error);
          } else {
            resolve();
          }
        }
      });
    } catch (error) {
      handleError(error);
    }
  });
}

function spawnAsync(command, args = [], options = { stdio: "inherit", cwd: root }) {
  return promisifyChildProcess(() => {
    return childProcess.spawn(command, args, options);
  });
}

spawnAsync.promisifyChildProcess = promisifyChildProcess;

module.exports = spawnAsync;
