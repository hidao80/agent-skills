---
name: modernize-repo
description: |
   Modernize JavaScript, Python, and PHP repositories with Dockerization, CI/CD, and README updates.
   Trigger examples: "Modernize the repository", "Dockerize it", "Add CI/CD", "Update the README"
---

# modernize-repo Skill Details

Modernize the repository based on its source code by adding Docker, GitHub Actions with versions pinned to hashes by pinact, and a README.

## Usage
```
/modernize-repo [--skip-docker] [--skip-ci] [--readme-only] [js|python|php]
```

## Reference Files

Depending on the target language, read the following procedures and templates before running. The target language is specified as an argument. If omitted, determine it from the repository's files (`package.json`, `pyproject.toml`, `composer.json`, etc.).

- js: `references/js.md`
- python: `references/python.md`
- php: `references/php.md`

## What It Does

1. **Dockerization**
   - Configuration files for Docker. Do not create them when the `--skip-docker` option is specified.
      - A Dockerfile supporting multi-stage builds
      - A docker-compose.yml that also serves as the development environment
      - .dockerignore

2. **CI/CD**
   - YAML files for GitHub Actions. Do not create them when the `--skip-ci` option is specified.
      - workflows/lint.yml
      - workflows/audit.yml
      - workflows/test.yml
      - workflows/e2e.yml
      - workflows/docker-build.yml
      - dependabot.yml

3. **README update**
   - Update the format of README.md. When the `--readme-only` option is specified, update only the README.
      - Follow the format example in `references/readme.md`, adjusting it as appropriate to the repository's content.

## Options

- `--skip-docker`: Do not create or update any of the files related to building the Docker container specified above
- `--skip-ci`: Do not create or update any of the CI/CD-related files specified above
- `--readme-only`: Update only the README
