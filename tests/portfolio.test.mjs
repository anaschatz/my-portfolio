import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const { projects } = require("../assets/project-data.js");
const {
  isSafeHref,
  isValidProject,
  renderProjects,
} = require("../assets/project-renderer.js");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("the main page has a clear semantic structure", () => {
  const { document } = new JSDOM(html).window;
  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.equal(
    document.querySelector("h1").textContent.trim(),
    "Anastasis Chatzidakis",
  );
  assert.match(
    document.querySelector(".intro-copy .eyebrow").textContent,
    /Third-year/i,
  );
  assert.doesNotMatch(document.body.textContent, /Second-year/i);
  assert.ok(document.querySelector("main#main-content"));
  assert.ok(document.querySelector("#shorts-engine-case-study"));
  assert.ok(document.querySelector("#stack"));
  assert.ok(document.querySelector("#about"));
});

test("every internal navigation target exists", () => {
  const { document } = new JSDOM(html).window;
  const internalLinks = [...document.querySelectorAll('a[href^="#"]')];
  assert.ok(internalLinks.length >= 6);
  for (const link of internalLinks) {
    assert.ok(
      document.querySelector(link.getAttribute("href")),
      `Missing target for ${link.getAttribute("href")}`,
    );
  }
});

test("project data is valid and renders all selected work", () => {
  assert.equal(projects.length, 4);
  assert.ok(projects.every(isValidProject));
  const dom = new JSDOM("<div data-project-grid></div>");
  const container = dom.window.document.querySelector("[data-project-grid]");
  const result = renderProjects(container, projects);
  assert.deepEqual(result, { ok: true, count: 4, reason: null });
  assert.equal(
    container.querySelectorAll("article[data-project-id]").length,
    4,
  );
  assert.equal(container.querySelectorAll("h3")[0].textContent, "ShortsEngine");
  assert.match(container.textContent, /Key decision:/);
});

test("missing or invalid project data produces a readable fallback", () => {
  const dom = new JSDOM("<div data-project-grid></div>");
  const container = dom.window.document.querySelector("[data-project-grid]");
  const result = renderProjects(container, [{ name: "Incomplete" }]);
  assert.deepEqual(result, {
    ok: false,
    count: 0,
    reason: "no-valid-projects",
  });
  assert.equal(
    container
      .querySelector('[role="status"]')
      .textContent.includes("temporarily unavailable"),
    true,
  );
});

test("project links are constrained to page anchors or HTTPS", () => {
  assert.equal(isSafeHref("#projects"), true);
  assert.equal(isSafeHref("https://github.com/anaschatz"), true);
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("http://example.com"), false);
});

test("new-tab links and core controls expose accessible intent", () => {
  const { document } = new JSDOM(html).window;
  for (const link of document.querySelectorAll('a[target="_blank"]')) {
    assert.equal(link.rel, "noopener noreferrer");
  }
  const menu = document.querySelector("[data-menu-toggle]");
  assert.equal(menu.getAttribute("aria-controls"), "site-nav");
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.ok(document.querySelector(".skip-link"));
});
