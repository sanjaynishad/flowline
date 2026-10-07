---
title: Browser extension
description: Load the optional Flowline Bridge extension in Chrome or Edge so automatic Windows time tracking splits by website domain.
order: 3
---

# Browser extension

Without an extension, Flowline can only see the browser window title. That is enough to know Chrome was open. It is a weak way to tell GitHub from YouTube.

The optional Flowline Bridge reports the active tab's URL to the app. Time then lands on `youtube.com` or `github.com` instead of one Chrome bucket. It is a Manifest V3 extension for Chrome and Edge. It is not listed in the Chrome Web Store. You load it unpacked.

## Install

1. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
2. Click **Load unpacked** and select the `browser-extension/` folder from the Flowline source.
3. The extension auto-connects to the app over a local WebSocket at `ws://127.0.0.1:7413`.

When connected, the app header shows **Browser Linked**.

## How it works

The extension sends the active tab's URL to the Flowline process on the same PC, over
`localhost`. The app stores both that full URL and the domain it derives from it. It does not
call an external server. That traffic is covered again in [Privacy](/flowline/docs/privacy).

The app and extension communicate on `ws://127.0.0.1:7413`. That port is fixed, so if another
program is already using it, free that program up rather than changing Flowline.

## Troubleshooting

- **Header still says "Browser" not "Browser Linked":** make sure the app is running before the
  browser, and that no firewall rule blocks `127.0.0.1:7413`.
- **Time still lands in a generic bucket:** confirm the extension is enabled and the page isn't a
  restricted URL (e.g. `chrome://` pages can't be read by extensions).
