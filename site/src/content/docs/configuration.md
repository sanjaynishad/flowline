---
title: Configuration
description: Edit Flowline categorization rules, daily deep-work goals, idle detection, and distraction alerts in the Windows time tracker.
order: 4
---

# Configuration

Open Settings to change how the automatic tracker labels time and when it notifies you. None of these options upload anything. They only change the local database and the notifications on this PC.

## Categorization rules

Flowline decides whether activity is **productive**, **neutral**, or **distracting** using rules.
It ships with ~80 sensible defaults, and every rule is editable on the **Rules** page.

Each rule matches by:

- **App**: the executable name, for example `Code.exe`.
- **Domain**: a website host, for example `github.com` (most accurate with the browser extension).
- **Title**: a keyword in the window title, for example `Standup`.

Rules can also carry an optional **threshold**. It does not change a rule's category or act as a
daily budget; it only sets how long a continuous distracting stretch must run before Flowline
sends a distraction alert.

## Goals & streaks

Set a daily **deep-work target** and a **distraction limit**. These drive:

- The goal progress on the Dashboard.
- Your running **streak** of days that hit the target.
- The 7-day weekly report.

## Tracking behavior

| Setting            | What it controls                                              |
| ------------------ | ------------------------------------------------------------- |
| Idle threshold     | How long without input before time stops counting (AFK).      |
| Heartbeat interval | How often Flowline checks idle state and flushes durations.   |
| Distraction alert  | How long of continuous off-task time triggers a notification. |

## Notifications & startup

- Toggle desktop **notifications** for distraction alerts and session breaks.
- Enable **launch on login** so tracking resumes automatically.

## Theme

Choose **dark**, **light**, or **system** (the default follows your OS).

## Export

From the app you can export activity as CSV or JSON. That file is a copy you control. Flowline does not sync it.

Distraction alerts fire after a stretch of off-task time. They do not block the site or close the app. If you wanted a blocker, this setting will not become one.
