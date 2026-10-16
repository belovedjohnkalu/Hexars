import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "artifacts");
const archive = path.join(directory, "ion-source.zip");
mkdirSync(directory, { recursive: true });
const child = spawn(
  "git",
  ["archive", "--format=zip", "--prefix=ion/", `--output=${archive}`, "HEAD"],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("close", (code) => {
  if (code !== 0) {
    console.error("Source packaging requires a local Git commit. Commit the project and retry.");
    process.exitCode = 1;
  } else console.log(`Source archive: ${archive}`);
});
