---
title: 'Introducing Flowline, a local time tracker for Windows'
description: A free automatic time tracker for Windows that stores app and browser time in local SQLite, with no account and no cloud upload.
date: 2026-10-07
tags: ['announcement', 'productivity', 'privacy']
---

Most time trackers ask you to pick a cloud account or a timer you will forget to start. Flowline is the third option I wanted on my own PC: automatic capture, local file, no sign-up.

It is a free, MIT-licensed focus tracker for Windows 10 and 11. It runs in the tray, records the foreground app, and writes the day to SQLite.

## What it records

A window switch is the event. Idle time is dropped so a lunch break does not look like deep work. Rules tag each stretch productive, neutral, or distracting, and you can edit those rules when the default is wrong.

The dashboard shows deep-work total, distraction time, context switches, a time-allocation ring, top apps, and a live stream. That view is built from the local file. There is no sync step.

## Browser domains

An optional Chrome or Edge extension, Flowline Bridge, sends the active tab's full URL (path and query included) to `localhost`, and the app derives the domain from it. Time can land on `github.com` or `youtube.com` instead of a single Chrome bucket. The extension is loaded unpacked. It is not in the Chrome Web Store.

## Sessions, without pretending to be a blocker

You can start a 15, 25, or 50 minute focus block, set a daily deep-work goal, and get a notification after a long distracting stretch. The notification does not close the app or block the site. If that is the feature you came for, Flowline will not grow into it.

## Limits, on purpose

Windows only. No team dashboard. No screen recording, no keystroke log. The database is local and not encrypted, so it is only as private as the PC. The [privacy doc](/flowline/docs/privacy) is the precise version of that claim.

If you are choosing between this and RescueTime or ActivityWatch, the [comparison](/flowline/compare) is shorter than guessing from feature lists.

[Download Flowline](/flowline/download) or [read the install guide](/flowline/docs/installation).
