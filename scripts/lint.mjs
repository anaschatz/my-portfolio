import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const failures = [];

const assetReferences = [
  ...html.matchAll(/(?:src|href)="(assets\/[^"?#]+)/g),
].map((match) => match[1]);
for (const assetReference of new Set(assetReferences)) {
  try {
    await access(resolve(root, assetReference));
  } catch {
    failures.push(`Missing local asset: ${assetReference}`);
  }
}

for (const match of html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) {
  if (!/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(match[1])) {
    failures.push(
      `External new-tab link is missing rel="noopener noreferrer": ${match[0]}`,
    );
  }
}

for (const placeholder of [
  "TODO",
  "lorem ipsum",
  "example.com",
  "120+ test files",
]) {
  if (html.toLowerCase().includes(placeholder.toLowerCase())) {
    failures.push(`Placeholder or stale claim found: ${placeholder}`);
  }
}

if (failures.length) {
  throw new Error(`Portfolio lint failed:\n- ${failures.join("\n- ")}`);
}

console.log(
  `Portfolio lint passed (${new Set(assetReferences).size} local assets verified).`,
);
