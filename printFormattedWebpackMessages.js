const utils = require("./utils");
const path = require("path");
const paths = require("./config/paths");
const prettyBytes = require("pretty-bytes");
function canReadAsset(asset) {
  return (
    // /\.(js|css)$/.test(asset) &&
    //source map file
    !/\.map/.test(asset) &&
    !/service-worker\.js/.test(asset) &&
    !/assets-manifest\.json/.test(asset) &&
    !/precache-manifest\.[0-9a-f]+\.js/.test(asset)
  );
}
module.exports = function printBuildInfo(stats, error, name) {
  if (error) {
    const message = error != null && error.message;
    const stack = error != null && error.stack;
    if (
      stack &&
      typeof message === "string" &&
      (message.indexOf("from Terser") !== -1 ||
        message.indexOf("TS18003") !== -1)
    ) {
      // Add more helpful message for Terser error
      if (message.indexOf("from Terser") !== -1) {
        try {
          const matched = /(.+)\[(.+):(.+),(.+)\]\[.+\]/.exec(stack);
          if (!matched) {
            throw new Error("Using errors for control flow is bad.");
          }
          const problemPath = matched[2];
          const line = matched[3];
          const column = matched[4];
          utils.print(
            "Failed to minify the code from this file: \n\n",
            utils.chalk.yellow(
              `\t${problemPath}:${line}${column !== "0" ? ":" + column : ""}`
            ),
            "\n"
          );
        } catch (ignored) {
          utils.print("Failed to minify the bundle.", error);
        }
      }
      //TS18003
      if (message.indexOf("TS18003") !== -1) {
        utils.info(
          "You are using typescript,but no .ts files found in " +
            utils.chalk.yellow(paths.config.src) +
            " " +
            utils.chalk.underline("TS18003")
        );
      }
    } else {
      utils.print((message || error) + "\n");
    }
    utils.fail("Failed to compile `" + name + "`");
  } else {
    let assets = [stats]
      .map(stats =>
        stats
          .toJson({ all: false, assets: true })
          .assets.filter(asset => canReadAsset(asset.name))
          .map(asset => {
            return {
              name: path.join(path.basename(paths.config.dist), asset.name),
              size: prettyBytes(asset.size).replace(/\s/g, "")
            };
          })
      )
      .reduce((single, all) => all.concat(single), []);
    assets.sort((a, b) => b.size - a.size);
    assets = assets.map(
      item => `${utils.chalk.green(item.name)}  ${utils.chalk.gray(item.size)}`
    );
    utils.print("Built assets:");
    utils.print(assets.join("\n"));
    const json = stats.toJson({ builtAt: true, timings: true });
    utils.print(`Built time: ${(json.time / 1000).toFixed(2)}`);
    utils.print(`Built at: ${new Date(json.builtAt).toUTCString()}`);
    utils.ok("Compile `" + name + "` successfully!");
  }
};
