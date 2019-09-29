const {
  builtMessage,
  failedMessage,
  formatWebpackStatsError
} = require("./displayBuildMessage");
const path = require("path");
const webpack = require("webpack");
module.exports = async function createCompiler(config) {
  const compiler = webpack(config);
  const dirname = path.dirname(config.entry);
  const basename = path.basename(dirname);
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      const formattdError = formatWebpackStatsError(
        error,
        stats.toJson({ all: false, warnings: false, errors: true })
      );
      if (formattdError) {
        return reject(formattdError);
      }
      return resolve(stats);
    });
  })
    .then(stats => {
      builtMessage(basename, stats, config.mode === "production");
    })
    .catch(error => {
      failedMessage(basename, error);
      if (error.name !== "WebpackOptionsValidationError") {
        error.name = "compile_error";
      }
      return Promise.reject(error);
    });
};
