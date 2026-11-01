# Changelog

All notable changes to **DevStart CLI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-01

### Added
- **Local Rule-Based Detection Engine**: Zero-AI, scoring-based technology analyzer.
- **Languages Supported**: JavaScript, TypeScript, Python, Java, Rust, Go, PHP, Ruby, C#/.NET, Dart.
- **Frameworks Supported**: React, Next.js, Vite, Vue, Svelte, Angular, Express, NestJS, Fastify, Django, Flask, FastAPI, Streamlit, Spring Boot.
- **Package Managers**: npm, yarn, pnpm, bun, pip, poetry, pipenv, uv, conda, maven, gradle.
- **Conflict Detection**: Identification and warning for multiple conflicting lockfiles in the same component.
- **Deterministic Installations**: Prefers `npm ci`, `yarn install --frozen-lockfile`, `pnpm install --frozen-lockfile`, and `bun install --frozen-lockfile`.
- **Python Virtualenv Automation**: Automatic `.venv` creation on Windows, macOS, and Linux with isolated dependency installation.
- **Multi-Service Concurrent Runner**: `devstart run` concurrent process manager with colored logs, automatic URL/port detection, and graceful Ctrl+C teardown.
- **System Doctor**: `devstart doctor` diagnostics for installed runtimes and tools.
- **Safe Environment Handling**: Detection of `.env.example` templates and missing variables without exposing secrets.
- **Dry-Run Capability**: `--dry-run` simulation mode across all setup actions.
- **Full Test Suite**: 20 unit and integration tests covering all subsystems.
