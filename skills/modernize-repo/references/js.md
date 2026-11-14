# Modernizing a JavaScript/TypeScript Project

Modernize the JavaScript/TypeScript project by following this prompt.

- [Modernizing a JavaScript/TypeScript Project](#modernizing-a-javascripttypescript-project)
  - [Detecting the Package Manager](#detecting-the-package-manager)
  - [Procedure](#procedure)
    - [1. Dockerization](#1-dockerization)
      - [Dockerfile (Multi-Stage Build)](#dockerfile-multi-stage-build)
        - [npm](#npm)
        - [pnpm](#pnpm)
        - [yarn](#yarn)
        - [bun](#bun)
        - [deno](#deno)
      - [docker-compose.yml (Development)](#docker-composeyml-development)
        - [npm / yarn / pnpm](#npm--yarn--pnpm)
        - [bun](#bun-1)
        - [deno](#deno-1)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD (GitHub Actions)](#2-cicd-github-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
        - [npm / pnpm / yarn / bun](#npm--pnpm--yarn--bun)
        - [deno](#deno-2)
      - [biome.json](#biomejson)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
        - [npm](#npm-1)
        - [pnpm](#pnpm-1)
        - [yarn](#yarn-1)
        - [bun](#bun-2)
        - [deno](#deno-3)
      - [.github/workflows/audit.yml (npm/pnpm/yarn/bun only)](#githubworkflowsaudityml-npmpnpmyarnbun-only)
        - [npm](#npm-2)
        - [pnpm](#pnpm-2)
        - [yarn](#yarn-2)
        - [bun](#bun-3)
        - [deno](#deno-4)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
        - [npm](#npm-3)
        - [pnpm](#pnpm-3)
        - [yarn](#yarn-3)
        - [bun](#bun-4)
        - [deno](#deno-5)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Pinning Action Versions (pinact)](#pinning-action-versions-pinact)
    - [3. E2E Tests with Playwright](#3-e2e-tests-with-playwright)
      - [Setting Up Playwright](#setting-up-playwright)
        - [npm/pnpm/yarn/bun](#npmpnpmyarnbun)
        - [deno](#deno-6)
      - [playwright.config.ts](#playwrightconfigts)
      - [Example Test File: Full-Page Screenshots](#example-test-file-full-page-screenshots)
      - [Updating .gitignore](#updating-gitignore)
    - [4. Updating the README](#4-updating-the-readme)
      - [CI Badges (Add to the Top of the README)](#ci-badges-add-to-the-top-of-the-readme)
      - [Quick Start Section](#quick-start-section)
        - [npm](#npm-4)
        - [pnpm](#pnpm-4)
        - [yarn](#yarn-4)
        - [bun](#bun-5)
        - [deno](#deno-7)
  - [Notes](#notes)

## Detecting the Package Manager

Before applying the templates, detect the package manager:

| Lock file | Package manager | Install command | Run command |
|-----------|----------------|-----------------|-------------|
| `pnpm-lock.yaml` | pnpm | `pnpm install --frozen-lockfile` | `pnpm run` |
| `yarn.lock` | yarn | `yarn install --frozen-lockfile` | `yarn` |
| `bun.lockb` or `bun.lock` | bun | `bun install --frozen-lockfile` | `bun run` |
| `deno.lock` | deno | `deno install` | `deno task` |
| `package-lock.json` | npm | `npm ci` | `npm run` |
| (none, but package.json exists) | npm | `npm ci` | `npm run` |

## Procedure

### 1. Dockerization

#### Dockerfile (Multi-Stage Build)

Choose the appropriate template according to the detected package manager.

##### npm

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### pnpm

```dockerfile
# Build stage
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### yarn

```dockerfile
# Build stage
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### bun

```dockerfile
# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

##### deno

```dockerfile
# Build stage
FROM denoland/deno:2 AS builder
WORKDIR /app
COPY deno.json deno.lock ./
RUN deno install
COPY . .
RUN deno task build

# Production stage
FROM denoland/deno:2-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 deno && \
    adduser --system --uid 1001 deno
COPY --from=builder --chown=deno:deno /app/dist ./dist
COPY --from=builder --chown=deno:deno /app/deno.json ./
USER deno
EXPOSE 3000
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "dist/index.js"]
```

#### docker-compose.yml (Development)

##### npm / yarn / pnpm

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: ${PKG_RUN_CMD:-npm run} dev  # Replacement examples: yarn dev / pnpm run dev
```

##### bun

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: bun run dev
```

##### deno

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - DENO_ENV=development
    command: deno task dev
```

#### .dockerignore

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build artifacts
dist
build
out

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

# Tests and coverage
coverage
.nyc_output
*.lcov

# Documentation
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# Package managers
.npm
.yarn
.pnpm-store

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

### 2. CI/CD (GitHub Actions)

Use the appropriate workflow according to the detected package manager.

#### .github/workflows/lint.yml

##### npm / pnpm / yarn / bun

Biome runs as a standalone binary, so a common workflow can be used regardless of the package manager.

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
      - uses: biomejs/setup-biome@v2
        with:
          version: latest
      - run: biome lint .
```

##### deno

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
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno lint
```

#### biome.json

Create a lint configuration for JS/TS files (including E2E tests) at the project root.
Applies to npm/pnpm/yarn/bun only.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": false
  }
}
```

#### .github/workflows/test.yml

##### npm

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

##### pnpm

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
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

##### yarn

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test
```

##### bun

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
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun test
```

##### deno

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
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno task test
```

#### .github/workflows/audit.yml (npm/pnpm/yarn/bun only)

##### npm

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
```

##### pnpm

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
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
```

##### yarn

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn audit --level high
```

##### bun

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm i --package-lock-only
      - run: npm audit --audit-level=high
```

##### deno

Deno uses URL imports and a built-in security model, so a separate audit workflow is not needed.

#### .github/workflows/e2e.yml

Run the Playwright E2E tests prepared in step 3. The server is started by `webServer` in `playwright.config.ts`. Because browser dependencies are installed via apt, use `ubuntu-latest` for `runs-on`.

##### npm

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### pnpm

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### yarn

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn playwright install --with-deps chromium
      - run: yarn test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### bun

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### deno

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      # The test:e2e task in deno.json runs Playwright via npx
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: deno install
      - run: npx playwright install --with-deps chromium
      - run: deno task test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
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
      - run: docker build -t ${{ github.repository }}:${{ github.sha }} .
```

#### .github/dependabot.yml

`dependabot.yml` is not a workflow, so place it directly under `.github/`, not in `.github/workflows/`.

```yaml
version: 2
updates:
  # Specify "npm" for npm/pnpm/yarn and "bun" for bun.
  # deno is not supported by Dependabot, so remove this entry.
  - package-ecosystem: "npm"
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

#### Setting Up Playwright

Add Playwright as a development dependency and initialize the configuration. The tests prepared here are run both locally and in `e2e.yml`.

##### npm/pnpm/yarn/bun

Add to `package.json`:

```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@playwright/test": "^1.49.0"
  },
  "scripts": {
    "lint": "biome lint .",
    "screenshot": "playwright test tests/e2e/screenshot.spec.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

##### deno

Add to `deno.json`:

```json
{
  "tasks": {
    "test:e2e": "npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "test:e2e:headed": "npx playwright test --headed"
  }
}
```

#### playwright.config.ts

Create a configuration file shared by all package managers:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'fhd',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'npm run dev',  // Adjust for your package manager
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Example Test File: Full-Page Screenshots

Create `tests/e2e/screenshot.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
];

test.describe('Full-page screenshot tests', () => {
  for (const pageInfo of PAGES) {
    test(`capture ${pageInfo.name}`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Example file names: homepage-mobile.png / about-tablet.png / contact-fhd.png
      await page.screenshot({
        path: `screenshots/${pageInfo.name}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveTitle(/.+/);
    });
  }
});
```

#### Updating .gitignore

Add to `.gitignore`:

```
# Playwright
test-results/
playwright-report/
playwright/.cache/
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

Note: for deno projects, omit the Audit badge.

#### Quick Start Section

Choose the appropriate section according to the detected package manager.

##### npm

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
npm install
npm run dev
```
~~~

##### pnpm

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
pnpm install
pnpm run dev
```
~~~

##### yarn

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
yarn install
yarn dev
```
~~~

##### bun

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
bun install
bun run dev
```
~~~

##### deno

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
deno install
deno task dev
```
~~~

## Notes

- Detect the package manager by checking lock files in priority order (pnpm → yarn → bun → deno → npm)
- Make sure the appropriate scripts are defined in the configuration file:
  - **npm/pnpm/yarn/bun**: `package.json` needs `build`, `dev`, `lint`, `test`, and `test:e2e` scripts
  - **deno**: `deno.json` needs `build`, `dev`, `test`, and `test:e2e` tasks
- Adjust the build command and entry point in the Dockerfile as needed to match the project structure
- Lint (Biome):
  - npm/pnpm/yarn/bun: run `biome lint .` via the `biomejs/setup-biome@v2` GitHub Action (no Node.js setup required)
  - deno: `deno lint` (built-in linter)
  - Create `biome.json` at the project root and configure the rules
  - Local run: `npx biome lint .`, or install it as a devDependency and use `npm run lint`
- Security audit commands differ by package manager:
  - npm: `npm audit fix`
  - pnpm: `pnpm audit --fix`
  - yarn: `yarn audit` (requires manual fixes)
  - bun: no built-in audit (use `npm audit` with package-lock.json)
  - deno: uses URL imports and a built-in security model
- E2E tests with Playwright:
  - CI: runs in `e2e.yml` (use the template for the detected package manager)
  - Install Playwright: `npx playwright install` (or the equivalent command for your package manager)
  - Run tests locally: `npm run test:e2e` (adjust for your package manager)
  - Run tests in UI mode: `npm run test:e2e:ui`
  - Update the webServer command in `playwright.config.ts` to match your package manager
  - Full-page screenshots are saved to the `screenshots/` directory (add it to `.gitignore`)
- After adding or changing workflows, re-pin the Action versions to commit hashes with `pinact run`
