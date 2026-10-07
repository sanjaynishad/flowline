---
title: Installation
description: Install the free Flowline time tracker on Windows 10 or 11, or build the open-source app from source with the setup:win script.
order: 2
---

# Installation

Flowline runs on Windows 10 and 11, 64-bit. There is no Mac or Linux installer. After setup, tracking starts on its own. You do not create an account.

## Option A: download the installer

1. Go to the [Releases page](https://github.com/sanjaynishad/flowline/releases).
2. Download the latest `Flowline-Setup-x.y.z.exe`.
3. Run it. Flowline installs, adds a system-tray icon, and can start automatically on login.

> Flowline is open source and unsigned during early releases, so Windows SmartScreen may show
> a "Windows protected your PC" prompt. Click **More info → Run anyway**. You can always build
> it yourself from source instead (below).

## Option B: build from source

You'll need **Node.js** and the Windows build tools for native modules.

```powershell
git clone https://github.com/sanjaynishad/flowline.git
cd flowline

# Install deps and build native modules for Electron
npm run setup:win

# Run in development
npm run dev

# Build production bundles
npm run build

# Package a Windows installer (NSIS .exe)
npm run dist:win
```

### Why `setup:win` instead of `npm install`?

Node 24 bundles a `common.gypi` that forces the ClangCL MSBuild toolset, which breaks a plain
`npm install` when compiling native modules. The native modules only need building against
Electron's ABI, so `setup:win` runs:

```powershell
npm install --ignore-scripts
node node_modules/electron/install.js
npx electron-rebuild -f
```

## First run

On first launch Flowline seeds about 80 default categorization rules and starts tracking
immediately. Open the **Dashboard** to watch the day build up, then add the
[browser extension](/flowline/docs/browser-extension) if you want time split by domain instead of
by window title.

The packaged installer also copies a `browser-extension` folder you can load unpacked. Source
builds use the `browser-extension/` directory in the repo. Details are in the extension doc.
The [download page](/flowline/download) lists what the installer includes and what it leaves out.
