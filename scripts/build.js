process.env.NODE_ENV = "production";
process.env.BABEL_ENV = "production";
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  if (err.name && err.name !== "compile_error") {
    throw err;
  }
});
const utils = require("../utils");
require("../config/env");
const checkDenpendencies = require("../checkDependencies");
const compile = require("../createCompiler");
const copyAssets = require("../copyAssets");
const createConfig = require("../createConfig");
checkDenpendencies("build").then(async applications => {
  let compilations = 0;
  applications.forEach(async item => {
    const application = await item;
    utils.info("Start compile `" + application.name + "`");
    try {
      await compile(createConfig("production", application));
      compilations += 1;
      if (compilations === applications.length) {
        copyAssets({
          mode: "production",
          name: null,
          firstCompilation: true
        });
      }
    } catch (error) {}
  });
});
