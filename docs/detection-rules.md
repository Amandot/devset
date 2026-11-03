# DevSet CLI — Detection Rules & Scoring Engine

DevSet CLI replaces opaque heuristics with a **deterministic scoring matrix**. Every signature provides additive points toward technology confirmation.

---

## 1. Scoring Thresholds

- **Confirmed Status**: Score $\ge$ Rule Threshold (typically 15–20 points).
- **Possible Status**: Score $\ge$ Minimum Score for Possible (typically 8–10 points).
- **Conflict Flagging**: Triggered when distinct lockfiles or managers are discovered in the same component.

---

## 2. Language Detection Matrix

| Technology | Signature Pattern | Rule Type | Weight |
|---|---|---|---|
| **JavaScript** | `package.json` | Exact file | 15 |
| | `**/*.js`, `**/*.mjs`, `**/*.jsx` | Extension pattern | 8–10 |
| **TypeScript** | `tsconfig.json` | Exact file | 20 |
| | `typescript` in `devDependencies` | Manifest check | 15 |
| | `**/*.ts`, `**/*.tsx` | Extension pattern | 10–12 |
| **Python** | `requirements.txt` | Exact file | 15 |
| | `pyproject.toml` | Exact file | 15 |
| | `Pipfile` | Exact file | 15 |
| | `manage.py`, `setup.py` | Exact file | 15 |
| | `**/*.py` | Extension pattern | 10 |
| **Java** | `pom.xml`, `build.gradle`, `build.gradle.kts` | Exact file | 20 |
| | `mvnw`, `gradlew` | Wrapper script | 15 |
| | `**/*.java` | Extension pattern | 10 |
| **Rust** | `Cargo.toml`, `Cargo.lock` | Exact file | 20–25 |
| **Go** | `go.mod`, `go.sum` | Exact file | 20–25 |
| **PHP** | `composer.json`, `composer.lock` | Exact file | 20–25 |
| **Ruby** | `Gemfile`, `Gemfile.lock` | Exact file | 20–25 |
| **C# / .NET** | `*.csproj`, `*.sln` | Extension pattern | 25 |

---

## 3. Framework Detection Matrix

| Framework | File Signatures | Manifest Dependencies | Content Regex |
|---|---|---|---|
| **React** | `**/*.jsx`, `**/*.tsx` | `react`, `react-dom` | - |
| **Next.js** | `next.config.js`, `next.config.mjs`, `next.config.ts` | `next` | - |
| **Vite** | `vite.config.js`, `vite.config.ts`, `vite.config.mjs` | `vite` | - |
| **Vue.js** | `**/*.vue` | `vue` | - |
| **Svelte** | `svelte.config.js`, `**/*.svelte` | `svelte`, `@sveltejs/kit` | - |
| **Angular** | `angular.json` | `@angular/core` | - |
| **Express** | - | `express` | - |
| **NestJS** | `nest-cli.json` | `@nestjs/core`, `@nestjs/common` | - |
| **Fastify** | - | `fastify` | - |
| **Django** | `manage.py` | - | `django` in `requirements.txt` or `pyproject.toml` |
| **Flask** | - | - | `flask` in `requirements.txt`, or `from flask import` in code |
| **FastAPI** | - | - | `fastapi` in `requirements.txt`, or `from fastapi import` in code |
| **Streamlit** | - | - | `streamlit` in `requirements.txt` |
| **Spring Boot**| - | - | `spring-boot` in `pom.xml` / `build.gradle` |

---

## 4. Package Manager Preference & Lockfiles

| Priority | Lockfile | Preferred Command | Fallback Command |
|---|---|---|---|
| 1 | `package-lock.json` | `npm ci` | `npm install` |
| 2 | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | `pnpm install` |
| 3 | `yarn.lock` | `yarn install --frozen-lockfile` | `yarn install` |
| 4 | `bun.lockb` / `bun.lock` | `bun install --frozen-lockfile` | `bun install` |
| 5 | `poetry.lock` | `poetry install` | `poetry install` |
| 6 | `uv.lock` | `uv sync` | `uv sync` |
| 7 | `Pipfile.lock` | `pipenv install` | `pipenv install` |
| 8 | `requirements.txt` | `python -m pip install -r requirements.txt` | - |
