process.on("unhandledRejection", err => {
  if (err.name && err.name !== "compile_error") {
    throw err;
  }
});
const printBuildInfo = require("./printFormattedWebpackMessages");
const path = require("path");
const webpack = require("webpack");
const formatWebpackMessages = require("./formatWebpackMessages");
module.exports = async function createCompiler(config) {
  const compiler = webpack(config);
  const dirname = path.dirname(config.entry);
  const name = path.basename(dirname);
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      let messages;
      if (error) {
        if (!error.message) {
          return reject(error);
        }
        messages = formatWebpackMessages({
          errors: [error.message],
          warnings: []
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({
            all: false,
            warnings: false,
            errors: true
          })
        );
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        error = new Error(messages.errors.join("\n\n"));
      }
      if (error && error.name !== "WebpackOptionsValidationError") {
        error.name = "compile_error";
      }
      printBuildInfo(stats, error, name);
      return error ? reject(error) : resolve(stats);
    });
  });
};
