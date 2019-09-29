const paths = require("./config/paths");
const utils = require("./utils");
let setupCopyAssets = null;
if (utils.dryRequire(paths.setupCopyAssets)) {
  setupCopyAssets = require(paths.setupCopyAssets);
}
module.exports = function copyAssets({ mode, application, firstCompilation }) {
  if (typeof setupCopyAssets === "function") {
    setupCopyAssets({
      mode,
      name: application && application.name,
      firstCompilation
    });
  }
};
