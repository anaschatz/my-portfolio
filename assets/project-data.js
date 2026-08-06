(function (root, factory) {
  const data = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = data;
  } else {
    root.PORTFOLIO_DATA = data;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  return Object.freeze({
    projects: Object.freeze([
      Object.freeze({
        id: "shorts-engine",
        name: "ShortsEngine",
        kicker: "Flagship · AI media system",
        status: "Production-hardening prototype",
        icon: "film",
        layout: "feature-card",
        visual: "shorts-visual",
        decorativeCells: 4,
        problem:
          "Turns source media or structured ideas into vertical video without treating a successful render as proof that the result is correct.",
        decision:
          "Evidence gates, deterministic rendering, explicit review states, and fail-closed release decisions.",
        technologies: Object.freeze([
          "Node.js",
          "FFmpeg",
          "SQLite",
          "Python tools",
          "Playwright",
        ]),
        links: Object.freeze([
          Object.freeze({
            label: "Read the case study",
            href: "#shorts-engine-case-study",
            primary: true,
          }),
          Object.freeze({
            label: "GitHub repository",
            href: "https://github.com/anaschatz/Shorts-Engine",
          }),
        ]),
      }),
      Object.freeze({
        id: "gym-app",
        name: "Gym App",
        kicker: "Mobile · Personal product",
        status: "Working local-first app",
        icon: "activity",
        layout: "",
        visual: "gym-visual",
        decorativeCells: 3,
        problem:
          "Keeps workout, nutrition, bodyweight, and progress data useful on-device without requiring an account or backend.",
        decision:
          "Local-first persistence with defensive storage, exportable backups, strict date handling, and focused domain tests.",
        technologies: Object.freeze([
          "React Native",
          "Expo",
          "TypeScript",
          "AsyncStorage",
        ]),
        links: Object.freeze([
          Object.freeze({
            label: "Explore Gym App",
            href: "https://github.com/anaschatz/gym-app",
            primary: true,
          }),
        ]),
      }),
      Object.freeze({
        id: "findet",
        name: "FinDet",
        kicker: "Data · Team semester project",
        status: "Completed coursework project",
        icon: "landmark",
        layout: "",
        visual: "budget-visual",
        decorativeCells: 4,
        problem:
          "Makes hierarchical Greek State Budget data easier to inspect across years and safer to explore through what-if adjustments.",
        decision:
          "A JavaFX desktop workflow backed by SQLite, isolated financial logic, and a JUnit-tested backend.",
        technologies: Object.freeze(["Java 21", "JavaFX", "SQLite", "JUnit"]),
        links: Object.freeze([
          Object.freeze({
            label: "Explore FinDet",
            href: "https://github.com/anaschatz/FinDet",
            primary: true,
          }),
        ]),
      }),
      Object.freeze({
        id: "budgeting-app",
        name: "Budgeting App",
        kicker: "Swift · In development",
        status: "Active prototype",
        icon: "wallet",
        layout: "wide-card",
        visual: "swift-visual",
        decorativeCells: 6,
        problem:
          "Explores a maintainable personal-finance codebase with receipt capture, persistence, security, analytics, and widgets.",
        decision:
          "Separate domain, persistence, presentation, data-entry, security, widget, and performance-testing modules.",
        technologies: Object.freeze([
          "Swift",
          "SwiftUI",
          "Core Data",
          "Vision OCR",
          "XCTest",
        ]),
        links: Object.freeze([
          Object.freeze({
            label: "Explore Budgeting App",
            href: "https://github.com/anaschatz/budgeting-app",
            primary: true,
          }),
        ]),
      }),
    ]),
  });
});
