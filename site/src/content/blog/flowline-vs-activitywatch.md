---
title: 'Flowline and ActivityWatch: two local time trackers'
description: ActivityWatch and Flowline both keep activity on your machine. One is a cross-platform watcher kit. Flowline is a Windows tracker with rules and sessions.
date: 2026-10-05
tags: ['comparison', 'activitywatch', 'local-first']
---

ActivityWatch is the project people recommend when they refuse a cloud time tracker. Flowline is aimed at the same refusal, then it narrows the job. Both are open source. Both store data locally. They are not the same install.

This is the short version. The [comparison page](/flowline/compare) also lines them up against RescueTime, Toggl Track, and ManicTime.

## What ActivityWatch is good at

ActivityWatch runs on Windows, Mac, and Linux. Watchers collect events. You can add more, query the bucket, and treat the log as data rather than as a single dashboard. If you already script your machine, that shape is the point.

It does not ask for an account. That part matches Flowline.

## What Flowline keeps smaller

Flowline is Windows 10 and 11 only. The tracker listens for foreground-window changes, writes SQLite, and shows a dashboard with categories, a weekly report, and Pomodoro blocks of 15, 25, or 50 minutes. Rules are editable in the app: app, domain, or window-title keyword.

Browser domains need the optional extension, loaded unpacked. There is no watcher marketplace and no Mac build. There is also no team view.

I would not pick Flowline to replace ActivityWatch on a Linux laptop. I would pick it when the machine is Windows and the goal is to read today without assembling the pipeline.

## Privacy is similar, and neither is magic

Local storage means the vendor does not have the file. It does not mean the file is encrypted. On Flowline the path is `%APPDATA%/flowline/flowline.db`. Treat it like any other log on that user account. Details are in the [privacy doc](/flowline/docs/privacy).

Neither tool blocks websites. A Flowline distraction alert is a notification after a stretch of off-task time. If you came from a blocker search, both projects will disappoint you in the same way.

## How to choose

Use ActivityWatch if you need more than Windows, or you want the event log as a toolkit.

Use Flowline if you want automatic app tracking, a focus dashboard, and sessions on one Windows PC, with no account. [Download](/flowline/download) is the installer. [How it works](/flowline/docs/how-it-works) is the capture path if you want to read it before you run it.
