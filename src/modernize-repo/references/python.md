# Pythonプロジェクトのモダナイズ

このプロンプトにしたがって、Pythonプロジェクトをモダナイズする。

- [Pythonプロジェクトのモダナイズ](#pythonプロジェクトのモダナイズ)
  - [手順](#手順)
    - [1. Docker化](#1-docker化)
      - [Dockerfile（マルチステージビルド）](#dockerfileマルチステージビルド)
      - [docker-compose.yml（開発用）](#docker-composeyml開発用)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD（GitHub Actions）](#2-cicdgithub-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
      - [.github/workflows/audit.yml](#githubworkflowsaudityml)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Actionsのバージョン固定（pinact）](#actionsのバージョン固定pinact)
    - [3. PlaywrightによるE2Eテスト](#3-playwrightによるe2eテスト)
      - [pytest-playwrightのセットアップ](#pytest-playwrightのセットアップ)
      - [テストファイルの例：フルページスクリーンショット](#テストファイルの例フルページスクリーンショット)
      - [.gitignoreの更新](#gitignoreの更新)
    - [4. READMEの更新](#4-readmeの更新)
      - [CIバッジ（READMEの先頭に追加）](#ciバッジreadmeの先頭に追加)
      - [クイックスタートセクション](#クイックスタートセクション)
  - [注意事項](#注意事項)

## 手順

### 1. Docker化

#### Dockerfile（マルチステージビルド）

```dockerfile
# ビルドステージ
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .

# 本番ステージ
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 非rootユーザーを作成
RUN groupadd --gid 1001 python && \
    useradd --uid 1001 --gid python --shell /bin/bash python

COPY --from=builder --chown=python:python /app/.venv ./.venv
COPY --chown=python:python . .

USER python
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["python", "-m", "app"]
```

#### docker-compose.yml（開発用）

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
# 仮想環境
.venv
venv
env
.env

# Git
.git
.gitignore
.gitattributes

# 環境変数
.env
.env.*
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo

# Pythonキャッシュ
__pycache__
*.py[cod]
*$py.class
*.so
.Python

# テストとカバレッジ
.pytest_cache
.coverage
htmlcov
.tox
.nox

# ドキュメント
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# ビルド
build
dist
*.egg-info
.eggs

# ログ
*.log

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.dockerignore

# 型チェック
.mypy_cache
.pytype
```

### 2. CI/CD（GitHub Actions）

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
    # ブラウザーの依存パッケージをaptで導入するため ubuntu-latest を使用
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

`dependabot.yml` はワークフローではないため、`.github/workflows/` ではなく `.github/` 直下に置く。

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

#### Actionsのバージョン固定（pinact）

ワークフローの作成後、リポジトリルートでpinactを実行し、すべてのワークフローの `uses:` をコミットハッシュに固定する。テンプレートの `@v4` などのタグは、`@<コミットハッシュ> # v4` の形式に書き換えられる。コミットハッシュは手書きしないこと。

```bash
pinact run
```

pinactのインストール方法は https://github.com/suzuki-shunsuke/pinact を参照する。

### 3. PlaywrightによるE2Eテスト

`e2e.yml` で実行するE2Eテストを用意する。ローカルでも実行できる。

#### pytest-playwrightのセットアップ

開発用依存関係として追加し、ブラウザーをインストールする：

```bash
uv add --dev pytest-playwright
uv run playwright install chromium
```

#### テストファイルの例：フルページスクリーンショット

`tests/e2e/test_screenshot.py` を作成する：

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

    # ファイル名の例: homepage-mobile.png / about-tablet.png / contact-fhd.png
    page.screenshot(path=f"screenshots/{name}-{viewport_name}.png", full_page=True)

    expect(page).to_have_title(re.compile(r".+"))
```

アプリを起動した状態で、ローカルで実行する：

```bash
uv run pytest tests/e2e --base-url http://localhost:8000
```

#### .gitignoreの更新

`.gitignore` に追加する：

```
# Playwright
test-results/
screenshots/
```

### 4. READMEの更新

既存のREADME.mdに以下を追加する。

#### CIバッジ（READMEの先頭に追加）

```markdown
![Lint](https://github.com/{owner}/{repo}/actions/workflows/lint.yml/badge.svg)
![Test](https://github.com/{owner}/{repo}/actions/workflows/test.yml/badge.svg)
![Audit](https://github.com/{owner}/{repo}/actions/workflows/audit.yml/badge.svg)
![E2E](https://github.com/{owner}/{repo}/actions/workflows/e2e.yml/badge.svg)
![Docker Build](https://github.com/{owner}/{repo}/actions/workflows/docker-build.yml/badge.svg)
```

#### クイックスタートセクション

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker build -t app .
docker run -p 8000:8000 app
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman build -t app .
podman run -p 8000:8000 app
```

### ローカルで実行

```bash
uv sync
uv run python -m app
```
~~~

## 注意事項

- `pyproject.toml` にプロジェクト設定と依存関係が定義されていることを確認すること
- Ruffを使用する場合は、`pyproject.toml` の `[tool.ruff]` セクションで設定すること
- 必要に応じてDockerfileのエントリーポイントを調整すること
- セキュリティ監査で脆弱性が見つかった場合は、依存関係を更新すること
- `test.yml` はE2Eテスト（`tests/e2e`）を除外して実行する。E2Eテストは `e2e.yml` でアプリを起動してから実行する
- アプリの起動コマンドやポートが異なる場合は、`e2e.yml` の起動ステップと `--base-url` を合わせて更新すること
- ワークフローを追加・変更したら、`pinact run` でActionsのバージョンをコミットハッシュに固定し直すこと
