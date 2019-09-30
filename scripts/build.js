process.env.NODE_ENV = "production";
process.env.BABEL_ENV = "production";
const utils = require("../utils");
require("../config/env");
const checkDenpendencies = require("../checkDependencies");
const compile = require("../createCompiler");
const copyAssets = require("../copyAssets");
const createConfig = require("../createConfig");
const {
  makeBuildDirectory,
  cleanBuildDirectory
} = require("../makeBuildDirectory");
checkDenpendencies("build").then(async applications => {
  makeBuildDirectory();
  cleanBuildDirectory();
  
  let compilations = 0;
  applications.forEach(async item => {
    const application = await item;
    utils.info("Start compile `" + application.name + "`");
    await compile(createConfig("production", application));
    compilations += 1;
    if (compilations === applications.length) {
      copyAssets({
        mode: "production",
        name: null,
        firstCompilation: true
      });
    }
  });
});
