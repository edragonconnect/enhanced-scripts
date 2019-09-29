module.exports = () => {
  return {
    webpack() {
      return {
        resolve: {
          extensions: [".vue"]
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
