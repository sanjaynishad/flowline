# Contributing to Flowline

Thanks for your interest in making Flowline better! Contributions of all kinds are welcome — bug reports, feature ideas, docs, and code.

## Ways to contribute

- **Report a bug** — open a [bug report](https://github.com/sanjaynishad/flowline/issues/new?template=bug_report.yml).
- **Request a feature** — open a [feature request](https://github.com/sanjaynishad/flowline/issues/new?template=feature_request.yml).
- **Improve the docs** — typos, clarifications, and examples are all fair game.
- **Send a pull request** — see the workflow below.

## Development setup

Flowline targets **Windows** and uses native modules (`better-sqlite3`, `@paymoapp/active-window`) that must be built against Electron's ABI.

```powershell
# Install deps and build native modules for Electron
npm run setup:win

# Run in development
npm run dev
```

> **Windows + Node 24 note:** use `npm run setup:win` instead of a plain `npm install` — Node 24 forces the ClangCL MSBuild toolset, which breaks native-module compilation.

## Before you open a pull request

1. **Fork** the repo and create a branch from `main` (e.g. `feat/streak-widget` or `fix/idle-detection`).
2. Run the type checks and make sure they pass:
   ```powershell
   npm run typecheck
   ```
3. Keep changes focused — one logical change per PR.
4. Write a clear PR description explaining **what** changed and **why**.

## Code style

- **TypeScript** throughout; prefer explicit, readable code over clever one-liners.
- Match the existing formatting in the file you're editing.
- Keep the main/preload/renderer boundaries clean — all IPC goes through the typed handlers in `src/main/ipc` and channel names in `src/shared/ipc.ts`.

## Reporting security issues

Please do **not** file public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for how to report privately.

## Code of conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
