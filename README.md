# agent-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

A collection of reusable Agent Skills (`SKILL.md` + reference files) for AI coding agents such as Claude Code. Each skill packages instructions for a recurring development task — repository analysis, commit messages, landing pages, CI/CD modernization, security audits, and more — so the agent can follow a consistent, repository-aware procedure.

## Issues & Reasons

- **Inconsistent results from ad-hoc prompts:** Rewriting the same instructions for every repository leads to drifting output. Skills fix the procedure, format, and rules in one place.
- **Generic boilerplate instead of repository facts:** The skills require the agent to derive content from the target repository itself (README, package manifests, workflows, git log) and never invent features or commands.
- **Bilingual maintenance:** Skills are authored in Japanese under `src/` and published in English under `skills/`, keeping the source of truth readable for the author while making the distributed skills usable by anyone.

## Features

### Core Functionality

- **code-analyze:** Analyzes a repository and creates or refreshes structured reference docs (dependencies, infrastructure, databases, screens, security, tests, overview, etc.) under `z-ai/code-analyzed/`.
- **commit-msg:** Suggests a concise commit message for the staged changes, prefixed with a gitmoji shortcode.
- **update-adr:** Creates or updates Architecture Decision Records in `docs/ADR.md` from the committed git log.
- **web-security-audit:** Statically audits a repository for external communication, data storage, third-party libraries, and other security risks, and reports findings by severity.

### Additional Features

- **modernize-repo:** Modernizes JavaScript/TypeScript, Python, and PHP repositories with multi-stage Dockerfiles, GitHub Actions (lint, test, audit, E2E, Docker build, Dependabot) pinned to commit hashes via pinact, Playwright E2E tests, and an updated README.
- **setup-act:** Analyzes GitHub Actions workflows and generates the matching local [`act`](https://github.com/nektos/act) configuration (runner images, Docker socket, secret scaffolding, task runner shortcuts).
- **make-lp:** Builds a static, build-free landing page (`docs/index.html`) with light/dark themes, OGP, JSON-LD, a Twemoji favicon, and 6-language support via `multilanguagejs`.
- **make-social-preview:** Generates a 1280×640 social preview image (`social-preview.svg` plus PNG) with inline Twemoji vectors.

### User Experience

- **sbi-feedback:** Turns a work report into structured, positive feedback using the SBI (Situation, Behavior, Impact) framework.
- **Natural-language triggers:** Every skill declares trigger phrases in its front matter, so the agent can pick the right skill from a plain request.

### Internationalization & Accessibility

- Skills are distributed in English (`skills/`), with the original Japanese sources kept in `src/`.
- Language-sensitive skills adapt their output language (e.g., `commit-msg` follows the README's language or an explicit locale argument).

## Tech Stack

| Layer | Technology |
|---|---|
| Format | Agent Skills (`SKILL.md` with YAML front matter) |
| Language | Markdown |
| Target agents | Claude Code and other agents that support the `SKILL.md` format |

### Key Technologies

- **Agent Skills:** Each skill is a directory containing a `SKILL.md` (name, description, trigger examples, instructions) and optional `references/` files loaded on demand.

## Quick Start

### Install with the skills CLI

Install with [`skills`](https://github.com/vercel-labs/skills), the CLI used by [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (requires Node.js 22.20 or later):

```bash
npx skills add hidao80/agent-skills
```

Skills are installed to the current project by default; add `-g` to make them available across projects.

```bash
# List available skills without installing
npx skills add hidao80/agent-skills --list

# Install specific skills for Claude Code only
npx skills add hidao80/agent-skills --skill commit-msg --skill code-analyze -a claude-code

# Install all skills globally for Claude Code
npx skills add hidao80/agent-skills --skill '*' -g -a claude-code
```

> **Note:** Run `npx skills update` to update installed skills, or `npx skills remove` to remove them.

Then ask the agent in natural language, e.g. "Suggest a commit message" or "Run a security audit", or invoke a skill directly with `/<skill-name>` (e.g., `/commit-msg ja`).

## Configuration

- **`AGENTS.md` priority:** Rules in your repository's `AGENTS.md` (and similar files) take precedence over skill rules where a skill says so (e.g., `commit-msg`).
- **Options:** Some skills accept arguments, e.g. `/modernize-repo [--skip-docker] [--skip-ci] [--readme-only] [js|python|php]`.

## Development

### Project Structure

```plain
.
├── skills/                      # Distributed skills (English)
│   ├── code-analyze/
│   ├── commit-msg/
│   ├── make-lp/
│   ├── make-social-preview/
│   ├── modernize-repo/
│   │   └── references/          # js.md / php.md / python.md / readme.md
│   ├── sbi-feedback/
│   ├── setup-act/
│   ├── update-adr/
│   └── web-security-audit/
│       └── references/          # checklist.md / report-format.md
├── src/                         # Source skills (Japanese), same layout as skills/
├── LICENSE
└── README.md
```

### Editing Workflow

1. Edit the Japanese source under `src/<skill-name>/`.
2. Translate it into English and place it at the same path under `skills/<skill-name>/`.

## :handshake: Contributing

Contributions are welcome! Please keep `src/` (Japanese) and `skills/` (English) in sync when adding or changing a skill.

## :page_facing_up: License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
