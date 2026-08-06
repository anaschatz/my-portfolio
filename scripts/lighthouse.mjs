import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const root = resolve("dist");
if (!existsSync(join(root, "index.html"))) {
  throw new Error("Run npm run build before Lighthouse.");
}

const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url || "/", "http://127.0.0.1").pathname,
  );
  const file = join(root, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": mime[extname(file)] || "application/octet-stream",
  });
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen) =>
  server.listen(0, "127.0.0.1", resolveListen),
);
const address = server.address();
const url = `http://127.0.0.1:${address.port}`;
const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});
const outputDir = resolve(".lighthouse");
await mkdir(outputDir, { recursive: true });

const profiles = [
  {
    name: "mobile",
    settings: {
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      throttlingMethod: "simulate",
    },
  },
  {
    name: "desktop",
    settings: {
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttlingMethod: "simulate",
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
    },
  },
];
const thresholds = {
  performance: 0.9,
  accessibility: 0.95,
  "best-practices": 0.9,
  seo: 0.95,
};
const summaries = [];

try {
  for (const profile of profiles) {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: ["json", "html"],
        logLevel: "error",
        onlyCategories: Object.keys(thresholds),
      },
      {
        extends: "lighthouse:default",
        settings: profile.settings,
      },
    );
    if (!result?.lhr)
      throw new Error(
        `Lighthouse did not return a report for ${profile.name}.`,
      );

    const [jsonReport, htmlReport] = result.report;
    await writeFile(join(outputDir, `${profile.name}.json`), jsonReport);
    await writeFile(join(outputDir, `${profile.name}.html`), htmlReport);
    const scores = Object.fromEntries(
      Object.entries(thresholds).map(([category]) => [
        category,
        result.lhr.categories[category].score,
      ]),
    );
    summaries.push({ profile: profile.name, scores });

    for (const [category, threshold] of Object.entries(thresholds)) {
      if (scores[category] < threshold) {
        throw new Error(
          `${profile.name} ${category} score ${Math.round(scores[category] * 100)} is below ${Math.round(threshold * 100)}.`,
        );
      }
    }
  }
} finally {
  await chrome.kill();
  await new Promise((resolveClose) => server.close(resolveClose));
}

for (const summary of summaries) {
  console.log(
    `${summary.profile}: ${Object.entries(summary.scores)
      .map(([key, value]) => `${key} ${Math.round(value * 100)}`)
      .join(" · ")}`,
  );
}
