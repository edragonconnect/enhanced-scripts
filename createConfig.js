const configFactory = require("./config/webpack.config");
const webpackConfigMerger = require("webpack-merge");
const utils = require("./utils");
const paths = require("./config/paths");
function getConfig(file, mode) {
  if (!utils.dryRequire(file)) {
    return null;
  }
  try {
    return require(file)(mode);
  } catch (error) {
    return null;
  }
}
const mergeWithDefaults = (configs, defaults) => {
  if (configs.length > 0) {
    return configs.reduce((acc, config) => {
      const merged = config(acc);
      if (utils.isPlainObject(merged)) {
        for (let key in merged) {
          acc[key] = merged[key];
        }
      }
      return acc;
    }, defaults);
  }
  return defaults;
};

const fetchConfig = (configFile, mode, defaults) => {
  const configs = getConfig(configFile, mode);
  if (utils.isPlainObject(configs)) {
    const postcss = utils.get(configs, "postcss", null);
    const babel = utils.get(configs, "babel", null);
    const webpack = utils.get(configs, "webpack", null);
    if (typeof webpack === "function") {
      const config = webpack(mode);
      if (utils.isPlainObject(config)) {
        const rules = utils.get(config, "module.rules", null);
        if (Array.isArray(rules)) {
          let oneOf = rules.find(rule => rule.oneOf);
          if (oneOf) {
            defaults.loaders = [...oneOf.oneOf, ...defaults.loaders];
          } else {
            defaults.loaders = [...rules, ...defaults.loaders];
          }
          delete config.module.rules;
        }
        defaults.configs.unshift(config);
      }
    }
    if (utils.isFunction(babel)) {
      defaults.babel.push(babel);
    }
    if (utils.isFunction(postcss)) {
      defaults.postcss.push(postcss);
    }
  }
};

/**
 *
 * @param {*} mode
 * @param {*} app {name,entry,webpackConfig}
 */

function createConfig(mode, app) {
  const webpack = {
    configs: [],
    babel: [],
    postcss: [],
    loaders: []
  };
  //<project-root>/webpack.config.js
  fetchConfig(paths.appWebpackConfig, mode, webpack);
  // <src>/<someapp>/webpack.config.js
  fetchConfig(app.webpackConfig, mode, webpack);
  const defaults = configFactory(mode, {
    postcss: postcss => mergeWithDefaults(webpack.postcss, postcss),
    babel: babel => mergeWithDefaults(webpack.babel, babel),
    name: app.name,
    entry: app.entry
  });
  const disableRequireEnsure = defaults.module.rules[0];
  const rules = defaults.module.rules[1];
  const merged = webpackConfigMerger([
    ...webpack.configs,
    {
      ...defaults,
      module: {
        ...defaults.module,
        rules: [
          disableRequireEnsure,
          {
            oneOf: [...webpack.loaders, ...rules.oneOf]
          }
        ]
      }
    }
  ]);
  return utils.webpack.validate(merged) && merged;
}

module.exports = createConfig;
