---
title: How it works
description: How the Flowline time tracker watches the Windows foreground window, detects idle time, and stores app and browser time in local SQLite.
order: 5
---

# How it works

Flowline is an Electron app. The window you see is React. The tracker lives in the main process and writes SQLite through better-sqlite3. This page is the path from a window switch to a row in the dashboard.

## Foreground-window tracking

The main process subscribes to Windows foreground-window changes (`SetWinEventHook` via
`@paymoapp/active-window`) and records an event whenever the active window or its title changes.
This is **event-driven**, not busy-polling, so it stays light on CPU.

## Idle & duration heartbeat

A roughly 20-second heartbeat checks idle time (`powerMonitor`) and flushes the duration of long,
switch-free windows. Time spent away from the keyboard is detected as **AFK** and isn't counted.

## Browser bridge

For browsers, the **Flowline Bridge** extension pushes the active tab's URL to the app over a
local WebSocket (`ws://127.0.0.1:7413`). When present, time is attributed to the exact domain.
Without it, browser time falls back to window-title heuristics. See
[Browser extension](/flowline/docs/browser-extension).

## Categorization

Each recorded event is matched against your rules (app, domain, or title) and tagged
**productive**, **neutral**, or **distracting**. See [Configuration](/flowline/docs/configuration).

## Local storage

Everything is stored in a local **SQLite** database in your user-data folder
(`%APPDATA%/flowline/flowline.db`). Nothing is uploaded. See [Privacy](/flowline/docs/privacy).

## Project structure

```
src/
  main/         Electron main process
    tracking/   active-window subscription, idle heartbeat, categorizer
    browser/    local WebSocket bridge for the extension
    db/         SQLite schema, seed rules, queries
    ipc/        typed IPC handlers
  preload/      contextBridge API
  renderer/     React UI (Dashboard, Insights, Rules, Sessions, Settings)
  shared/       shared types, IPC channel names, date-range helpers
browser-extension/   Chrome (MV3) companion extension
```
