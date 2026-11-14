# README.mdのフォーマット例

以下のフォーマットは基本的なものです。必要に応じて、リポジトリの内容に合わせて適宜修正してください。

```md
# your-repository

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Lint](https://github.com/hidao80/your-repository/actions/workflows/lint.yml/badge.svg)
![Audit](https://github.com/hidao80/your-repository/actions/workflows/audit.yml/badge.svg)
![Build](https://github.com/hidao80/your-repository/actions/workflows/build.yml/badge.svg)
![Test](https://github.com/hidao80/your-repository/actions/workflows/test.yml/badge.svg)

[![Security: Takumi Guard](https://img.shields.io/badge/Security-Takumi%20Guard-blue)](https://github.com/hidao80/mago-vsx/actions/workflows/npm-scan.yml)
[![Ask DeepWiki](https://img.shields.io/badge/Ask_DeepWiki-007ec6?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAACIUlEQVRYw%2B2XP2gUQRTGv7d3JhYWQawkIBaCVWzETos0gmAnVoKNTSoLK0E7EQQrC20sBVFBtLPQRgTBtBaKjYgIQUSxiJq7fT%2BLvCGPJZdNLt4dQj5Y3u7sznzfzLw%2Fs9IO%2FicANiniCujEfWdsQgBLxAbsbraPZcmBfcAt4DNwKQsZNfEUsAB8YRV12LfA6ZHuedg7AO7ed%2Fc%2BUBcbQhbiu%2B6wXIM6EnZWkszMJe2Ke0n6I2la0v51hFeSMLN6OwIK6jJwEBdUYb2MAxRSz6sY4geiahFgLe1Hwq6YWe3us8AN4FQQU4QM64SPY69Xyr43fADgNjAPXHb3peSsD4FDQ0VLEjAHvIhBPS6AHvA1bBO9JPAXcHFbIRtJ5yzwIQZ9CZwAusDJENIkLqsG8DpNyIZJwSUk9wLHgakcesC1JCCjiHm1kYDNOEjptCxpSVK%2F8f73OFLxPLAYM3oCzEX7MXf%2FlJbc%2F8kWpA4HgQdpYI9IWAbeh83whi84cHXL%2B58EPBoQhnmm94EzwE3gZ2p%2FDhzdbhg%2BTaRr01x7ftb4%2FjBwFzjXrCvDpmLW9crVLNeR9CaapoGemb2TdCERW1tNaBNQ8jktwmozqwtpqRNtdWAjARYk39IS12ZWRX7vmJmA71nQZgi36gN7gCvAj5xc3P0jcH7kx7Ik5IC73wsh14GZsZySow5002l4Jr0b6%2Bm4eSyvpAn8lEzsx2QHo8RfUrlN%2BuPq4ksAAAAASUVORK5CYII%3D&labelColor=010101)](https://deepwiki.com/hidao80/your-repository)

## Overview

{リポジトリの概要を簡潔に記載する。}

## Issues & Reasons

{このリポジトリの課題とそれを解決するための理由を簡潔に記載する。}

## Features

### Core Functionality

- **{機能名}:** {機能の簡単な説明。複数あるときは箇条書きにする}

### Additional Features

- **{機能名}:** {機能名の簡単な説明。複数あるときは箇条書きにする}

### User Experience

- **{ユーザー体験名}:** {ユーザー体験名1の簡単な説明。複数あるときは箇条書きにする}

### Internationalization & Accessibility

{i18nやアクセシビリティに関する取り組みの簡単な説明。複数あるときは箇条書きにする}

### Deployment

- **{デプロイメント名}:** {デプロイメント名の簡単な説明。複数あるときは箇条書きにする}

## Tech Stack

{技術スタックを簡潔に記載する。複数あるときはMarkdownの表形式で記載する。}

{例：
| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript (strict) |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 4 |
| Markdown | marked + DOMPurify (sanitization) |
| Storage | IndexedDB (native) |
| i18n | i18next / react-i18next |
| Server | Node `http` + sirv (with security headers) / nginx (Docker) |
}

### Key Technologies

- **{技術名}:** {技術名の簡単な説明。複数あるときは箇条書きにする}

## Quick Start

### Run instantly (no install)

```bash
{command} your-repository
```

> **{注意書き}:** {なければこの行毎作成しない。あれば、注意書きの内容を簡潔に記載する。複数あるときは箇条書きにする}

### Run with Docker

{例:
```bash
# Development
docker compose up

# Production build
docker build -t your-repository .
docker run -p 80:80 your-repository
```
}

### Run with Podman

{例:
```bash
# Development
podman compose up
```

# Production build
```bash
podman build -t your-repository .
podman run -p 80:80 your-repository
```
}

## Configuration

- **{設定名}:** {設定名の簡単な説明。複数あるときは箇条書きにする}


## Development

### Build

{例:
```bash
bun run build
```
}

### Project Structure

{例:
```plain
src/
├── components/
│   ├── Chat.tsx             # Chat view (send / stream loop)
│   ├── ChatSidebar.tsx      # Session history sidebar
│   ├── ConfirmModal.tsx     # Confirmation dialog
│   ├── Minimap.tsx          # Chat minimap
│   └── Settings.tsx         # Connection / model settings
├── lib/                     # Non-UI helpers (API calls, storage, rendering) + unit tests
├── locales/
│   ├── en.json              # English translations
│   └── ja.json              # Japanese translations
├── App.tsx                  # Root component
├── i18n.ts                  # i18n configuration
├── index.css                # Global styles
├── main.tsx                 # Entry point
└── vite-env.d.ts            # Vite type declarations
```
}

## :handshake: Contributing

{例:
Contributions are welcome!  
Please note that this project uses [Takumi Guard](https://github.com/flatt-security/setup-takumi-guard-npm) in CI workflows to scan dependencies for malware and ensure supply chain security. This scanning only applies to CI and does not affect your local development environment.
}

## :page_facing_up: License

{例:
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
}

```