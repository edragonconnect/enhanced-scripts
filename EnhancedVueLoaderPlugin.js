const qs = require("querystring");
const RuleSet = require("webpack/lib/RuleSet");
const path = require("path");
const id = "vue-loader-plugin";
const NS = "vue-loader";
function getVueRule(rules) {
  let vueRuleIndex = rules.findIndex(createMatcher(`foo.vue`));
  if (vueRuleIndex < 0) {
    vueRuleIndex = rules.findIndex(createMatcher(`foo.vue.html`));
  }
  return rules[vueRuleIndex] ? rules[vueRuleIndex] : null;
}

class EnhancedVueLoaderPlugin {
  constructor(vueLoaderPath) {
    let dirname = path.dirname(vueLoaderPath);
    if (dirname.endsWith("/lib")) {
      dirname = dirname.replace("/lib", "").trim();
    }
    if (dirname.endsWith("/vue-loader")) {
      dirname = dirname.replace("/vue-loader", "").trim();
    }
    this.vueLoaderParentDir = dirname;
  }
  apply(compiler) {
    // add NS marker so that the loader can detect and report missing plugin
    if (compiler.hooks) {
      // webpack 4
      compiler.hooks.compilation.tap(id, compilation => {
        let normalModuleLoader;
        if (Object.isFrozen(compilation.hooks)) {
          // webpack 5
          normalModuleLoader = require("webpack/lib/NormalModule").getCompilationHooks(
            compilation
          ).loader;
        } else {
          normalModuleLoader = compilation.hooks.normalModuleLoader;
        }
        normalModuleLoader.tap(id, loaderContext => {
          loaderContext[NS] = true;
        });
      });
    } else {
      // webpack < 4
      compiler.plugin("compilation", compilation => {
        compilation.plugin("normal-module-loader", loaderContext => {
          loaderContext[NS] = true;
        });
      });
    }
    // use webpack's RuleSet utility to normalize user rules
    const rawRules = compiler.options.module.rules;
    const { rules } = new RuleSet(rawRules);
    const oneOfIndex = rules.findIndex(rule => rule.oneOf);
    let vueRuleInsideOneOfRules = false;

    let vueRule = null;
    if (oneOfIndex > 0) {
      vueRule = getVueRule(rules[oneOfIndex].oneOf);
      vueRuleInsideOneOfRules = !!vueRule;
    }
    if (!vueRuleInsideOneOfRules) {
      vueRule = getVueRule(rules);
    }
    if (!vueRule) {
      throw new Error(
        `[VueLoaderPlugin Error] No matching rule for .vue files found.\n` +
          `Make sure there is at least one root-level rule that matches .vue or .vue.html files.`
      );
    }

    if (vueRule.oneOf) {
      throw new Error(
        `[VueLoaderPlugin Error] vue-loader 15 currently does not support vue rules with oneOf.`
      );
    }

    // get the normlized "use" for vue files
    const vueUse = vueRule.use;
    // get vue-loader options
    const vueLoaderUseIndex = vueUse.findIndex(u => {
      return /^vue-loader|(\/|\\|@)vue-loader/.test(u.loader);
    });

    if (vueLoaderUseIndex < 0) {
      throw new Error(
        `[VueLoaderPlugin Error] No matching use for vue-loader is found.\n` +
          `Make sure the rule matching .vue files include vue-loader in its use.`
      );
    }
    // make sure vue-loader options has a known ident so that we can share
    // options by reference in the template-loader by using a ref query like
    // template-loader??vue-loader-options

    const vueLoaderUse = vueUse[vueLoaderUseIndex];
    vueLoaderUse.ident = "vue-loader-options";
    vueLoaderUse.options = vueLoaderUse.options || {};

    const clonedRules = rules.filter(rule => rule !== vueRule).map(cloneRule);
    const pitcher = {
      loader: require.resolve(
        path.resolve(
          this.vueLoaderParentDir,
          "vue-loader/lib/loaders/pitcher.js"
        )
      ),
      resourceQuery: query => {
        const parsed = qs.parse(query.slice(1));
        return parsed.vue != null;
      },
      options: {
        cacheDirectory: vueLoaderUse.options.cacheDirectory,
        cacheIdentifier: vueLoaderUse.options.cacheIdentifier
      }
    };

    compiler.options.module.rules = [pitcher, ...clonedRules, ...rules];
  }
}

function createMatcher(fakeFile) {
  return (rule, i) => {
    // #1201 we need to skip the `include` check when locating the vue rules
    const clone = Object.assign({}, rule);
    delete clone.include;
    const normalized = RuleSet.normalizeRule(clone, {}, "");
    return (
      !rule.enforce && normalized.resource && normalized.resource(fakeFile)
    );
  };
}

function cloneRule(rule) {
  const { resource, resourceQuery } = rule;
  // Assuming `test` and `resourceQuery` tests are executed in series and
  // synchronously (which is true based on RuleSet's implementation), we can
  // save the current resource being matched from `test` so that we can access
  // it in `resourceQuery`. This ensures when we use the normalized rules's
  // resource check, include/exclude are matched correctly.
  let currentResource;
  const res = Object.assign({}, rule, {
    resource: {
      test: resource => {
        currentResource = resource;
        return true;
      }
    },
    resourceQuery: query => {
      const parsed = qs.parse(query.slice(1));
      if (parsed.vue == null) {
        return false;
      }
      if (resource && parsed.lang == null) {
        return false;
      }
      const fakeResourcePath = `${currentResource}.${parsed.lang}`;
      if (resource && !resource(fakeResourcePath)) {
        return false;
      }
      if (resourceQuery && !resourceQuery(query)) {
        return false;
      }
      return true;
    }
  });

  if (rule.oneOf) {
    res.oneOf = rule.oneOf.map(cloneRule);
  }

  return res;
}

EnhancedVueLoaderPlugin.NS = NS;
module.exports = EnhancedVueLoaderPlugin;
