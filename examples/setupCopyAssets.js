const utils = require("./node_modules/enhanced-scripts/utils");
const path = require("path");
module.exports = ({ mode, name, firstCompilation }) => {
  utils.warn(`webpack mode:${mode}`);
  utils.warn(`copied application name :${name}`);
  utils.warn(`is firstCompilation : ${firstCompilation}`);
};
