const chalk = require("chalk");
const _ = require("lodash");
const execSync = require("child_process").execSync;

exports.chalk = chalk;

exports.error = error => exports.print(chalk.red(`[ERROR] ${error}`));
exports.warn = warning => exports.print(chalk.yellow("[WARN]", warning));
exports.info = info => exports.print(chalk.cyan("[INFO]", info));
exports.ok = msg => exports.print(chalk.green(msg));
exports.fail = msg => exports.print(chalk.red(msg));
exports.print = log =>
  console.log(log ? (Array.isArray(log) ? log.join("") : log) : "");

exports.get = _.get;
exports.includes = _.includes;
exports.dryRequire = function dryRequire(path) {
  try {
    require.resolve(path);
  } catch (error) {
    return false;
  }
  return true;
};
exports.isFunction = _.isFunction;
exports.isPlainObject = _.isPlainObject;
exports.isUndef = v => _.isNil(v) || _.isNull(v) || _.isUndefined(v);
exports.isDef = v => !exports.isUndef(v);
exports.isEmpty = _.isEmpty;
exports.has = _.has;
exports.isString = _.isString;
const WebpackOptionsValidationError = require("webpack/lib/WebpackOptionsValidationError");
const validateWebpackSchema = require("webpack/lib/validateSchema");
exports.webpack = {
  validate(options) {
    const webpackOptionsValidationErrors = validateWebpackSchema(
      require("webpack/schemas/WebpackOptions.json"),
      options
    );
    if (webpackOptionsValidationErrors.length) {
      throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
    }
    return true;
  }
};
exports.shouldUseYarn = function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
};
