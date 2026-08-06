import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const entries = ["index.html", "assets", "robots.txt", "sitemap.xml"];

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });

for (const entry of entries) {
  await cp(resolve(root, entry), resolve(output, entry), { recursive: true });
}

const builtHtml = await readFile(resolve(output, "index.html"), "utf8");
if (
  !builtHtml.includes("data-project-grid") ||
  !builtHtml.includes("shorts-engine-case-study")
) {
  throw new Error(
    "Build verification failed: required portfolio sections are missing.",
  );
}

console.log(`Static build created at ${output}`);
