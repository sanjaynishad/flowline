---
title: Introduction
description: "What the Flowline automatic time tracker does on Windows, who it is for, and the limits: no Mac build, no website blocker, no account."
order: 1
---

# Introduction

Flowline is a free automatic time tracker for Windows 10 and 11. It records the foreground app, tags that time as productive, neutral, or distracting, and shows the day on a local dashboard. An optional Chrome or Edge extension adds the active browser domain.

There is no account and no upload. The history file is SQLite at `%APPDATA%/flowline/flowline.db`.

## Who it is for

- Developers, writers, designers, and students doing desk work on their own PC.
- People who drop manual timers after a day or two.
- Anyone who will not send an activity log to a cloud time tracker.

It is not for employers, teachers, or parents who want to watch someone else's screen. There is no admin view.

## What it does not do

- No macOS or Linux build. Tracking uses Windows foreground-window APIs.
- No website or app blocking. A distraction alert is a notification.
- No screen recording and no keystroke log.
- No team billing. If you need client timesheets, a timer product is a better fit.

## How it differs from a cloud tracker

RescueTime and similar services keep the timeline on their servers and ask you to sign in. Flowline does not. [ActivityWatch](/flowline/compare) is the nearer open-source neighbor: local data, more platforms, more assembly. Flowline trades that range for a Windows UI with rules, Pomodoro blocks, goals, and streaks already wired up.

Per-site numbers need the [browser extension](/flowline/docs/browser-extension). Without it, browser time is guessed from the window title.

## Next steps

- [Install Flowline](/flowline/docs/installation) on Windows.
- Add the [browser extension](/flowline/docs/browser-extension) if you want domains, not just "Chrome".
- Edit rules and goals in [Configuration](/flowline/docs/configuration).
- Read [Privacy](/flowline/docs/privacy) before you decide the local-database claim is enough.
