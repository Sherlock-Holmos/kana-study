import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "test"];
const files = [];

function walk(path) {
  for (const name of readdirSync(path)) {
    const full = join(path, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith(".js")) files.push(full);
  }
}

for (const root of roots) walk(root);
files.push("sw.js");

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files`);
