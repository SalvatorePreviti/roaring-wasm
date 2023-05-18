const colors = require("chalk");
const util = require("util");
const path = require("path");
const fs = require("fs");
const { spawn, fork } = require("child_process");

const ROOT_FOLDER = path.resolve(__dirname, "../../");

module.exports = {
  ROOT_FOLDER,
  colors,
  timed,
  runMain,
  execAsync,
  spawnAsync,
  forkAsync,
  logError,
  getFileSizesAsync,
  executablePathFromEnv,
  isCI: (!!process.env.CI && process.env.CI !== "false") || process.argv.includes("--ci"),
};

function logError(e) {
  console.log(colors.redBright("❌ ", util.inspect(e, { colors: colors.level > 0 })));
}

function runMain(fn, title = fn.title) {
  if (title) {
    console.log(colors.blueBright(`\n⬢ ${colors.cyanBright(title)}\n`));
  }

  if (!fn.name) {
    Reflect.defineProperty(fn, "name", {
      value: "main",
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  const totalTime = () => (title ? `${colors.cyan(title)}` : "") + colors.italic(` ⌚ ${process.uptime().toFixed(2)}s`);

  let _processCompleted = false;

  const processCompleted = () => {
    if (!process.exitCode) {
      console.log(colors.greenBright("✅ OK"), totalTime());
    } else {
      console.log(colors.redBright(`❌ Failed: exitCode${process.exitCode}`), totalTime());
    }
    console.log();
  };

  process.on("exit", () => {
    if (!_processCompleted) {
      _processCompleted = true;
      processCompleted();
    }
  });

  const handleMainError = (e) => {
    if (!process.exitCode) {
      process.exitCode = 1;
    }
    console.log("❌ ", colors.redBright(util.inspect(e, { colors: colors.level > 0 })));
    console.log(totalTime());
    console.log();
  };

  try {
    const result = fn();
    if (typeof result === "object" && result && typeof result.then === "function") {
      result.then(() => {}, handleMainError);
    }
  } catch (e) {
    handleMainError(e);
  }
}

function timed(title, fn) {
  if (typeof title === "function" || typeof title === "object") {
    fn = title;
  }
  if (typeof title !== "string") {
    title = fn.name || "";
  }
  console.log(colors.cyan(`${colors.cyan("◆")} ${title}`) + colors.gray(" started..."));
  const startTime = performance.now();
  const logSuccess = (x) => {
    const elapsed = performance.now() - startTime;
    const elapsedStr = elapsed < 1000 ? `${elapsed.toFixed(0)}ms` : `${(elapsed / 1000).toFixed(2)}s`;
    const msg = `${colors.greenBright("✔")} ${colors.greenBright(title)} ${colors.greenBright.bold("OK")} ${colors.gray(
      `⌚ ${elapsedStr}`,
    )}`;
    console.log(msg);
    return x;
  };
  const handleError = (e) => {
    const elapsed = performance.now() - startTime;
    const elapsedStr = elapsed < 1000 ? `${elapsed.toFixed(0)}ms` : `${(elapsed / 1000).toFixed(2)}s`;
    const msg = `${colors.redBright("✖")} ${colors.redBright.redBright(title)} ${colors.redBright.underline.bold(
      "FAILED",
    )} ${colors.gray(`⌚ ${elapsedStr}`)}`;
    console.log(msg);
    throw e;
  };
  try {
    const ret = typeof fn === "function" ? fn() : fn;
    if (typeof ret === "object" && ret !== null && typeof ret.then === "function") {
      return ret.then(logSuccess, handleError);
    }
    return logSuccess(ret);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

function execAsync(command, options) {
  return new Promise((resolve, reject) => {
    require("child_process").exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { stdio: "inherit", ...options });
    childProcess.on("error", (e) => {
      reject(e);
    });
    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function forkAsync(modulePath, args, options) {
  return new Promise((resolve, reject) => {
    const childProcess = fork(modulePath, args, { stdio: "inherit", ...options });
    childProcess.on("error", (e) => {
      reject(e);
    });
    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${modulePath} exited with code ${code}`));
      }
    });
  });
}

async function getFileSizesAsync(patterns) {
  const files = await require("fast-glob")(patterns);
  return Promise.all(
    files.map(async (filePath) => {
      const stats = await fs.promises.stat(filePath);
      return {
        path: path.relative(ROOT_FOLDER, filePath),
        size: stats.size,
        sizeString: `${(stats.size * 0.001).toFixed(1)}kb`,
      };
    }),
  );
}

function executablePathFromEnv(envVariableName, subfolder, executableName) {
  const v = process.env[envVariableName];
  if (!v) {
    return executableName;
  }
  if (subfolder) {
    return path.resolve(path.join(v, subfolder, executableName));
  }
  return path.resolve(path.join(v, executableName));
}
