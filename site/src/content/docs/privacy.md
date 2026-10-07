---
title: Privacy
description: Flowline stores Windows app and browser time in local SQLite, with no account, no screen recording, and no telemetry inside the desktop app.
order: 6
---

# Privacy

Flowline has no server to send your activity to. That is a storage choice, not a badge. The desktop app writes a SQLite file on the PC that is running it.

The database is not encrypted at rest. Anyone who can read your Windows user profile can open the file. Protect the PC the way you would any other local log.

## What is stored

- Foreground app name, window title, category, and duration.
- Browser domain, when the [extension](/flowline/docs/browser-extension) is connected.
- Settings, rules, focus sessions, and goal progress.

The file path is `%APPDATA%/flowline/flowline.db`.

The extension talks only to `ws://127.0.0.1:7413` on the same machine. It does not call an external host.

## What is not stored

- Screenshots, screen video, or pixel contents of a window.
- Keystrokes.
- An account, email address, or device token for a Flowline backend. There is no backend.
- A copy of the database on someone else's computer, unless you export it and send it yourself.

Idle time is omitted from totals. That does not hide the apps you did use.

## What you can do with the file

Export CSV or JSON from the app if you want a copy. Quit Flowline and delete `flowline.db` if you want the history gone. The MIT-licensed source is the check on these claims. Read [how it works](/flowline/docs/how-it-works) for the write path.

## This website is separate

The marketing site may load Google Analytics when a measurement ID is set at build time. That script is not inside the desktop app, and the app does not send tracking rows to it. If you never visit the site, that tag never runs.
