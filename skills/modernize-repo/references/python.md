# Modernizing a Python Project

Modernize the Python project by following this prompt.

- [Modernizing a Python Project](#modernizing-a-python-project)
  - [Procedure](#procedure)
    - [1. Dockerization](#1-dockerization)
      - [Dockerfile (Multi-Stage Build)](#dockerfile-multi-stage-build)
      - [docker-compose.yml (Development)](#docker-composeyml-development)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD (GitHub Actions)](#2-cicd-github-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
      - [.github/workflows/audit.yml](#githubworkflowsaudityml)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Pinning Action Versions (pinact)](#pinning-action-versions-pinact)
    - [3. E2E Tests with Playwright](#3-e2e-tests-with-playwright)
      - [Setting Up pytest-playwright](#setting-up-pytest-playwright)
      - [Example Test File: Full-Page Screenshots](#example-test-file-full-page-screenshots)
      - [Updating .gitignore](#updating-gitignore)
    - [4. Updating the README](#4-updating-the-readme)
      - [CI Badges (Add to the Top of the README)](#ci-badges-add-to-the-top-of-the-readme)
      - [Quick Start Section](#quick-start-section)
  - [Notes](#notes)

## Procedure

### 1. Dockerization

#### Dockerfile (Multi-Stage Build)

```dockerfile
# Build stage
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .

# Production stage
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user
RUN groupadd --gid 1001 python && \
    useradd --uid 1001 --gid python --shell /bin/bash python

COPY --from=builder --chown=python:python /app/.venv ./.venv
COPY --chown=python:python . .

USER python
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["python", "-m", "app"]
```

#### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - PYTHONDONTWRITEBYTECODE=1
      - PYTHONUNBUFFERED=1
    command: uv run python -m app

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  db_data:
```

#### .dockerignore

```
# Virtual environments
.venv
venv
env
.env

# Git
.git
.gitignore
.gitattributes

# Environment variables
.env
.env.*
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo

# Python cache
__pycache__
*.py[cod]
*$py.class
*.so
.Python

# Tests and coverage
.pytest_cache
.coverage
htmlcov
.tox
.nox

# Documentation
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# Build
build
dist
*.egg-info
.eggs

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Type checking
.mypy_cache
.pytype
```

### 2. CI/CD (GitHub Actions)

#### .github/workflows/lint.yml

```yaml
name: Lint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Run Ruff Lint
        run: uvx ruff check .

      - name: Run Ruff Format Check
        run: uvx ruff format --check .
```

#### .github/workflows/test.yml

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Set up Python
        run: uv python install

      - name: Install dependencies
        run: uv sync --all-extras --dev

      - name: Run tests
        run: uv run pytest --ignore=tests/e2e
```

#### .github/workflows/audit.yml

```yaml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Security audit
        run: uvx pip-audit
```

#### .github/workflows/e2e.yml

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    # Use ubuntu-latest because browser dependencies are installed via apt
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Set up Python
        run: uv python install

      - name: Install dependencies
        run: uv sync --all-extras --dev

      - name: Install Playwright browsers
        run: uv run playwright install --with-deps chromium

      - name: Start app
        run: |
          uv run python -m app &
          curl --retry 30 --retry-delay 1 --retry-connrefused -sf -o /dev/null http://localhost:8000

      - name: Run E2E tests
        run: uv run pytest tests/e2e --base-url http://localhost:8000

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: screenshots/
```

#### .github/workflows/docker-build.yml

```yaml
name: Docker Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docker-build:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t ${{ github.repository }}:${{ github.sha }} .
```

#### .github/dependabot.yml

`dependabot.yml` is not a workflow, so place it directly under `.github/`, not in `.github/workflows/`.

```yaml
version: 2
updates:
  - package-ecosystem: "uv"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

#### Pinning Action Versions (pinact)

After creating the workflows, run pinact at the repository root to pin `uses:` in every workflow to a commit hash. Tags such as `@v4` in the templates are rewritten into the form `@<commit-hash> # v4`. Do not write commit hashes by hand.

```bash
pinact run
```

For how to install pinact, see https://github.com/suzuki-shunsuke/pinact.

### 3. E2E Tests with Playwright

Prepare the E2E tests run by `e2e.yml`. They can also be run locally.

#### Setting Up pytest-playwright

Add it as a development dependency and install the browser:

```bash
uv add --dev pytest-playwright
uv run playwright install chromium
```

#### Example Test File: Full-Page Screenshots

Create `tests/e2e/test_screenshot.py`:

```python
import re

import pytest
from playwright.sync_api import Page, expect

PAGES = [
    ("/", "homepage"),
    ("/about", "about"),
    ("/contact", "contact"),
]

VIEWPORTS = {
    "mobile": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "fhd": {"width": 1920, "height": 1080},
}


@pytest.mark.parametrize("viewport_name", VIEWPORTS)
@pytest.mark.parametrize(("path", "name"), PAGES)
def test_full_page_screenshot(page: Page, path: str, name: str, viewport_name: str) -> None:
    page.set_viewport_size(VIEWPORTS[viewport_name])
    page.goto(path)
    page.wait_for_load_state("networkidle")

    # Example file names: homepage-mobile.png / about-tablet.png / contact-fhd.png
    page.screenshot(path=f"screenshots/{name}-{viewport_name}.png", full_page=True)

    expect(page).to_have_title(re.compile(r".+"))
```

Run locally with the app running:

```bash
uv run pytest tests/e2e --base-url http://localhost:8000
```

#### Updating .gitignore

Add to `.gitignore`:

```
# Playwright
test-results/
screenshots/
```

### 4. Updating the README

Add the following to the existing README.md.

#### CI Badges (Add to the Top of the README)

```markdown
![Lint](https://github.com/{owner}/{repo}/actions/workflows/lint.yml/badge.svg)
![Test](https://github.com/{owner}/{repo}/actions/workflows/test.yml/badge.svg)
![Audit](https://github.com/{owner}/{repo}/actions/workflows/audit.yml/badge.svg)
![E2E](https://github.com/{owner}/{repo}/actions/workflows/e2e.yml/badge.svg)
![Docker Build](https://github.com/{owner}/{repo}/actions/workflows/docker-build.yml/badge.svg)
```

#### Quick Start Section

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker build -t app .
docker run -p 8000:8000 app
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman build -t app .
podman run -p 8000:8000 app
```

### Run Locally

```bash
uv sync
uv run python -m app
```
~~~

## Notes

- Make sure the project settings and dependencies are defined in `pyproject.toml`
- If you use Ruff, configure it in the `[tool.ruff]` section of `pyproject.toml`
- Adjust the Dockerfile entry point as needed
- If the security audit finds vulnerabilities, update the dependencies
- `test.yml` runs with the E2E tests (`tests/e2e`) excluded. The E2E tests are run in `e2e.yml` after starting the app
- If the app's start command or port differs, update both the start step in `e2e.yml` and `--base-url` accordingly
- After adding or changing workflows, re-pin the Action versions to commit hashes with `pinact run`
