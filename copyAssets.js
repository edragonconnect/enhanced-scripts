const paths = require("./config/paths");
const utils = require("./utils");
let setupCopyAssets = null;
if (utils.dryRequire(paths.setupCopyAssets)) {
  setupCopyAssets = require(paths.setupCopyAssets);
}
module.exports = function copyAssets({ mode, name, firstCompilation }) {
  if (typeof setupCopyAssets === "function") {
    utils.warn("Using setupCopyAssets.js => " + paths.setupCopyAssets);
    setupCopyAssets({
      mode,
      name: name,
      firstCompilation
    });
  }
};
