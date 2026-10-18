import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const windows = process.platform === "win32";
const defaultWindowsCompiler = "C:\\msys64\\ucrt64\\bin\\g++.exe";
const compiler =
  process.env.HEXCHESS_CXX ||
  (windows && existsSync(defaultWindowsCompiler) ? defaultWindowsCompiler : "g++");
const output = path.join(root, "engines/engine-1", windows ? "engine-one.exe" : "engine-one");
const flags = [
  "-std=c++20",
  "-O2",
  "-Wall",
  "-Wextra",
  "-Wpedantic",
  "-I",
  path.join(root, "shared/include"),
  "-I",
  path.join(root, "shared/third_party"),
];
if (windows) flags.push("-static-libgcc", "-static-libstdc++");

function run(command, args, { input = "" } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data;
    });
    child.stderr.on("data", (data) => {
      stderr += data;
    });
    child.on("error", (error) =>
      reject(
        new Error(`Cannot run ${command}: ${error.message}. Install G++ or set HEXCHESS_CXX.`),
      ),
    );
    child.stdin.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr || stdout || `${command} failed`));
      else {
        if (stderr) process.stderr.write(stderr);
        resolve(stdout);
      }
    });
    child.stdin.end(input);
  });
}

try {
  const ruleSources = [
    "shared/src/geometry.cpp",
    "shared/src/hex_rules.cpp",
    "shared/variants/glinski.cpp",
    "shared/variants/mccooey.cpp",
    "shared/variants/shafran.cpp",
    "shared/variants/brusky.cpp",
    "shared/variants/devasa.cpp",
    "shared/variants/variant.cpp",
  ].map((source) => path.join(root, source));
  const engineSources = [
    "engines/engine-1/main.cpp",
    "engines/engine-1/protocol.cpp",
    "engines/engine-1/search.cpp",
  ].map((source) => path.join(root, source));
  await run(compiler, [...flags, ...engineSources, ...ruleSources, "-o", output]);
  const snapshot = JSON.parse(await run(output, [], { input: "board\nquit\n" }));
  mkdirSync(path.join(root, "web/public"), { recursive: true });
  writeFileSync(
    path.join(root, "web/public/foundation-board.json"),
    JSON.stringify(snapshot, null, 2) + "\n",
  );
  console.log(
    `Built Tactical and exported ${snapshot.cells.length} cells from shared C++ geometry.`,
  );
  if (process.argv.includes("--test")) {
    mkdirSync(path.join(root, "build"), { recursive: true });
    const testOutput = path.join(root, "build", windows ? "geometry-tests.exe" : "geometry-tests");
    await run(compiler, [
      ...flags,
      path.join(root, "tests/rules/geometry.cpp"),
      path.join(root, "shared/src/geometry.cpp"),
      "-o",
      testOutput,
    ]);
    process.stdout.write(await run(testOutput, []));
    const rulesOutput = path.join(root, "build", windows ? "glinski-tests.exe" : "glinski-tests");
    await run(compiler, [
      ...flags,
      path.join(root, "tests/rules/glinski.cpp"),
      path.join(root, "engines/engine-1/search.cpp"),
      ...ruleSources,
      "-o",
      rulesOutput,
    ]);
    process.stdout.write(await run(rulesOutput, []));
    const mccooeyOutput = path.join(root, "build", windows ? "mccooey-tests.exe" : "mccooey-tests");
    await run(compiler, [...flags, path.join(root, "tests/rules/mccooey.cpp"),
      path.join(root, "engines/engine-1/search.cpp"), ...ruleSources, "-o", mccooeyOutput]);
    process.stdout.write(await run(mccooeyOutput, []));
  }
  if (process.argv.includes("--test")) {
    const output = path.join(root, "build", windows ? "shafran-tests.exe" : "shafran-tests");
    await run(compiler, [...flags, path.join(root,"tests/rules/shafran.cpp"), path.join(root,"engines/engine-1/search.cpp"), ...ruleSources, "-o",output]);
    process.stdout.write(await run(output, []));
  }
  if (process.argv.includes("--test")) {
    const output = path.join(root, "build", windows ? "brusky-foundation-tests.exe" : "brusky-foundation-tests");
    await run(compiler, [...flags, path.join(root,"tests/rules/brusky.cpp"), ...ruleSources, "-o",output]);
    process.stdout.write(await run(output, []));
  }
  if (process.argv.includes("--test")) {
    const output = path.join(root, "build", windows ? "devasa-foundation-tests.exe" : "devasa-foundation-tests");
    await run(compiler, [...flags, path.join(root,"tests/rules/devasa.cpp"), ...ruleSources, "-o",output]);
    process.stdout.write(await run(output, []));
  }
  if (process.argv.includes("--test")) {
    const output = path.join(root, "build", windows ? "horizontal-rules-tests.exe" : "horizontal-rules-tests");
    await run(compiler, [...flags, path.join(root,"tests/rules/horizontal.cpp"), path.join(root,"engines/engine-1/search.cpp"), ...ruleSources, "-o",output]);
    process.stdout.write(await run(output, []));
  }
  if (process.argv.includes("--test")) {
    const output = path.join(root, "build", windows ? "wellisch-foundation-tests.exe" : "wellisch-foundation-tests");
    await run(compiler, [...flags, path.join(root,"tests/rules/wellisch.cpp"), path.join(root,"shared/variants/wellisch.cpp"), ...ruleSources, "-o",output]);
    process.stdout.write(await run(output, []));
  }
  if (process.argv.includes("--cloud")) {
    if (process.platform !== "linux" || process.arch !== "x64")
      throw new Error("Cloud executable must be built on Linux x64");
    mkdirSync(path.join(root, "build"), { recursive: true });
    const cloudOutput = path.join(root, "build/engine-one-linux-x64.bin");
    await run(compiler, [
      ...flags,
      "-static",
      "-s",
      ...engineSources,
      ...ruleSources,
      "-o",
      cloudOutput,
    ]);
    console.log(`Built statically linked cloud engine: ${cloudOutput}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
