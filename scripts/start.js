process.env.NODE_ENV = "development";
process.env.BABEL_ENV = "development";
const checkDependencies = require("../checkDependencies");
const compile = require("../createCompiler");
const createConfig = require("../createConfig");
const utils = require("../utils");
const copyAssets = require("../copyAssets");
const watcher = require("../watcher");
const path = require("path");
const paths = require("../config/paths");
const { makeBuildDirectory } = require("../makeBuildDirectory");
require("../config/env");
checkDependencies("start").then(async apps => {
  makeBuildDirectory();
  let applications = await Promise.all(apps);
  applications = applications.map(app => ({
    config: createConfig("development", app),
    dir: path.dirname(app.entry)
  }));
  const findApplication = name =>
    applications.find(item => path.basename(item.dir) === name);
  const source = paths.config.src;
  watcher({
    dirs: applications.map(item => item.dir),
    onChange: async file => {
      const name = file
        .replace(`${source}/`, "")
        .split("/")
        .shift();
      const application = findApplication(name);
      if (application) {
        try {
          await compile(application.config, true);
          copyAssets({
            mode: "development",
            firstCompilation: false,
            name: name
          });
          utils.ok("Watching files");
        } catch (error) {
          Promise.reject(error);
        }
      }
    }
  });
  function createInitCompilation() {
    let compilations = 0;
    let hasFailedJob = false;
    applications.forEach(async ({ config, dir }, _, applications) => {
      utils.info("Compiling `" + path.basename(dir) + "`");
      try {
        await compile(config, true);
      } catch (error) {
        hasFailedJob = true;
        Promise.reject(error);
      }
      compilations += 1;
      if (compilations === applications.length) {
        if (!hasFailedJob) {
          copyAssets({
            mode: "development",
            firstCompilation: true,
            name: null
          });
          utils.ok("Watching files");
        } else {
          utils.print(utils.chalk.red("Watching files"));
        }
      }
    });
  }
  createInitCompilation();
});
