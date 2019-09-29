const Watchpack = require("watchpack");
const patterns = {
  node_modules: "node_modules/**",
  webpack: "webpack.*",
  postcss: "postcss.*",
  babel: "babel.*",
  yarn: "yarn.*",
  npm: "npm*"
};
const glob = require("glob");
module.exports = function watcher({ dirs, onChange }) {
  const wp = new Watchpack({
    aggregateTimeout: 500,
    ignored: [
      /\.lock$/,
      /\.log$/,
      /(^|[\/\\])\../,
      dirs
        .map(item => {
          let re = [];
          for (let key in patterns) {
            re.push(glob.sync(`${item}/${key}`));
          }
          return re;
        })
        .reduce((single, all) => all.concat(single), [])
    ]
  });
  wp.watch([], dirs, Date.now() - 10000);
  wp.on("change", onChange);
};
