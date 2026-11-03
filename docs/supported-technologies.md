# DevSet CLI — Supported Technologies

| Technology | Category | Detection | Automated Installation | Unified Runner |
|---|---|---|---|---|
| **Node.js** | Runtime | Full | Full (npm / yarn / pnpm / bun) | Full |
| **npm** | Package Manager | Full | Full (`npm ci` / `npm install`) | Full |
| **pnpm** | Package Manager | Full | Full (`pnpm install --frozen-lockfile`) | Full |
| **Yarn** | Package Manager | Full | Full (`yarn install --frozen-lockfile`) | Full |
| **Bun** | Package Manager | Full | Full (`bun install --frozen-lockfile`) | Full |
| **Python** | Runtime | Full | Full (isolated `.venv` creation) | Full |
| **pip** | Package Manager | Full | Full (`python -m pip install -r requirements.txt`) | Full |
| **Poetry** | Package Manager | Full | Full (`poetry install`) | Full |
| **uv** | Package Manager | Full | Full (`uv sync`) | Full |
| **Pipenv** | Package Manager | Full | Full (`pipenv install`) | Full |
| **React** | Framework | Full | Managed via Node.js | Full |
| **Next.js** | Framework | Full | Managed via Node.js | Full |
| **Vite** | Framework / Tool | Full | Managed via Node.js | Full |
| **Vue.js** | Framework | Full | Managed via Node.js | Full |
| **Svelte** | Framework | Full | Managed via Node.js | Full |
| **Angular** | Framework | Full | Managed via Node.js | Full |
| **Express** | Framework | Full | Managed via Node.js | Full |
| **NestJS** | Framework | Full | Managed via Node.js | Full |
| **Fastify** | Framework | Full | Managed via Node.js | Full |
| **Django** | Framework | Full | Full (Python virtualenv + runserver) | Full |
| **Flask** | Framework | Full | Full (Python virtualenv) | Full |
| **FastAPI** | Framework | Full | Full (Python virtualenv + uvicorn) | Full |
| **Streamlit** | Framework | Full | Full (Python virtualenv + streamlit run) | Full |
| **Java** | Runtime | Full | Full via wrapper (`mvnw`, `gradlew`) | Diagnostic |
| **Docker / Compose** | Infrastructure | Full | Optional / Manual prompt | Diagnostic |
| **PostgreSQL** | Database | Full | Diagnostic | Diagnostic |
| **MySQL** | Database | Full | Diagnostic | Diagnostic |
| **SQLite** | Database | Full | Diagnostic | Diagnostic |
| **MongoDB** | Database | Full | Diagnostic | Diagnostic |
| **Redis** | Database / Cache| Full | Diagnostic | Diagnostic |
| **Rust** | Ecosystem | Full (Detection-only) | Planned for v1.1 | - |
| **Go** | Ecosystem | Full (Detection-only) | Planned for v1.1 | - |
| **PHP** | Ecosystem | Full (Detection-only) | Planned for v1.2 | - |
| **Ruby** | Ecosystem | Full (Detection-only) | Planned for v1.2 | - |
| **C# / .NET** | Ecosystem | Full (Detection-only) | Planned for v1.2 | - |
| **Flutter / Dart** | Ecosystem | Full (Detection-only) | Planned for v1.3 | - |
