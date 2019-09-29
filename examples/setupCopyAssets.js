const utils = require("./node_modules/scriptx/utils");
const path = require("path");
module.exports = ({ mode, name, firstCompilation }) => {
  utils.warn("setupCopyAssets.js " + path.resolve("./setupCopyAssets.js"));
  utils.warn(`webpack mode:${mode}`);
  utils.warn(`copied application name :${name}`);
  utils.warn(`is firstCompilation : ${firstCompilation}`);
};
