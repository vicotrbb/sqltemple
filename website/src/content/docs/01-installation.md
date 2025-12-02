---
title: Install SQLTemple
description: Install via Homebrew on macOS or download releases for other platforms.
order: 1
---

## macOS via Homebrew

```bash
brew tap victorbona/sqltemple https://github.com/vicotrbb/sqltemple
brew install --cask sqltemple
```

If Gatekeeper blocks the first launch, right-click the app in Finder and choose **Open**. The build will be notarized in a future release.

## Download a release

1. Go to the GitHub Releases page.
2. Pick the installer for your platform: `.dmg` (macOS), `.exe`/`.msi` (Windows), `.deb`/`.rpm`/`.AppImage` (Linux when available).
3. Install as usual, then launch SQLTemple.

## Build from source

```bash
git clone https://github.com/vicotrbb/sqltemple.git
cd sqltemple
npm ci
npm start
```

To build a distributable: `npm run make`.
