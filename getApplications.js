const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");
const paths = require("./config/paths");
const utils = require("./utils");
function validateApplicationPackage(pkg, file, entry) {
  let isValid = true;
  let message = "";
  if (!pkg || (typeof pkg === "object" && Object.keys(pkg).length <= 0)) {
    message = `Invalid Package:`;
    isValid = false;
  }
  if (!pkg.name) {
    message = "Invalid Package: package should have the key `name` : ";
    isValid = false;
  }
  if (!pkg.main) {
    message =
      "Invalid Package: package should have the key `main`, and value should be `index.js` : ";
    isValid = false;
  }
  if (isValid) {
    if (!utils.dryRequire(entry)) {
      utils.error(
        `Package ${file} is validated,\n But entry ${entry} does not exist`
      );
      return false;
    }
  } else {
    utils.error(message + file);
  }
  return isValid;
}
module.exports = function getApplications(script) {
  utils.info(
    "Read all `package.json` from " + utils.chalk.green(paths.config.src)
  );
  if (paths.config.file) {
    utils.info(`Using build config file: ${paths.config.file}`);
  }
  let packages = glob.sync(`${paths.config.src}/*/package.json`);
  packages.sort();
  if (paths.config.only) {
    utils.info(
      `Build application only: ${utils.chalk.yellow(paths.config.only)}`
    );
    packages = packages.filter(file => {
      const { dir } = path.parse(file);
      const { base: applicationName } = path.parse(dir);
      return paths.config.only === applicationName;
    });
  }
  const ignore = paths.config.ignore;
  if (ignore.length > 0) {
    utils.warn(
      `These packages will not be resovled as webpack entry but still will be compiled:\n${ignore
        .map(item => `       ${item}`)
        .join("\n")}`
    );
    packages = packages.filter(packagePath => {
      const dirname = path.dirname(packagePath);
      return !ignore.includes(dirname);
    });
  }
  const excludes = paths.config.excludes;
  if (excludes.length > 0) {
    const displayExcludes = excludes.map(item => `       ${item}`).join("\n");
    utils.warn(`These Applications will not be compiled:\n${displayExcludes}`);
    packages = packages.filter(app => {
      return !excludes.includes(path.dirname(app));
    });
  }

  packages = packages.map(file => {
    const package = require(file);
    //package.json file directory
    const applicationName = path.basename(path.dirname(file));
    const applicationPath = relativePath =>
      path.resolve(paths.config.src, applicationName, relativePath);
    // resolve entry file
    const entry = applicationPath("index.js");
    //check the keys `name` & `main` & `index.js`
    if (!validateApplicationPackage(package, file, entry)) {
      return null;
    }
    return {
      package,
      file,
      name: applicationName,
      entry,
      webpackConfig: applicationPath("webpack.config.js")
    };
  });
  packages = packages.filter(item => !utils.isUndef(item));
  if (packages.length <= 0) {
    utils.print();
    utils.error(
      "No validated packages found in " +
        utils.chalk.underline(paths.config.src)
    );
    utils.error(
      "A valid package should includes files `package.json` and `index.js`, \n" +
        "        package.json should includes key `name` and key `main`,\n" +
        "        value of `main` should be `index.js` "
    );
    utils.print();
    process.exit(0);
  }
  return packages;
};
