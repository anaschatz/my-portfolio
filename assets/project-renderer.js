(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PortfolioRenderer = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const requiredTextFields = [
    "id",
    "name",
    "kicker",
    "status",
    "icon",
    "visual",
    "problem",
    "decision",
  ];

  function isSafeHref(value) {
    return (
      typeof value === "string" &&
      (value.startsWith("#") || value.startsWith("https://"))
    );
  }

  function isValidProject(project) {
    return Boolean(
      project &&
      requiredTextFields.every(
        (field) => typeof project[field] === "string" && project[field].trim(),
      ) &&
      Array.isArray(project.technologies) &&
      project.technologies.length > 0 &&
      project.technologies.every(
        (item) => typeof item === "string" && item.trim(),
      ) &&
      Array.isArray(project.links) &&
      project.links.length > 0 &&
      project.links.every(
        (link) =>
          link &&
          typeof link.label === "string" &&
          link.label.trim() &&
          isSafeHref(link.href),
      ),
    );
  }

  function appendTextElement(document, parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function createIcon(document, name) {
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", name);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function createProjectCard(document, project) {
    const article = document.createElement("article");
    article.className = [
      "project-card",
      project.layout,
      project.id === "shorts-engine" ? "is-flagship" : "",
    ]
      .filter(Boolean)
      .join(" ");
    article.dataset.reveal = "";
    article.dataset.projectId = project.id;

    const visual = document.createElement("div");
    visual.className = `project-visual ${project.visual}`;
    visual.setAttribute("aria-hidden", "true");
    for (let index = 0; index < (project.decorativeCells || 0); index += 1) {
      visual.append(document.createElement("span"));
    }
    article.append(visual);

    const body = document.createElement("div");
    body.className = "project-body";

    const kicker = document.createElement("div");
    kicker.className = "project-kicker";
    kicker.append(createIcon(document, project.icon));
    kicker.append(document.createTextNode(project.kicker));
    body.append(kicker);

    appendTextElement(document, body, "h3", "", project.name);
    appendTextElement(document, body, "p", "project-status", project.status);
    appendTextElement(document, body, "p", "project-problem", project.problem);

    const decision = document.createElement("p");
    decision.className = "project-decision";
    const decisionLabel = document.createElement("strong");
    decisionLabel.textContent = "Key decision: ";
    decision.append(decisionLabel, document.createTextNode(project.decision));
    body.append(decision);

    const tags = document.createElement("ul");
    tags.className = "tag-list";
    tags.setAttribute("aria-label", `${project.name} technologies`);
    project.technologies.forEach((technology) =>
      appendTextElement(document, tags, "li", "", technology),
    );
    body.append(tags);

    const actions = document.createElement("div");
    actions.className = "project-actions";
    project.links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.className = link.primary
        ? "project-link project-link-primary"
        : "project-link";
      anchor.href = link.href;
      anchor.append(
        document.createTextNode(link.label),
        createIcon(document, "arrow-up-right"),
      );
      if (link.href.startsWith("https://")) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        const hidden = appendTextElement(
          document,
          anchor,
          "span",
          "visually-hidden",
          " (opens in a new tab)",
        );
        hidden.setAttribute("aria-hidden", "false");
      }
      actions.append(anchor);
    });
    body.append(actions);
    article.append(body);
    return article;
  }

  function renderProjects(container, projects) {
    if (!container || !container.ownerDocument) {
      return Object.freeze({
        ok: false,
        count: 0,
        reason: "missing-container",
      });
    }

    const validProjects = Array.isArray(projects)
      ? projects.filter(isValidProject)
      : [];
    container.replaceChildren();

    if (!validProjects.length) {
      const fallback = appendTextElement(
        container.ownerDocument,
        container,
        "p",
        "project-empty",
        "Project details are temporarily unavailable. You can still inspect the public GitHub profile.",
      );
      fallback.setAttribute("role", "status");
      return Object.freeze({
        ok: false,
        count: 0,
        reason: "no-valid-projects",
      });
    }

    const fragment = container.ownerDocument.createDocumentFragment();
    validProjects.forEach((project) =>
      fragment.append(createProjectCard(container.ownerDocument, project)),
    );
    container.append(fragment);
    return Object.freeze({
      ok: true,
      count: validProjects.length,
      reason: null,
    });
  }

  return Object.freeze({ isSafeHref, isValidProject, renderProjects });
});
