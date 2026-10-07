---
title: How to track app and browser time on Windows without an account
description: Install an automatic Windows time tracker, add per-site browser tracking, and keep the log in a local file. No RescueTime account required.
date: 2026-10-06
tags: ['guide', 'windows', 'privacy']
---

A cloud time tracker wants an email before it will tell you that you spent two hours in a browser. You can skip that. On Windows, an automatic tracker can watch the foreground window and write the log to a file you already own.

This is the setup I use with Flowline. It is free, MIT licensed, and Windows 10 or 11 only. It will not run on a Mac, and it will not block sites.

## Install and let it run

Download the installer from the [download page](/flowline/download), or follow the [installation guide](/flowline/docs/installation) if you would rather build it. Early builds are unsigned. SmartScreen may ask you to choose More info, then Run anyway.

After install, leave the tray icon running. Tracking starts without a timer button. Launch on login is in Settings if you want it to survive a reboot.

The first launch seeds about 80 categorization rules. They are a starting guess, not a verdict.

## Split browser time by domain

Until you add the extension, Chrome is one bucket plus whatever the window title happens to say. Load Flowline Bridge unpacked in Chrome or Edge. The steps are in the [browser extension doc](/flowline/docs/browser-extension). When the header says Browser Linked, new time is attributed to the domain, such as `github.com`.

The extension talks to `ws://127.0.0.1:7413` on your machine. It is not a store listing, and it does not send the tab to a server.

## Fix the rules that are wrong

Open Rules. Match an app by executable name (`Code.exe`), a site by domain, or a window title by keyword. If a chat app is productive until it is not, set a daily threshold so the extra time counts as distracting.

Categories are productive, neutral, and distracting. Edit them. The defaults will misfile something you care about.

## Read the day, then export if you want a copy

The dashboard is the short version: deep work, distraction, context switches, top apps. Insights is the shape of the day. Sessions is where a 25 minute block lives, if you want one. That part is optional. The automatic log does not depend on it.

Export CSV or JSON from the app when you want the rows in a spreadsheet. The source file stays at `%APPDATA%/flowline/flowline.db`. Quit the app before you delete it.

Nothing in this flow creates an account. If a page asks you to sign in to see your own afternoon, you are in a different product. The [comparison](/flowline/compare) names the usual ones.
