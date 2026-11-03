# DevSet CLI — Architecture Documentation

## 1. Architectural Philosophy

DevSet CLI is designed as a **deterministic, rule-based, locally executed project analysis and environment automation tool**.

### Core Tenets
- **Zero AI / Zero External API**: Complete privacy and reliability without cloud dependence, API tokens, or model hallucinations.
- **Strict Separation of Concerns**: Detection, Planning, User Confirmation, and Execution are isolated phases.
- **Security-First Execution**: No arbitrary script execution, no secrets printing, no destructive overwrites.
- **Cross-Platform Parity**: First-class support for Windows (PowerShell/CMD), macOS, and Linux.

---

## 2. System Pipeline

```text
USER CLI INPUT (`devset`, `devset analyze`, `devset setup`)
  │
  ▼
[PROJECT SCANNER]
  ├─ Directory Scanner (discovers nested components, monorepos, services)
  └─ File Scanner (safeguards, ignore lists, symlink limits, binary exclusion)
  │
  ▼
[EVALUATION ENGINE]
  ├─ Language Detector (scoring evidence across files & manifests)
  ├─ Framework Detector (heuristics, signatures, imports, deps)
  ├─ Package Manager Detector (lockfile inspection, conflict detection)
  ├─ Database Detector (ORM schemas, drivers, connection strings)
  ├─ Docker Detector (Dockerfile, compose service parsing)
  └─ Environment Detector (safe .env vs .env.example diffing)
  │
  ▼
[PROJECT ANALYZER]
  └─ Structure Analyzer (fullstack, monorepo, frontend, backend classification)
  │
  ▼
[SETUP PLAN GENERATOR]
  └─ Deterministic step sequencing, runtime requirements, run commands
  │
  ▼
[USER INTERACTION] (Interactive approval prompt unless --yes or --dry-run)
  │
  ▼
[EXECUTION ENGINE]
  ├─ Runtime Validator (checks Node, Python, pip, package managers)
  ├─ NpmInstaller (npm ci / yarn / pnpm / bun with frozen lockfiles)
  ├─ PythonInstaller (creates .venv, installs via isolated virtualenv python)
  ├─ JavaInstaller (Maven / Gradle wrappers)
  └─ Dependency Validator (verifies node_modules, .venv site-packages)
  │
  ▼
[PROCESS RUNNER] (`devset run` / `npm run dev:all`)
  └─ Concurrently runs multiple services with colored prefixes & URL detection
```

---

## 3. Module Breakdown

### 3.1 Scanner (`src/scanner/`)
- `file-scanner.ts`: Recursively crawls directory trees up to a configurable depth (default 6) and file count limit (default 10,000) to protect system memory. Ignores `node_modules`, `.venv`, `.git`, `dist`, `target`, `coverage`, and binaries.
- `directory-scanner.ts`: Distinguishes root projects, monorepo workspaces (`pnpm-workspace.yaml`, `turbo.json`, `lerna.json`), and sub-applications (`frontend/`, `backend/`, `apps/*`, `packages/*`).

### 3.2 Detectors (`src/detectors/`)
- Evaluates files and metadata against `TechnologyDetectionRule` definitions.
- Accumulates evidence points: file existence, file extension density, dependency declarations in manifests, and content signatures.
- Marks technologies as **confirmed** if score >= threshold, or **possible** if above minScoreForPossible.

### 3.3 Core Plan Generator (`src/core/plan-generator.ts`)
Creates a JSON-serializable `SetupPlan` dynamically based on filesystem state:
1. **Runtime Verification**: Checks that required interpreters (Node, Python, Java) exist on the machine.
2. **Environment Setup**: Safely copies `.env.example` to `.env` if missing, preserving existing `.env` files without overwriting.
3. **Virtual Environments**: Reuses existing `.venv` or `venv` environments; only creates a new environment if absent or invalid.
4. **Dependency Installation**: Checks whether declared dependencies are already satisfied using pip dry-run and package metadata; skips installation when up to date.
5. **Validation**: Verifies post-installation file integrity.
If no setup changes are required, PlanGenerator produces an empty step list, allowing the CLI to confirm that the project is already configured.

### 3.4 Dependency Validator (`src/validators/dependency-validator.ts`)
- Discovers existing virtual environments (`.venv`, `venv`) across platforms (`Scripts/python.exe` on Windows, `bin/python` on Linux/macOS).
- Validates requirements against virtual environment packages using pip `--dry-run` and distribution metadata (`importlib.metadata`, `site-packages`).
- Flags package conflicts (`pip check`) and manifests missing dependencies.

### 3.5 Multi-Service Process Manager (`src/runner/process-manager.ts`)
- Spawns child processes using safe argument arrays.
- Employs streaming stdout/stderr with styled prefixes: `[FRONTEND]`, `[BACKEND]`.
- Monitors output streams for URL patterns (`http://localhost:5173`, `http://127.0.0.1:8000`).
- Intercepts `SIGINT` (Ctrl+C) and `SIGTERM` to cleanly terminate the entire process hierarchy.
