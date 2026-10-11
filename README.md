# ServeU

ServeU is a restaurant point-of-sale product in its foundation phase. SU-002 establishes the repository toolchain and quality/security checks; it does not add product endpoints, data models, authentication flows, or screens. The frontend currently mounts a blank React root, and the FastAPI application has no routes (including generated documentation routes).

## Local prerequisites

Install these tools yourself; project setup scripts do not silently install global tools.

| Tool | Required version | Notes |
|---|---:|---|
| Git | Current stable | Required to work with the repository and pre-commit hooks. |
| Node.js | `24.21.0` | Current Active LTS on 2026-10-11; pinned by the root `.nvmrc`. |
| npm | `12.1.0` | Install after Node with `npm install --global npm@12.1.0`. |
| Python | `3.14.7` | Pinned by `.python-version`; install this exact version. |
| uv | `0.12.19` | Install explicitly using the [official uv installation instructions](https://docs.astral.sh/uv/getting-started/installation/). |
| Gitleaks | `8.30.1` | Install explicitly using the [official Gitleaks installation instructions](https://github.com/gitleaks/gitleaks); required by the local pre-commit secret hook. |

`pre-commit`, Ruff, mypy, pytest, and pip-audit are pinned in `uv.lock` and are installed into the project environment by `uv sync --frozen`; they do not need a separate global installation. PostgreSQL, Docker Compose, and the Firebase Auth Emulator are not prerequisites for SU-002. SU-003 owns those local services and their service-backed validation.

Verify the pins before installing project dependencies:

```sh
node --version
npm --version
python --version
uv --version
gitleaks version
```

With a Node version manager such as nvm, `nvm install && nvm use` reads the root `.nvmrc`. Install Python 3.14.7 with your chosen Python manager before syncing (uv can manage it with `uv python install 3.14.7`).

## Install and run

Run commands from the repository root:

```sh
npm ci --prefix frontend
uv sync --frozen
uv run --frozen pre-commit install
```

Run the blank frontend scaffold and backend application in separate terminals:

```sh
npm --prefix frontend run dev
uv run --frozen uvicorn app.main:app --app-dir backend --reload
```

Neither application currently implements product behavior. The frontend renders no screen; the API app deliberately has no product or framework documentation endpoints.

## Quality and security commands

These are the local equivalents of the CI baseline:

```sh
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
npm audit --prefix frontend --audit-level=high

uv run --frozen ruff check backend
uv run --frozen ruff format --check backend
uv run --frozen mypy backend
uv run --frozen pytest
uv run --frozen pip-audit --local

pre-commit run --all-files
```

The frontend and backend each include a smoke test so the test jobs cannot pass with zero collected tests. Gitleaks is run by the pre-commit staged-content hook and by GitHub Actions against both the complete checked-out repository and all Git history/refs (full-depth checkout). The root `gitleaks.toml` uses Gitleaks' default rules, excludes credential paths forbidden by repository policy, and skips `.git` during the working-tree scan because history is scanned separately; do not put real secrets in fixtures, command arguments, logs, or documentation.

`frontend/package-lock.json` and the root `uv.lock` must be included in version control. Use `npm ci` and `uv sync --frozen` for reproducible installs; update lockfiles only with the corresponding package manager. The frontend npm configuration and Renovate both enforce a 14-day minimum release age for routine updates. Review security fixes sooner only when justified and record the reason.

## Repository layout

```text
frontend/       React + Vite application shell, ESLint, Prettier, TypeScript, Vitest
backend/        FastAPI application shell and pytest smoke test
.github/        GitHub Actions quality/security workflow
production-plans/  Approved product and engineering specifications
```

## Configuration and migrations

- Environment variable names should be uppercase `SERVEU_...` identifiers. A future `.env.example` may contain names and safe placeholders only; actual `.env` files, Firebase service-account JSON, signing keys, and cloud credentials must stay outside Git and are excluded by `.gitignore`.
- Keep development, staging, and production values separate. Store deployed secrets in the selected hosting provider's secret manager; never copy them into Markdown, workflow files, tests, or command output.
- SU-002 adds no database, migration tool, database configuration, or emulator. SU-003 owns Docker Compose, PostgreSQL, the Firebase Auth Emulator, environment configuration, and migration validation. When that ticket adds migration tooling, schema changes must use reviewed, versioned, reversible migrations and be tested both up and down against a disposable PostgreSQL instance before merge. SU-002's CI does not start database or emulator services.

## Contribution conventions

- Use Conventional Commits: `<type>(SU-XXX): <imperative summary>`, for example `chore(SU-002): add reproducible quality checks`. Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, and `chore`.
- Use one ticket per branch and pull request. Suggested branch names are `feature/SU-123-short-description`, `fix/SU-123-short-description`, `docs/SU-123-short-description`, or `chore/SU-123-short-description`. A platform-managed session branch name takes precedence; do not rename it.
- Include the ticket ID, behavioral/scope summary, verification commands, and applicable verification gates in the pull request description. Mark M1-only gates not applicable until M1 when the ticket cannot affect them.
- Keep quality/security CI focused on lint, format, type checking, tests, dependency audits, and secret scanning. Service-backed integration environments belong to SU-003, not SU-002.
