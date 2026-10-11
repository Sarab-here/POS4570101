# ServeU Agent Guidelines & Development Standards

This document establishes the governing operational instructions, precedence hierarchy, security rules, and workflow expectations for all AI agents and engineers working on the **ServeU** codebase.

---

## 1. Specification Precedence & Reading Order

The authoritative technical and product documentation resides in [`production-plans/`](production-plans/).
When consulting documentation or resolving conflicting requirements, adhere to the following order of precedence:

1. **[ServeU-Master-PRD.md](production-plans/ServeU-Master-PRD.md)** — **Highest Precedence (Primary Source of Truth)**. Consolidates product vision, system boundaries, lifecycle rules, and core principles.
2. **[ServeU-Database-Schema-Specification.md](production-plans/ServeU-Database-Schema-Specification.md)** — PostgreSQL entities, relations, data integrity rules, indexing, transaction boundaries, and Alembic migration blueprints.
3. **[ServeU-API-Contract-Specification.md](production-plans/ServeU-API-Contract-Specification.md)** — REST `/api/v1` routes, schemas, headers, error formats, and WebSocket contracts.
4. **[ServeU-Permission-Matrix-Specification.md](production-plans/ServeU-Permission-Matrix-Specification.md)** — RBAC definitions, tenant/branch scopes, approval chains, and action-level authorization.
5. **[ServeU-Frontend-Responsive-UI-Specification.md](production-plans/ServeU-Frontend-Responsive-UI-Specification.md)** — Design tokens, responsive layouts, POS/KDS interaction models, offline state machines, and component contracts.
6. **[ServeU-Engineering-Epics-Development-Tickets.md](production-plans/ServeU-Engineering-Epics-Development-Tickets.md)** — Engineering backlog (E00–E12), priorities, and ticket acceptance criteria.
7. **[ServeU-Implementation-Roadmap-Development-Task-Breakdown.md](production-plans/ServeU-Implementation-Roadmap-Development-Task-Breakdown.md)** — Phase boundaries, milestone sequencing, and delivery gates.

> **Rule on Conflicts:** If any specification conflicts with another, `ServeU-Master-PRD.md` takes precedence. Conflicts must be formally documented in [`docs/decisions.md`](docs/decisions.md) rather than silently resolved in code.

---

## 2. Mandatory Workflow & Task-Log Rule

1. **One Ticket at a Time:** Work strictly on one ticket from [`ServeU-Engineering-Epics-Development-Tickets.md`](production-plans/ServeU-Engineering-Epics-Development-Tickets.md) at a time.
2. **Plan Before Coding:** Always provide a clear, step-by-step implementation plan and receive alignment before writing or modifying code.
3. **Task-Log Documentation:** After completing each task/ticket, create a dedicated Markdown record in `docs/task-log/` named `SU-XXX-<task-name>.md` and update `docs/task-log/INDEX.md`.
   - Each log must contain:
     - Task reference, title, priority, and epic.
     - Technical summary and architectural decisions.
     - Files added or modified (schema, routes, components).
     - Security and tenant/branch authorization verification.
     - Test execution results for affected areas; mark migration, tenant-isolation, and RBAC milestone gates “not applicable until M1” (not run/not complete) when the ticket cannot affect them.
     - Definition of Done checklist confirmation.

---

## 3. Core Security & Safety Rules

### 3.1 Backend-Only Security Enforcement
- **Never rely on frontend UI hiding or disabling for security.** Hiding buttons, tabs, or navigation items is strictly for user experience.
- Every protected API route and WebSocket subscription must enforce:
  1. Identity token verification.
  2. Active tenant membership check.
  3. Authorized branch assignment check.
  4. Permission key check (`domain.action`).
- Never trust client-supplied `tenant_id` or `branch_id` as proof of authorization. Requests accessing unauthorized resources must return `401`, `403`, or `404` (to prevent leaking resource existence).

### 3.2 Secret & Key Protection
- **Never read, inspect, or print** `.env`, `.env.*`, Firebase service-account JSON keys, JWT private keys, or cloud credentials.
- Ensure all sensitive files are excluded in `.gitignore` immediately upon project setup.
- If configuration values are needed, inspect `.env.example` or schema declarations only.

### 3.3 Dynamic Dependency Verification & Auditing
- **Do not hardcode or guess dependency versions.** Always query the package registries (`npm` / `PyPI`) to identify the latest stable, compatible versions.
- Run security auditing (`npm audit` / `pip audit`) before committing new packages to ensure zero critical vulnerabilities.

### 3.4 Financial & Transactional Integrity
- **No Floating-Point Currency:** All monetary amounts must be stored and computed as integer minor units (`amount_minor BIGINT`, e.g., `125000` PKR) with explicit ISO 4217 currency codes.
- **Idempotency Keys:** Mandatory for all payments, refunds, offline sync operations, and sensitive state changes. Duplicate keys must return the cached response without duplicate side-effects.
- **Single Transactional Event for Stock:** When inventory deductions occur, they must run through a single, atomic domain transaction to prevent partial state corruption.

### 3.5 M1 Verification Gates
The migration, tenant-isolation, and RBAC gates are M1 milestone gates, not universal blockers for individual tickets. For a ticket that cannot affect those systems, record each gate as **“not applicable until M1”** (N/A; not run, not complete), leave its checkbox unchecked, and do not block that ticket from completion. If a ticket changes schema or authorization behavior, run the relevant ticket-level tests before completion.

Before M1 is declared complete (and before the M1 release), run and verify:
1. Database schema migration scripts (up and down testing).
2. Multi-tenant isolation test suite (verifying zero cross-tenant read/write leaks).
3. RBAC permission matrix test suite.

---

## 4. Toolchain & Contribution Conventions

- The root `.nvmrc`, `frontend/package.json` engines/package-manager fields, `.python-version`, and version-controlled lockfiles are the source of truth for runtime and dependency versions. Keep `frontend/package-lock.json` and `uv.lock` in sync with their manifests.
- Use `npm ci --prefix frontend` and `uv sync --frozen` for reproducible installs. Do not replace locked installs with floating `npm install` or `uv sync` in CI.
- Read the required local tool list and exact versions in [`README.md`](README.md). Do not silently install globally missing contributor tools. The backend development group supplies pre-commit, Ruff, mypy, pytest, and pip-audit after the contributor installs the documented runtime/toolchain.
- Run the frontend lint, format, type-check, test, and build commands plus the backend lint, format, type-check, and test commands documented in the README. CI also runs npm and Python dependency audits and Gitleaks.
- Use Conventional Commits in the form `<type>(SU-XXX): <imperative summary>`. Use one ticket per branch/PR and the suggested `feature/SU-XXX-...`, `fix/SU-XXX-...`, `docs/SU-XXX-...`, or `chore/SU-XXX-...` branch prefixes. A platform-managed session branch name takes precedence; do not rename it.
- SU-002 CI must remain service-free: do not add Docker Compose, PostgreSQL, or Firebase Auth Emulator services. SU-003 owns those services, environment configuration, and database migration up/down validation.
