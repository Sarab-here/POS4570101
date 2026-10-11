# SU-002 — Establish repository and code-quality conventions

**Ticket:** SU-002 · **Priority:** P0 · **Epic:** E00 — Scope & Delivery Foundation<br>
**Status:** Done — hosted GitHub Actions run `38149625549` passed on commit `6f665213d3baae2eb39dc0195e7eb20d1ce6da88`, including the Python `3.14.7` assertion, parsed uv-version assertion, backend checks, frontend quality/audit, and Gitleaks. Migration, tenant-isolation, and RBAC gates remain **not applicable until M1** (N/A; not run/not complete) and did not block SU-002.

## Summary and decisions

- Added the `frontend/` React/Vite shell and `backend/` FastAPI shell. The frontend renders no product UI. The FastAPI instance disables OpenAPI/Swagger/ReDoc and has no routes. No product endpoints, models, authentication, or screens were added.
- Pinned Node.js `24.21.0` (the current Active LTS on 2026-10-11) in the root `.nvmrc`, `frontend/package.json` engines, lockfile metadata, and CI verification; pinned npm `12.1.0` in `packageManager`, engines, and CI. Pinned Python `3.14.7` in `.python-version` and declared `requires-python = ">=3.14,<3.15"` to match the CI runtime; uv is `0.12.19`.
- Added `frontend/package-lock.json` and `uv.lock` for version control. CI uses `npm ci` and `uv sync --frozen`. Frontend dependencies are exact pins; `.npmrc` enforces strict engines, exact saves, and a 14-day minimum release age. Renovate applies a 14-day minimum release age to routine updates.
- Configured frontend ESLint, Prettier, TypeScript `tsc`, and Vitest; configured backend Ruff, mypy, pytest, pip-audit, and pre-commit. Added one non-vacuous smoke test per app.
- Added a service-free GitHub Actions quality/security workflow for lint, format, type check, tests, build, npm/pip audits, and Gitleaks. The pinned Gitleaks CLI runs separate full working-tree and full-history scans after a full-depth checkout. No Compose, PostgreSQL, or Firebase emulator service is present in SU-002 CI.
- Updated the README with exact local prerequisites, install/run/check commands, environment conventions, and the migration workflow. Updated `AGENTS.md` with tool, commit, and branch conventions. Updated SU-003 to own Docker Compose, PostgreSQL, the Firebase Auth Emulator, environment configuration, and migration up/down validation.

## Selected versions and release-age policy

On 2026-10-11, the official [Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json) identifies Node 24 as the current Active LTS; Node 24 is scheduled to enter Maintenance on 2026-10-20 and reach end-of-life on 2028-04-30. Node 22 has been in Maintenance since 2025-10-21, so there is no reason to retain Node 22 for this new toolchain. Selected Node.js `24.21.0`, released 2026-09-08 (official [release](https://github.com/nodejs/node/releases/tag/v24.21.0)), is stable and more than 14 days old. Node 26 is scheduled to enter LTS on 2026-10-28, after the review date.

All other direct project/tool releases below were stable and at least 14 days old on 2026-10-11. Registry timestamps: npm `12.1.0` (2026-09-22), Python `3.14.7` (2026-08-05), and uv `0.12.19` (2026-09-25); the newest other direct dependency release was 2026-09-25, and the newest CI action release was 2026-09-21. The Python and npm lock resolutions were checked against the 2026-09-27 cutoff. One security-driven exception is documented below.

| Area | Selected versions |
|---|---|
| Runtime/package managers | Node.js `24.21.0`; npm `12.1.0`; Python `3.14.7`; uv `0.12.19` |
| Frontend runtime/build | React and React DOM `19.3.0`; Vite `8.3.1`; `@vitejs/plugin-react` `6.1.1` |
| Frontend quality/tests | TypeScript `6.0.3`; ESLint `10.11.0`; `@eslint/js` `10.0.1`; `typescript-eslint` `8.70.1`; `eslint-plugin-react-hooks` `7.1.1`; Prettier `3.9.9`; `eslint-config-prettier` `10.1.8`; Vitest `5.0.2`; jsdom `30.1.1`; React type packages `19.3.0`; globals `17.12.0` |
| Backend/runtime | FastAPI `0.141.1`; Uvicorn `0.54.0` |
| Backend quality/security | Ruff `0.16.9`; mypy `2.3.1`; pytest `9.1.1`; pip-audit `2.10.1`; pre-commit `4.6.2`; pre-commit-hooks `v6.0.0` |
| CI/security actions and scanners | `actions/checkout@v5.1.0`; `actions/setup-node@v7.0.0`; `actions/setup-python@v7.0.0`; `astral-sh/setup-uv@v10.2.0`; Gitleaks CLI `8.30.1` (official archive SHA-256 pinned and verified) |

**Compatibility review:** npm `12.1.0` accepts Node `^24.15.0`; Vite `8.3.1` and its React plugin support Node `>=22.12.0`; ESLint `10.11.0` supports Node `>=24`; Vitest `5.0.2` and jsdom `30.1.1` include Node 24 ranges. The complete frontend install, lint, format, type-check, smoke test, build, and audit all passed under the exact Node `24.21.0`/npm `12.1.0` pair. PyPI metadata for the pinned direct Python tools allows Python 3.14, and `uv.lock` contains CPython 3.14-compatible Linux wheels (including stable `abi3` tags where applicable) for native dependencies such as pydantic-core, mypy, ast-serialize, and librt; hosted Actions run `38149625549` verified the pinned Python runtime successfully.

**Hosted runtime-pin follow-up (2026-10-11):** Initial hosted run `38146663334` failed at `test "$(python --version)" = "Python 3.14.7"`. The [actions/python-versions manifest](https://github.com/actions/python-versions/blob/main/versions-manifest.json) lists stable Python `3.14.7` Linux x64 builds for Ubuntu 22.04 and 24.04, so the fallback pin update was not indicated (the manifest also lists `3.14.8`). Direct access to `python.org` is outside this sandbox's outbound-host allowlist, so its release page could not be checked directly; the official [CPython `v3.14.7` tag](https://github.com/python/cpython/tree/v3.14.7) exists, but is not a substitute for a direct python.org check. Inspection of `astral-sh/setup-uv@v10.2.0` showed it may add user-local and uv-managed Python directories to `PATH` after `setup-python`; the path comparison in runs `38148843640` and `38149035213` reported no interpreter change. Those retries failed at `Verify runtime pins`, but raw logs returned EOF, so their exact outputs were unavailable. Commit `6f665213d3baae2eb39dc0195e7eb20d1ce6da88` changed the step to print detected Python and uv versions, add them and uv token 2 to `$GITHUB_STEP_SUMMARY`, assert Python equals `Python 3.14.7`, and assert token 2 of `uv --version` equals `0.12.19`. Hosted run `38149625549` passed all jobs on that commit, including both runtime assertions and the backend checks. Python pin `3.14.7` remains unchanged.

**Secret-scan coverage:** the Gitleaks Action v3.0.0 implementation scans a change range rather than the full repository history, so CI uses the pinned CLI explicitly. Checkout uses `fetch-depth: 0`; `gitleaks dir .` scans the complete working tree while the config skips `.git`, and `gitleaks git .` uses Gitleaks' default `--full-history --all` Git log scan. The CLI is pinned to `8.30.1` with the official Linux archive SHA-256 checked before extraction. Both CI scans passed in green hosted Actions run `38149625549`.

**Security exception:** the age-constrained npm lock initially selected `source-map-js@1.2.1`, which `npm audit` reported as a high-severity issue (GHSA-68fv-2mgg-jv7q). The patched `source-map-js@1.2.2` was published 2026-09-30, inside the normal 14-day hold. Because it is the available security fix, it was explicitly allowed into `package-lock.json`; the final audit reports zero vulnerabilities. Routine updates remain age-gated.

## Files added or updated

- Added runtime and package configuration: `.nvmrc`, `.python-version`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/.npmrc`, `pyproject.toml`, and `uv.lock`.
- Added frontend scaffold, lint/format/type/test configuration, and smoke test under `frontend/`.
- Added route-free FastAPI scaffold and smoke test under `backend/`.
- Added `.github/workflows/quality.yml`, `.pre-commit-config.yaml`, `gitleaks.toml`, and `renovate.json`.
- Updated `.gitignore`, `AGENTS.md`, `README.md`, this task log and index, and the SU-002/SU-003 ticket text in `production-plans/ServeU-Engineering-Epics-Development-Tickets.md`.

## Verification results

| Check | Result |
|---|---|
| Frontend runtime pins | Pass; Node `v24.21.0` and npm `12.1.0` verified. |
| Python range metadata | `pyproject.toml` and `uv.lock` both declare `>=3.14,<3.15`; locked package versions are unchanged. `uv lock --check` could not be run locally because Python `3.14.7` is unavailable; hosted run `38149625549` passed `uv sync --frozen` on the pinned runtime. |
| `npm ci --prefix frontend` | Pass; installed 212 packages; npm reported zero vulnerabilities after the security fix. |
| Frontend ESLint | Pass. |
| Frontend Prettier check | Pass. |
| Frontend TypeScript `tsc --noEmit` | Pass. |
| Frontend Vitest | Pass; 1 file, 1 test. |
| Frontend production build | Pass; Vite `8.3.1`. |
| `npm audit --prefix frontend --audit-level=high` | Pass; 0 vulnerabilities. |
| Backend Ruff lint and format checks | Pass under sandbox CPython `3.11.2` before the declared range was narrowed, and pass in hosted run `38149625549` on pinned Python `3.14.7`. |
| Backend mypy | Pass under sandbox CPython `3.11.2`; no issues in 3 source files. Hosted run `38149625549` also passed on pinned Python `3.14.7`. |
| Backend pytest | Pass under sandbox CPython `3.11.2`; 1 test. Hosted run `38149625549` also passed on pinned Python `3.14.7`. |
| `pip-audit --local` | Pass in the temporary CPython `3.11.2` project environment after removing its seeded `setuptools==66.1.1` (not in `uv.lock`); no known project dependency vulnerabilities. Hosted pip-audit passed on Python `3.14.7` in run `38149625549`. |
| `pre-commit run --files …` | Pass; YAML/TOML, whitespace, frontend, and backend hooks passed. The staged-content Gitleaks hook ran against a clean index (no staged diff); the separate directory scan below covered the selected working-tree changes. |
| Gitleaks `8.30.1` directory scan | Pass; no leaks found in the curated, non-sensitive added/updated source, configuration, lockfiles, and documentation files (about 290 KB). Credential-file paths and opaque planning attachments remain excluded by policy. |
| Gitleaks `git` CLI smoke test | Pass; a temporary two-commit test repository was scanned and both commits were checked with no findings. |
| Gitleaks CI scan coverage | Pass in hosted run `38149625549`: full-depth checkout, pinned/SHA-256-verified CLI, `gitleaks dir .` for the working tree, and `gitleaks git .` for all refs/history. |
| Hosted GitHub Actions run | Pass: run `38149625549` on commit `6f665213d3baae2eb39dc0195e7eb20d1ce6da88` completed green. Frontend quality/audit, backend runtime pins and checks, and Gitleaks all passed. |
| `git diff --check` | Pass. |

**Sandbox runtime caveat:** the sandbox only provides CPython `3.11.2`; downloading the pinned `3.14.7` standalone interpreter is blocked by the sandbox's outbound-host policy. Backend `uv sync --frozen`, Ruff, mypy, pytest, and pip-audit had passed under CPython `3.11.2` before the approved range was narrowed; that interpreter is now outside `>=3.14,<3.15`, so those results do not verify the current supported runtime. The first sandbox pip-audit run flagged CPython 3.11's seeded `setuptools==66.1.1`, which is not in `uv.lock`; after removing it from the temporary environment, the project-only audit reported no known vulnerabilities. The lock's `requires-python` metadata now matches the manifest and package pins are unchanged; hosted run `38149625549` passed `uv sync --frozen` and all backend checks on Python `3.14.7`. Frontend checks used the exact pinned Node `24.21.0`/npm `12.1.0` versions in a temporary tool directory; no global tools were installed.

## Security, authorization, and Definition of Done

- `.gitignore` excludes environment files, service-account/credential JSON, private-key formats, and secret directories. Gitleaks uses its default rules plus explicit protected-path exclusions; the local scan did not inspect credential files.
- Tenant/branch authorization and RBAC are not implemented or claimed; this ticket adds no protected application routes. The M1 migration up/down, tenant-isolation, and RBAC gates in `AGENTS.md` are each **not applicable until M1** (N/A; not run/not complete), remain unchecked, and do not block SU-002. SU-003 owns the database/migration setup; later identity tickets own authorization.
- [x] SU-002 implementation and local quality/security checks are complete; hosted Actions verification is tracked separately below.
- [x] Required lint, formatting, type-check, tests, dependency audits, and local secret scan executed; results are recorded above.
- [ ] M1 migration up/down gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-002).
- [ ] M1 tenant-isolation gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-002).
- [ ] M1 RBAC gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-002).
- [x] GitHub Actions completed green on pinned Node.js `24.21.0` and Python `3.14.7` — run `38149625549` on commit `6f665213d3baae2eb39dc0195e7eb20d1ce6da88`.
- [x] Mark SU-002 **Done** — hosted Actions verification passed in run `38149625549`.
