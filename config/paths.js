const fs = require("fs-extra");
const path = require("path");
const utils = require("../utils");
const yaml = require("yaml");
const yarg = require("yargs");
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const appPackageJson = resolveApp("package.json");
function ensureSlash(inputPath, needsSlash) {
  const hasSlash = inputPath.endsWith("/");
  if (hasSlash && !needsSlash) {
    return inputPath.substr(0, inputPath.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${inputPath}/`;
  } else {
    return inputPath;
  }
}
function getPublicPath() {
  const publicPath = require(appPackageJson).homepage || "/";
  return ensureSlash(publicPath, true);
}
function getIgnoredPaths(appPackageJson) {
  return require(appPackageJson).ignored_paths || [];
}

function getBuildConfig() {
  function getAppBuildConfigFile() {
    const useBuildConfig = utils.get(yarg.argv, "useConfig", null);
    return useBuildConfig &&
      (useBuildConfig.endsWith(".yml") || useBuildConfig.endsWith(".yaml"))
      ? resolveApp(useBuildConfig)
      : null;
  }
  const file = getAppBuildConfigFile();
  const srcName = "apps";

  const dist = utils.get(yarg.argv, "dist", "build");
  const config = {
    excludes: [],
    only: utils.get(yarg.argv, "only", null),
    dist: resolveApp(dist),
    cleanLastBuild: utils.get(yarg.argv, "clean", "YES") === "YES",
    generateSourceMap: utils.get(yarg.argv, "sourceMap", "YES") === "YES",
    file: null,
    ignore: [],
    src: resolveApp(srcName)
  };

  if (file) {
    try {
      const json = yaml.parse(fs.readFileSync(file).toString());
      if (json) {
        const only = utils.get(json, "only", null);
        const dist = utils.get(json, "dist", null);
        const sourceMap = utils.get(json, "generate_source_map", null);
        const cleanLastBuild = utils.get(json, "clean_last_build", null);
        const excludes = utils.get(json, "excludes", null);
        if (cleanLastBuild) {
          config.cleanLastBuild = cleanLastBuild === "YES";
        }
        if (sourceMap) {
          config.generateSourceMap = sourceMap === "YES";
        }
        if (Array.isArray(excludes) && !only) {
          config.excludes = excludes;
        }
        if (only) {
          config.only = only;
        }
        if (dist) {
          config.dist = resolveApp(dist);
        }
        config.file = file;
      }
    } catch (error) {}
  }

  const ignore = getIgnoredPaths(appPackageJson);
  if (ignore.length) {
    config.ignore = ignore.map(ignore => {
      if (ignore.startsWith(srcName) || ignore.startsWith(`/${srcName}`)) {
        return resolveApp(ignore);
      }
      return path.resolve(appDirectory, srcName, ignore);
    });
  }
  if (config.excludes.length > 0 && !config.only) {
    config.excludes = config.excludes.map(exclude =>
      path.resolve(config.src, exclude)
    );
  }
  return config;
}
module.exports = {
  appPackageJson: appPackageJson,
  config: getBuildConfig(),
  appNodeModules: resolveApp("node_modules"),
  appWebpackConfig: resolveApp("webpack.config.js"),
  appTsConfig: resolveApp("tsconfig.json"),
  appPath: resolveApp("."),
  setupCopyAssets: resolveApp("setupCopyAssets.js"),
  servedPath: getPublicPath(appPackageJson),
  resolveApp: resolveApp,
  dotenv: resolveApp(".env"),
  extension: [
    "web.mjs",
    "mjs",
    "web.js",
    "js",
    "web.ts",
    "ts",
    "web.tsx",
    "tsx",
    "json",
    "web.jsx",
    "jsx"
  ]
};
