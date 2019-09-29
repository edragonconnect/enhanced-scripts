module.exports = () => {
  return {
    webpack() {
      return {
        module: {
          // rules: []
        }
      };
    },
    postcss(postcss) {
      const result = {
        plugins: [
          () => () => {
            console.log("postcss plugin");
          }
        ],
        ...postcss
      };

      // console.log("example/webpack/postcss", result);

      return result;
      // return result;
    }
  };
};
