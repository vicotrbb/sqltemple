---
title: Install SQLTemple
description: Install via Homebrew on macOS, download releases for other platforms, or build from source.
order: 1
---

## macOS via Homebrew

```bash
brew tap victorbona/sqltemple https://github.com/vicotrbb/sqltemple
brew install --cask sqltemple
```

If macOS Gatekeeper blocks the first launch, right-click the app in Finder and choose **Open**. Notarized builds will ship in a future release.

## Download a release

1. Visit the GitHub Releases page: `https://github.com/vicotrbb/sqltemple/releases`.
2. Choose your platform installer: `.dmg` (macOS), `.exe` / `.msi` (Windows), or `.deb` / `.rpm` / `.AppImage` (Linux when available).
3. Install as usual and launch SQLTemple from Applications / Start Menu.

## Build from source

```bash
git clone https://github.com/vicotrbb/sqltemple.git
cd sqltemple
npm ci
npm start
```

To build a distributable: `npm run make`.

## Requirements

- macOS 10.15 or later for the prebuilt DMG.
- Node.js 18+ for development/build tooling.
- API key for cloud AI features (OpenAI or Claude); not needed for local providers (Ollama, LM Studio).
