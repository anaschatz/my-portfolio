import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["assets", "scripts", "tests"];
const files = [];

function collect(directory) {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    if (statSync(filePath).isDirectory()) collect(filePath);
    else if (/\.(?:js|mjs)$/.test(entry)) files.push(filePath);
  }
}

roots.forEach((directory) => collect(resolve(directory)));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `JavaScript syntax check failed for ${file}:\n${result.stderr}`,
    );
  }
}

console.log(`JavaScript syntax checks passed (${files.length} files).`);
