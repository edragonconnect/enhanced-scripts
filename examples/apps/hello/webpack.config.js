const EnhancedVueLoaderPlugin = require("../../node_modules/scriptx/EnhancedVueLoaderPlugin");
const path = require("path");
module.exports = () => {
  return {
    webpack() {
      return {
        module: {
          rules: [
            {
              test: /\.vue$/,
              loader: require.resolve("vue-loader")
            }
          ]
        },
        plugins: [new EnhancedVueLoaderPlugin(require.resolve("vue-loader"))]
      };
    }
  };
};
