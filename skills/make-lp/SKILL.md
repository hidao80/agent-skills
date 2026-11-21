---
name: make-lp
description: |
  Create or update a static `docs/index.html` landing page (plus `docs/style.css`/`docs/main.js`, no build step) whose content is derived from **this repository's own** README/package.json/AGENTS.md and the like, rather than generic boilerplate. Supports light/dark themes, OGP (including X.com), a JSON-LD schema, a Twemoji SVG favicon, multilingual support via the CDN build of `multilanguagejs`, and command boxes with copy-to-clipboard.
  Trigger examples: "Make a landing page", "Generate a landing page", "Update the landing page"
---

# make-lp

Generate a static landing page (`docs/index.html` + `docs/style.css` + `docs/main.js`) whose content is drawn from the repository it is placed in. Never list features, providers, or commands that do not actually exist in the repository.

## Source of Truth for Content

Before writing anything, read the following:

- `README.*` — overview, features, tech stack, install/quick-start commands
- `LICENSE*` — license name, version, URL
- `CHANGELOG.*` — summary of the change history
- `package.json`, `composer.json`, `requirements.txt`, etc.: name, description, dependencies (the basis for tech stack badges)
- `AGENTS.md`, `CLAUDE.md`, `config.toml`, `GEMINI.md`, etc.: the project's purpose and, if the project has them, tables of supported providers/settings
- An existing `docs/index.html` (if present): unless explicitly asked for a redesign, reuse its section structure and edit the content in place rather than rebuilding from scratch

## Required Elements

1. **Light/dark theme** — Override CSS custom properties (`--bg`, `--text`, `--accent`, etc.) with a `prefers-color-scheme: dark` media query. Do not add a JS theme toggle unless asked.
2. **OGP + Twitter/X card** — `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:site_name`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. Point `og:image`/`twitter:image` to an asset that already actually exists in the repository (e.g., `social-preview.png`). If none exists, generate one first with the `make-social-preview` skill.
3. **JSON-LD schema** — A `<script type="application/ld+json">` block (`SoftwareApplication` for an app/tool; otherwise any `@type` that fits the project). Keep it consistent with the OGP description.
4. **Favicon** — Reference a Twemoji SVG that suits the project with `<link rel="icon">`.
5. **Multilingual support via `multilanguagejs` (CDN, no build step)**:
   ```html
   <script src="https://unpkg.com/multilanguagejs@{LATEST_VERSION}/dist/multilanguagejs.umd.cjs" integrity="sha384-..." crossorigin="anonymous"></script>
   ```
   Wrap every element to be translated in `<template type="language-group">`, and inside it place one child element per language, each with a `language="xx"` attribute (not `lang`):
   ```html
   <h2>
     <template type="language-group">
       <span language="en">Features</span>
       <span language="ja">機能</span>
     </template>
   </h2>
   ```
   Each `template[type=language-group]` must contain **exactly one** element per supported language — `multilanguagejs` takes the first matching `[language=X]` per template, so duplicates cause content to be silently lost.

   Initialize it in `main.js`:
   ```js
   var ml = new MultilanguageJS({ languages: [...], defaultLanguage: "en" });
   ml.setLanguage(lang); // on load, and on the change event of the <select> switcher
   ```
   `<title>` and `<meta name="description">` are **outside** the scope of the `[language]` templates (the library only updates the `textContent` of matching elements, and the translation of a `<meta>` tag lives in its `content` attribute, not its text). Give `main.js` a small per-language `{ title, description }` dictionary and update these two tags manually alongside `ml.setLanguage()`.

   Detect the visitor's language from `navigator.language`, save the selected language in `localStorage`, and on load reapply it before falling back to browser detection.

   **Required language set (always, regardless of what the app itself supports):** English (`en`), Japanese (`ja`), Chinese (`zh`), Spanish (`es`), Russian (`ru`), German (`de`) — at least 6 languages. This applies even if `src/locales/*.json` or the app's own `i18n.ts`/`i18n.js` covers only some of them (e.g., even for an `en`/`ja`-only app, make the landing page in 6 languages). If requested, you may add other languages to these 6. Write the copy in a polite register (e.g., です/ます form in Japanese).
6. **Copy-to-clipboard buttons** — Give every install/run command shown in a `<code>` block a copy button with an inline SVG icon (never an emoji), with a checkmark confirmation state via `navigator.clipboard.writeText()`. For consistent layout, wrap the `<code>` and its button in a `.code-row` flex container. Place the button in the top-right corner of the code block area, layered in front of the content. Clicking the button copies the command to the clipboard and temporarily shows a checkmark.
7. **Responsive** — Mobile-first. Do not cause horizontal scrolling on narrow viewports, except inside containers explicitly intended to scroll (e.g., a wide comparison table).
8. **No build step** — Make the page work just by opening the HTML file or serving the static folder as-is, regardless of which bundler (Vite, etc.) the app itself uses. Keep `main.js` as readable source. Load it directly in the page with `<script src="main.js">`.
9. **Semantic structure** — Structure these semantically: hero (heading, lead text, CTA, primary run command), screenshots (reuse existing repository/GitHub asset URLs if any), feature grid, quick-start/install commands, tech stack badges, footer.
10. **Reuse existing CSS** — Reuse the CSS custom properties and class names already in the repository's `docs/style.css` rather than creating a parallel, separate styling system.
11. **Respect the design system** — Respect the design system in the existing AI agent runtime environment. When adding new CSS, reuse existing custom properties and class names, and follow naming conventions, design, layout, and tone and manner consistent with the repository's design system.

## Workflow

1. Read the content sources above.
2. If `docs/` does not exist, create it.
3. If `docs/index.html` already exists, edit it in place — unless explicitly asked for a redesign, do not replace it wholesale; keep the section structure and update the content.
4. Structure the sections semantically: hero (heading, lead text, CTA, primary run command), screenshots (reuse existing repository/GitHub asset URLs if any), feature grid, comparison/settings table (if the project has multiple providers/modes/backends worth comparing), quick-start/install commands, tech stack badges, footer.
5. Reuse the CSS custom properties and class names already in the repository's `docs/style.css` rather than creating a parallel, separate styling system.
6. Update `docs/main.js`.
7. Verify before finishing: no emoji are used for interactive icons (SVG only); every `template[type=language-group]` has exactly one child element per supported language, with no duplicates or omissions; OGP/JSON-LD point to files/URLs that actually exist in the repository.
