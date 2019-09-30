const child_process = require("child_process");
const asyncSpawn = (
  cmd,
  argvs = [],
  options = { cwd: __dirname, stdio: "inherit" }
) => {
  const spawn = child_process.spawn(cmd, argvs, options);
  return new Promise((resolve, reject) => {
    spawn.on("close", code => {
      if (code !== 0) {
        return reject(
          `[${cmd},${argvs.join(" ")},${JSON.stringify(options, null, 2)}]`
        );
      }
      resolve(spawn.kill());
    });
  });
};
const scripts = ["start", "build"];
const script = process.argv.slice(2).find(x => scripts.includes(x));
const scriptArgvs = process.argv.filter((_, index) => index > 2) || [];
const cleanArgv = process.argv.pop() === "--clean";
async function runner() {
  console.log("Removing _build");
  await asyncSpawn("rm", ["-rf", "_build"]);
  if (cleanArgv) {
    console.log("Removing node_modules");
    await asyncSpawn("rm", ["-rf", "node_modules"]);
    console.log("Installing packages...");
    await asyncSpawn("yarn");
  }
  if (script) {
    scriptArgvs.unshift(script);
    const runScripts = scriptArgvs.filter(x => x !== "--clean");
    await asyncSpawn("yarn", runScripts);
  }
}
runner();
