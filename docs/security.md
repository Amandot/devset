# DevStart CLI — Security & Reliability Guidelines

Security and environment safety are non-negotiable foundations of DevStart CLI.

---

## 1. Zero External API / Zero AI Guarantee

- **No Remote Telemetry or API Calls**: The detection and planning process runs 100% locally.
- **No Cloud Inference**: No dependencies on OpenAI, Anthropic, Gemini, or any LLM provider.
- **Offline Capable**: Analysis works fully disconnected from the internet. Package installation only interacts with official package registries (e.g. npmjs, PyPI) as instructed by lockfiles.

---

## 2. Safe Subprocess Execution

- **Argument Array Execution**: DevStart never passes untrusted shell strings or performs string interpolation into shell commands (`execa(file, args[])`).
- **No Unvetted Script Execution**: DevStart never automatically executes arbitrary preinstall, postinstall, or arbitrary scripts declared in untrusted files during analysis.
- **Cross-Platform Path Resolution**: On Windows, `.cmd` and `.bat` wrappers (such as `npm.cmd` or `mvnw.cmd`) are resolved safely without invoking raw arbitrary command lines.

---

## 3. Secret & Environment Protection

- **No Secret Printing**: DevStart scans `.env` and `.env.example` solely to extract variable keys (`KEY=`). It never prints, logs, or transmits secret values.
- **Non-Destructive Environment Creation**: Existing `.env` files are **never overwritten**.
- **User Consent Required**: If `.env.example` exists and `.env` is absent, `.env` is created only with user confirmation.

---

## 4. File System & Path Traversal Safeguards

- **Symlink Protection**: The file scanner does not blindly follow circular symbolic links.
- **Directory Traversal Defense**: All relative component paths are validated against `projectRoot` using `path.resolve` to prevent directory traversal attacks.
- **Bounded Resource Limits**: Maximum scan depth (default 6 levels) and file count bounds (default 10,000 files) prevent resource exhaustion on large repositories.
- **Non-Destructive Cleanup (`devstart clean`)**: Only targeted, generated files (`devstart.config.json` and `.venv` directories) can be cleaned, and only after explicit interactive user confirmation. Source code and dependencies are never touched.
