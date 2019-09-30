const getApplications = require("./getApplications");
const path = require("path");
const spawn = require("cross-spawn");
const utils = require("./utils");
const fs = require("fs-extra");

module.exports = async function checkDependencies(script) {
  utils.print();
  const isBuildScript = script === "build";
  return getApplications(script).map(async application => {
    const { package, file } = application;
    const directory = path.dirname(file);
    const name = path.basename(directory);
    const node_modules = path.resolve(directory, "node_modules");
    checkPackageOtherDeps(package);
    const hasDependencies = checkPackageDeps(package, name);
    removeNodeModules(isBuildScript && hasDependencies, node_modules);
    const deps = !hasDependencies
      ? []
      : collectDependencies(package.dependencies, node_modules, isBuildScript);
    if (deps.length > 0) {
      const installed = await install(deps, directory, name);
      utils.info(installed);
    }
    delete application.package;
    return application;
  });
};
/**
 * check package.dependencies
 */
function checkPackageDeps(package, name) {
  const hasDependencies = !utils.isEmpty(package.dependencies);
  const checkDependenciesLabel =
    (hasDependencies ? "Check" : "Skip check") +
    ` ${utils.chalk.yellow(name)}'s dependencies`;
  utils.info(checkDependenciesLabel);
  return hasDependencies;
}
/**
 * check <src>/<app-name>/package.json denpendencies
 * only allow packages should put to package.dependencies
 */

function checkPackageOtherDeps(package) {
  //ignore all following dependencies
  const ignoredDependencies = Object.keys(package).filter(item => {
    item = item.toLowerCase();
    return item.includes("dependencies") && item !== "dependencies";
  });
  if (ignoredDependencies.length > 0) {
    utils.error(
      "DO NOT Put denpendencies in " +
        ignoredDependencies.join(" or ") +
        ",put all dependencies to dependencies"
    );
    process.exit(1);
  }
}

/***
 * remove <src>/<app-name>/node_modules
 */

function removeNodeModules(shouldRemove, node_modules) {
  if (shouldRemove) {
    try {
      utils.info(`First,remove ${utils.chalk.yellow(node_modules)}`);
      fs.removeSync(node_modules);
    } catch (error) {}
  }
}

/***
 * use `require.resolve` to check dependency is installed
 */
function collectDependencies(dependencies, modules, isBuildScript) {
  const deps = [];
  utils.info(`Collecting dependencies...`);
  for (let dep in dependencies) {
    const packageVersion = `${dependencies[dep]}`.replace(/^\D/, "").trim();
    //for dev , just check deps in app own node_modules;
    if (isBuildScript || !utils.dryRequire(path.resolve(modules, dep))) {
      deps.push(`${dep}@${packageVersion}`);
    }
  }
  return deps;
}
function install(deps, cwd, appName) {
  utils.info(`Installing dependencies of ${utils.chalk.yellow(appName)} ...`);
  return new Promise((resolve, reject) => {
    let args;
    // yarn use --cwd
    // npm use --prefix
    if (utils.shouldUseYarn()) {
      command = "yarnpkg";
      args = ["add", ...deps, "--exact", "--cwd", cwd];
    } else {
      command = "npm";
      args = [
        "install",
        ...deps,
        "--prefix",
        cwd,
        "--save",
        "--save-exact",
        "--loglevel",
        "error"
      ];
    }
    const child = spawn(command, args);
    child.on("close", code => {
      if (code !== 0) {
        reject(`${command} ${args.join(" ")}`);
        return;
      }
      resolve("Dependencies of " + utils.chalk.yellow(appName) + " installed");
    });
  });
}
