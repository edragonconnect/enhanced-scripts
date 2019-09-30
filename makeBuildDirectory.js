const fs = require("fs-extra");
const utils = require("./utils");
const paths = require("./config/paths");

function cleanBuildDirectory() {
  if (paths.config.cleanLastBuild) {
    try {
      utils.info(
        "Clean up build folder " +
          utils.chalk.green(paths.config.dist) +
          " before run " +
          utils.chalk.green(script)
      );
      fs.emptyDirSync(paths.config.dist);
    } catch (error) {}
  }
}
function makeBuildDirectory() {
  try {
    !fs.existsSync(paths.config.dist) && fs.ensureDirSync(paths.config.dist);
  } catch (error) {}
}

module.exports = {
  cleanBuildDirectory,
  makeBuildDirectory
};
