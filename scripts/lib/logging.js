/* eslint no-console:0 */

const chalk = require("chalk").default;

const hasIcons = !!(chalk.supportsColor.has256 || process.env.CI);
const icons = {
  info: chalk.cyan(hasIcons ? "•" : "*"),
  success: chalk.green(hasIcons ? "✔" : "√"),
  warning: chalk.yellow(hasIcons ? "⚠" : "‼"),
  error: chalk.red(hasIcons ? "✖" : "×"),
  bulletSuccess: chalk.green(hasIcons ? "•" : "*"),
  block: chalk.blueBright(hasIcons ? chalk.bold("▪") : "-"),
};

const logging = {
  chalk,

  log(...args) {
    console.log(...args);
  },

  keyValue(key, value) {
    console.log(`${icons.bulletSuccess} ${chalk.green(key)} ${chalk.cyanBright(`${value}`)}`);
  },

  info(description) {
    console.log(`• ${chalk.cyan(description)}`);
  },

  success(description) {
    console.log(this.getSuccess(description));
  },

  failure(description) {
    console.log(`${icons.error} ${chalk.yellow(description)}: ${chalk.redBright.bold("Failed.")}`);
  },

  error(error) {
    console.log(`${icons.error} ${chalk.redBright((error && (error.stack || error)) || "Error")}\n`);
  },

  warning(description) {
    console.log(`${icons.warning} ${chalk.yellow(description)}`);
  },

  getSuccess(description) {
    return chalk.greenBright(`${chalk.bold(icons.success)} ${description}`);
  },

  time(description, functor = null) {
    if (!functor) {
      if (typeof description === "function") {
        functor = description;
        description = description.name;
      } else {
        console.time(description);
        return description;
      }
    }

    const successText = logging.getSuccess(description);
    console.log();
    console.log(`${icons.block} ${chalk.cyanBright(description)} ...`);
    console.time(successText);
    let result;
    try {
      result = typeof functor === "function" ? functor() : functor;
    } catch (error) {
      logging.failure(description);
      throw error;
    }
    if (result && typeof result.then === "function") {
      result = result.then((x) => {
        logging.timeEnd(successText);
        return x;
      });

      if (typeof result.catch === "function") {
        result = result.catch((error) => {
          logging.failure(description);
          console.log();
          throw error;
        });
      }
    } else {
      logging.timeEnd(successText);
    }
    return result;
  },

  timeEnd(description) {
    console.timeEnd(description);
  },
};

module.exports = logging;
