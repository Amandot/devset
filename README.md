# DevSet

> **One Command. Complete Setup.**  
> Universal, deterministic, rule-based project analysis and automated environment setup tool.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-729B1B.svg)](https://vitest.dev/)
[![Zero AI](https://img.shields.io/badge/AI-100%25%20Rule--Based%20%26%20Local-purple.svg)]()

---

## The Problem

Whenever developers clone a full-stack repository or multi-service codebase, they typically spend 30–60 minutes:
1. Figuring out which programming languages and frameworks are present.
2. Locating nested frontend and backend manifests.
3. Choosing between conflicting package managers (npm, yarn, pnpm, bun).
4. Creating and activating Python virtual environments across Windows/macOS/Linux.
5. Identifying missing environment variables.
6. Opening multiple terminals to start each service individually.

**DevSet CLI automates this entire workflow safely, locally, and deterministically.**

```bash
# Clone any repo
git clone https://github.com/example/fullstack-app.git
cd fullstack-app

# Run DevSet
npx devset

# Start all services together
npm run dev:all
```

---

## Key Features

- **100% Rule-Based & Local**: Zero AI, zero external APIs, zero tokens, and zero network calls during project analysis. Works completely offline.
- **Deep Multi-Tier Detection**: Identifies independent components (frontend, backend, admin, microservices) in monolithic and multi-directory repositories.
- **Deterministic Package Management**: Automatically honors lockfiles (`npm ci`, `yarn install --frozen-lockfile`, `pnpm install --frozen-lockfile`, `bun install --frozen-lockfile`) and alerts on conflicting lockfiles.
- **Isolated Python Virtual Environments**: Automatically creates `.venv` on Windows (`.venv\Scripts\python.exe`) and POSIX (`.venv/bin/python`), installing dependencies inside the virtualenv without polluting system Python.
- **Safe Environment Auditing**: Compares `.env.example` against `.env` to highlight missing keys **without ever exposing secret values**.
- **Universal Multi-Service Runner**: `devset run` starts frontend and backend services concurrently with formatted, colored prefix logs (`[FRONTEND]`, `[BACKEND]`), live URL detection, and graceful process tree termination on `Ctrl+C`.
- **Safe Simulation**: Built-in `--dry-run` flag to preview setup steps without making changes.
- **System Doctor**: Built-in `devset doctor` diagnostics for installed runtimes (Node, Python, Java, Docker, Git).

---

## Terminal Experience

```text
╔════════════════════════════════════════════════╗
║                   DEVSET CLI                   ║
║          One Command. Complete Setup.          ║
╚════════════════════════════════════════════════╝

Scanning project...

✓ Node.js detected (language)
✓ TypeScript detected (language)
✓ React detected (framework)
✓ Vite detected (framework)
✓ Python detected (language)
✓ Django detected (framework)
✓ npm detected (package-manager)
✓ pip detected (package-manager)

PROJECT TYPE: FULLSTACK

FRONTEND (frontend)
  Framework: Vite
  Language: TypeScript
  Package Manager: npm

BACKEND (backend)
  Framework: Django
  Language: Python
  Package Manager: pip

ENVIRONMENT
  Example: .env.example
  Status: .env file missing (template available)

SETUP PLAN
  1. Verify Python runtime installation
  2. Verify Node.js runtime installation
  3. Create .env configuration
  4. Create Python virtual environment (.venv) for backend
  5. Install backend dependencies (pip)
  6. Install frontend dependencies (npm)
  7. Validate environment and dependency setup

? Proceed with setup and dependency installation? (Y/n)
```

---

## CLI Commands

| Command | Description |
|---|---|
| `devset` (or `npx devset-cli`) | Scan project, generate plan, and perform automated setup upon approval |
| `devset analyze [dir]` | In-depth scan and tabular report of languages, frameworks, and manifests |
| `devset setup [dir]` | Execute automated dependency setup |
| `devset doctor` | Check health and versions of Node, Python, package managers, and tools |
| `devset run` | Concurrently run all configured development services with unified logs |
| `devset clean` | Safely remove DevSet-generated `.venv` and config files after confirmation |

### Global Options

- `--dry-run`: Simulate analysis and setup plan without modifying files or installing packages.
- `--verbose`: Show real-time subprocess stdout/stderr and debug traces.
- `-y, --yes`: Skip interactive confirmation prompts and accept defaults.
- `--json`: Format command output as raw JSON (supported by `analyze` and `doctor`).
- `-V, --version`: Output installed CLI version.
- `-h, --help`: Display command options and documentation.

---

## Architecture Overview

DevSet follows a strict modular separation:

```text
src/
├── cli/           # Commander CLI, options, banner, subcommands
├── scanner/       # Safe file system crawler and directory classifier
├── detectors/     # Scoring-based rules for languages, frameworks, package managers, databases, Docker, env
├── analyzers/     # Dependency, structure, and project analyzers
├── validators/    # Runtime, dependency, and environment verification
├── installers/    # NpmInstaller, PythonInstaller, JavaInstaller, DockerInstaller
├── core/          # PlanGenerator and ExecutionEngine
├── runner/        # ProcessManager and ServiceRunner
├── utils/         # Cross-platform process execution, logger, and filesystem
└── types/         # TypeScript interfaces and schemas
```

See [docs/architecture.md](docs/architecture.md) for full architecture specifications.

---

## Supported Ecosystems

| Ecosystem | Detected | Automated Setup | Multi-Service Runner |
|---|:---:|:---:|:---:|
| **Node.js** (npm, yarn, pnpm, bun) | Yes | Yes | Yes |
| **Python** (pip, poetry, pipenv, uv) | Yes | Yes | Yes |
| **Java** (Maven / Gradle wrappers) | Yes | Yes | Diagnostics |
| **Docker & Docker Compose** | Yes | Optional | Diagnostics |
| **Databases** (PostgreSQL, MySQL, SQLite, MongoDB, Redis) | Yes | Diagnostics | - |
| **Rust / Go / PHP / Ruby / .NET / Flutter** | Yes | Detection-only (v1.0) | - |

See [docs/supported-technologies.md](docs/supported-technologies.md) for the complete list.

---

## Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/your-username/devset-cli.git
cd devset-cli

# Install development dependencies
npm install

# Build the project using tsup
npm run build

# Run unit and integration tests (Vitest)
npm test

# Link globally for local testing
npm link

# Test CLI
devset --help
devset doctor
```

---

## Publishing to NPM

DevSet CLI is preconfigured for NPM publishing:

```bash
# 1. Login to NPM
npm login

# 2. Run verification (builds & runs tests automatically)
npm run prepublishOnly

# 3. Publish to NPM
npm publish --access public
```

---

## Security

DevSet executes commands with strict argument arrays (`execa(file, args[])`), validates paths against directory traversal, never logs secrets or tokens, and never automatically deletes files. Read our [docs/security.md](docs/security.md) for complete details.

---

## License

MIT © [DevSet Maintainers](LICENSE)
