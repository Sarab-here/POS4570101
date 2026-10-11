# ServeU Implementation Roadmap & Development Task Breakdown

**Document type:** Engineering execution plan derived from ServeU Master PRD v2.0  
**Version:** 1.0  
**Status:** Proposed plan — sequence is recommended; unresolved product decisions remain gates.  
**Companion document:** `ServeU-Master-PRD.md`

---

## 1. Purpose

Turn the consolidated ServeU PRD and detailed specifications into an implementation sequence with dependencies, milestones, deliverables, and acceptance criteria. This document is a planning baseline, not evidence that any production feature has already been implemented.

## 2. Planning principles

1. Preserve the current prototype; develop the rebuild on a separate repository/branch until acceptance criteria are met.
2. Build a modular monolith, not microservices: React + TypeScript + Vite/PWA; FastAPI + SQLAlchemy 2.x; PostgreSQL + Alembic.
3. Firebase Authentication establishes identity. ServeU backend remains authoritative for tenant membership, branch scope, roles, and permissions.
4. Enforce tenant and branch scope on the server for every protected request; never trust tenant IDs supplied by the client.
5. Keep the core POS and kitchen flow independent of background workers.
6. Treat financial actions, inventory movements, cancellations, refunds, and offline sync as auditable, idempotent operations.
7. Do not silently move later-phase features into MVP. Any scope change must be recorded and approved.
8. Test user-visible workflows and failure cases, not only individual functions.

## 3. Release boundaries

### Approved first-pilot MVP baseline — MVP Scope v1.0

Approved on 2026-10-11. The release boundary is recorded in [`docs/decisions.md`](../docs/decisions.md#mvp-scope-v10).

- Authentication, tenant onboarding, branch setup, staff, roles/permissions, and operational settings.
- Menu/category management, tables/service areas, branch-aware operations, POS/orders, explicit Send to Kitchen, and kitchen display/status workflow.
- Mandatory Bill Review; cash and manually recorded card/other payments; split and partial payments; receipts.
- Basic dashboard and predefined sales reports.
- Responsive English browser application/PWA and public pricing website.
- Baseline server-side tenant/branch authorization, auditability, idempotency, testing, backup/restore planning, monitoring, and release hardening.

Pilot defaults: PKR is the configurable per-tenant default; automatic tax/service charges are off; discounts are permission-controlled. Digital receipts/browser printing may be supported, with no specific printer model promised. Offline behavior is read-only menu cache plus a clear offline banner; order and payment actions are blocked. Retryable mutations use client-generated UUID/idempotency identifiers from the beginning while server records remain authoritative.

### Explicitly deferred from the first pilot

- Inventory, barcode scanning, recipes, automatic ingredient deduction, batch/expiry tracking, and vendor workflows.
- Custom report builder, exports, scheduled reports, and vendor reminders.
- Offline business writes, cash-order queue, and local counter-to-kitchen/LAN coordination.
- Android APK and Windows EXE packaging.
- Refund workflow pending approval of a separate policy.
- Online payment gateways and AI reporting.

Provisional RPO ≤ 24 h and RTO < 4 h are approved as pilot targets; verify provider capability and pass a restore test before go-live. Backup retention remains open. Future scope changes require approval and a versioned update to the decisions record.

## 4. Milestone overview

| Milestone | Focus | Exit condition |
|---|---|---|
| M0 | Scope, repo, environments | Decisions recorded; separate rebuild branch; CI skeleton works |
| M1 | Data model and security foundation | Migrations, tenant/branch isolation, identity mapping and audit tests pass |
| M2 | Menu, tables and staff administration | Authorized users can configure a branch and its operating data |
| M3 | POS, orders and kitchen | Happy path and cancellation/update paths pass end-to-end tests |
| M4 | Billing, payments and receipts | Payment state, split/partial payment and receipt flows pass with idempotency |
| M5 | Reports and operational modules | Only approved inventory/reporting/vendor scope is implemented and tested |
| M6 | Optional offline/sync expansion (post-MVP) | Separately approved; not a gate for the first pilot |
| M7 | Hardening and launch readiness | Security, accessibility, performance, backup restore and deployment gates pass |
| M8 | Controlled rollout | Pilot feedback resolved; release decision and rollback plan approved |

Milestones are dependency-based, not calendar estimates. Estimate effort after scope decisions and a technical spike.

## 5. Detailed work breakdown

### M0 — Scope and project setup

**Tasks**
- [ ] Create a clean rebuild repository or branch; preserve the current prototype unchanged.
- [ ] Record the Master PRD version and link all specification documents in the repository.
- [x] Create and maintain [`docs/decisions.md`](../docs/decisions.md) for scope and operational gates, each with an accountable owner and trigger.
- [ ] Define development, test, staging, and production environment variables and secrets policy.
- [ ] Establish pull-request review, issue labels, coding standards, linting, formatting, and dependency update policy.
- [ ] Add CI skeleton for frontend and backend checks.

**Acceptance criteria**
- Existing prototype remains available for comparison.
- A new developer can follow documented setup instructions.
- CI runs automatically on pull requests and fails on lint/type/test errors.
- Every requirement has an ID or traceable reference to the Master PRD.

### M1 — Backend, database and tenant security foundation

**Tasks**
- [ ] Implement FastAPI application structure using modular domains.
- [ ] Configure SQLAlchemy 2.x, PostgreSQL, psycopg 3, and Alembic migrations.
- [ ] Implement tenant, branch, user-membership, staff-profile, role, permission, and session/revocation records as defined in the database specification.
- [ ] Integrate Firebase token verification on the backend; map identity to ServeU memberships.
- [ ] Implement authorization dependencies for tenant and branch scope, deny-by-default behavior, and consistent error responses.
- [ ] Add audit event model and service for sensitive operations.
- [ ] Add request correlation IDs, structured logs, health/readiness endpoints, and configuration validation.
- [ ] Add database constraints and indexes for tenant/branch scoping and idempotency keys where applicable.

**Acceptance criteria**
- Cross-tenant and unauthorized-branch requests are rejected in automated tests.
- A user with multiple memberships can select only a membership they actually hold.
- Firebase identity alone does not grant a ServeU role.
- Migrations apply to a clean database and can be tested against a representative upgrade path.
- Sensitive changes create auditable events without logging secrets or payment credentials.

### M2 — Tenant onboarding, branches, staff, menu and tables

**Tasks**
- [ ] Build onboarding: create tenant/workspace, create first branch, and resume incomplete onboarding.
- [ ] Build authorized branch switching and workspace selection.
- [ ] Implement staff invitations and role/permission assignment.
- [ ] Implement menu/category/item CRUD, price/availability controls, and image handling.
- [ ] Implement table management and occupancy rules.
- [ ] Implement frontend route guards as UX only, backed by server authorization.
- [ ] Add audit coverage for role changes, staff deactivation, menu changes, and branch configuration.

**Acceptance criteria**
- An owner can finish onboarding and create the first branch.
- Staff cannot access data from an unauthorized branch by changing URLs or request payloads.
- Deactivating a staff record preserves historical attribution.
- Menu and table changes persist on the server and survive a new session/device.

### M3 — POS, order lifecycle and kitchen display

**Tasks**
- [ ] Implement order and order-item domain models with explicit lifecycle transitions.
- [ ] Implement draft/order creation, table or service context, waiter attribution, and item quantity/notes.
- [ ] Implement explicit Send to Kitchen and durable kitchen ticket/update records.
- [ ] Implement kitchen board states: New, Acknowledged, Preparing, Ready, Completed.
- [ ] Implement additions after first ticket as a separate kitchen update.
- [ ] Implement cancellation request, required reason, kitchen acknowledgement, and before/during/after-prep rules.
- [ ] Implement manager approval and escalation to owner/authorized senior user for post-prep financial adjustments.
- [ ] Publish realtime events after successful database commits; make REST state authoritative after reconnect.
- [ ] Add order/kitchen audit history and idempotency protections for retried commands.

**Acceptance criteria**
- Counter can create an order, send it to kitchen, receive state updates, and view current status.
- A repeated request does not create duplicate orders or kitchen tickets.
- Cancellation reason and approval outcome are preserved in history.
- Post-prep price/quantity adjustment cannot bypass required authorization.
- A missed WebSocket event is recovered by refetching authoritative REST state.

### M4 — Bill review, payments and receipts

**Tasks**
- [ ] Implement mandatory Bill Review with item quantities, prices, subtotal, taxes/service, discounts, and final payable.
- [ ] Implement cash, card and configurable manual/other payment recording within approved scope.
- [ ] Implement split by items or amounts and partial payments with remaining balance.
- [ ] Implement cash received/change calculation and cashier confirmation.
- [ ] Implement payment attempt state, failure/retry/change-method handling, and payment idempotency.
- Refunds are deferred from MVP Scope v1.0; schedule this flow only after the policy and approval path are approved (see SU-055).
- [ ] Generate receipt data after confirmed payment; support optional print/digital/share/no-receipt choice as specified.
- [ ] Ensure paid/closed orders are corrected through permitted adjustment/refund paths rather than ordinary editing.

**Acceptance criteria**
- Failed payment never marks an order paid or closed.
- Repeating a payment confirmation cannot double-record a successful payment.
- Partial payments show correct remaining balance; order closes only under the defined fully-paid rule.
- Receipt totals match the authoritative bill calculation.
- Offline mode never falsely reports a card/online payment as successful.

### M5 — Reports and approved operational modules

Implement only after the release decision log identifies which of these are MVP.

**Reporting tasks**
- [ ] Create a shared report/query service used by dashboards, predefined reports, custom reports, and exports.
- [ ] Implement date and branch filters and role/permission-scoped data access.
- [ ] Implement sales, menu/product and staff-attribution reports approved for the release.
- [ ] If approved: custom report builder, saved definitions, CSV/Excel/PDF exports, scheduled reports and job status/retry visibility.

**Inventory/recipe tasks — if approved**
- [ ] Implement stock item, unit/conversion, batch/expiry, supplier/vendor, and branch stock records.
- [ ] Implement immutable stock movements for purchase, consumption, waste, adjustment, count, transfer, return and expiry.
- [ ] Implement physical stock count reconciliation and audit.
- [ ] Implement recipe ingredients, versioned recipe costing, selling price, gross profit and margin.
- [ ] Deduct recipe ingredients on the agreed eligible order event with idempotency.
- [ ] Implement low/out-of-stock, near-expiry/expired, theoretical-vs-actual variance reports.
- [ ] Implement barcode/scanner integration through platform adapters where supported.

**Vendor tasks — if approved**
- [ ] Store vendor contact information, supplies, visits, notes and follow-up dates.
- [ ] Implement in-app reminders first; do not imply a phone number being saved sends a message.

**Acceptance criteria**
- Reports are branch/tenant scoped and their totals reconcile with source transactions.
- Scheduled jobs are idempotent, have visible status, and do not block POS/kitchen flows.
- Inventory movement history explains every stock balance change.
- Recipe consumption cannot be applied twice for the same qualifying order event.
- Gross profit is labelled as gross profit, not full accounting/net profit.

### M6 — Optional offline queue, sync and realtime resilience (post-MVP)

**Scope boundary:** Offline business writes and local LAN counter-to-kitchen operation are out of MVP Scope v1.0 and are not prerequisites for the first pilot. The pilot supports read-only cached menu access with a clear offline indicator and blocks order/payment actions. Revisit a cash queue after the core loop is stable and only following separate scope and architecture approval. Client-generated UUIDs/idempotency keys are day-one design requirements, not permission to write offline.

**Tasks**
- [ ] Implement local operational persistence using IndexedDB/Dexie, not localStorage for the durable queue.
- [ ] Define versioned operation envelopes with operation ID, device/user/tenant/branch/entity, timestamp, status, and dependencies.
- [ ] Persist queued operations across reload/restart and expose pending/syncing/failed/conflict states.
- [ ] On reconnect: authenticate, re-check tenant/branch/permissions, validate, deduplicate, apply in dependency order, acknowledge, then mark synced.
- [ ] Implement safe conflict review for financial/status conflicts; do not use blind last-write-wins for these fields.
- [ ] Restrict offline promises to explicitly supported operations; cash orders may queue only under the approved policy.
- [ ] Prototype and test local counter-to-kitchen coordination separately for the “internet down, LAN available” case.
- [ ] Test reconnects, interrupted sync, duplicate delivery, expired sessions, revoked permissions, and partial failures.

**Acceptance criteria**
- Pending operations survive application restart.
- Replaying the same operation ID does not duplicate a financial or stock effect.
- Unauthorized or stale operations are rejected or placed in a review state, not silently accepted.
- The UI distinguishes local-pending data from server-confirmed data.
- LAN-only kitchen behavior is not declared supported until tested on target devices and network conditions.

### M7 — Quality, security, performance and release hardening

**Tasks**
- [ ] Add unit, integration, API contract, browser E2E, and regression test suites.
- [ ] Test critical role workflows and tenant/branch isolation.
- [ ] Run dependency and secret scanning; validate secure headers, cookie/token handling, rate limits and input validation as appropriate.
- [ ] Test accessibility against WCAG 2.2 AA targets for critical workflows.
- [ ] Establish performance budgets for initial load, POS interactions, kitchen refresh, and report generation; measure on agreed target hardware.
- [ ] Configure backups and conduct a restore test; verify the provisional RPO ≤ 24 h / RTO < 4 h targets against provider capability and approve backup retention before go-live.
- [ ] Configure staging-to-production deployment gates, migration review, rollback/forward-fix procedure, and incident runbook.
- [ ] Verify monitoring and alerts for API errors, database health, job failures, sync failures, and unusual payment errors.
- [ ] If hardware integration is approved for a later release, test printer/camera/barcode adapters on selected target platforms and document limitations.

**Acceptance criteria**
- Critical E2E suite passes in CI and staging.
- Backup restoration has been demonstrated in a non-production environment.
- Rollback and incident instructions are tested and accessible to the responsible team.
- No known critical tenant-isolation or payment-state defect remains open at release approval.
- Performance targets are measured, documented, and approved rather than assumed.

### M8 — Pilot and controlled rollout

**Tasks**
- [ ] Select pilot tenant(s), branches, devices and representative operating conditions.
- [ ] Train owner/manager/cashier/kitchen users and provide support/issue reporting path.
- [ ] Verify opening setup, menu/tables/staff, digital/browser receipts, and end-of-day reconciliation; test a named printer only if hardware is approved.
- [ ] Run real-world network-loss and reconnect drills where offline capability is approved.
- [ ] Review audit records, support tickets, error metrics and user feedback daily during pilot.
- [ ] Define release/no-release decision, rollback trigger, data migration freeze and communications plan.

**Acceptance criteria**
- Pilot checklist is signed off by product and operations owners.
- No unresolved critical data loss, tenant isolation, payment duplication or stock corruption issue remains.
- Known limitations and deferred features are documented for users.
- Release owner explicitly approves wider rollout.

## 6. Cross-cutting definition of done

A feature is not done until all applicable items are met:

- [ ] Requirement and release phase are traceable to the Master PRD.
- [ ] API and database changes have migrations, validation, constraints and appropriate indexes.
- [ ] Tenant, branch, role and permission checks are enforced on the backend.
- [ ] Loading, empty, success, error, offline and conflict states are implemented where relevant.
- [ ] Audit trail and idempotency are added for sensitive/mutation workflows.
- [ ] Unit/integration/E2E tests cover normal, invalid, unauthorized, retry and failure cases.
- [ ] UI meets agreed responsive and accessibility criteria.
- [ ] Logs/metrics and operator-facing failure signals exist for production-critical behavior.
- [ ] Documentation, configuration and rollback implications are updated.
- [ ] Product owner accepts the behavior against stated criteria.

## 7. Recommended ticket structure

Use a parent epic for each milestone and split work into vertical slices. Each ticket should include:

- Requirement ID and release phase.
- User role and scenario.
- UI behavior and API contract.
- Data model/migration impact.
- Authorization and audit requirements.
- Failure/offline/retry behavior.
- Test cases and acceptance criteria.
- Dependencies and feature flag/release notes if applicable.

Avoid tickets such as “build backend” or “finish POS” without a testable outcome.

## 8. Open decision gates

The first-pilot scope choices are approved in [MVP Scope v1.0](../docs/decisions.md#mvp-scope-v10). The complete open-gate register, including accountable owners and triggers, is maintained in [docs/decisions.md](../docs/decisions.md#open-gates). Resolve each gate before its trigger; deferred features remain outside the first-pilot critical path.

- G-01 — post-Send-to-Kitchen void/cancel authority: before SU-033.
- G-02 — staff invitation delivery: before SU-021.
- G-03 — provider capability, backup retention and alert ownership: validate provisional RPO ≤ 24 h / RTO < 4 h targets and restore test before go-live.
- G-04/G-05 — tax/service calculations and discount limits: before enabling them.
- G-06 — inventory consumption/negative-stock policy: before E09/SU-092.
- G-07 — hardware: before hardware-specific commitment/SU-111.
- G-08 — future offline writes/LAN: before E08/SU-080.
- G-09 — refund policy: before SU-055.
- G-10 — supported browser/OS and performance targets: before M7 QA planning.
- G-11 — operational alert response owner: before pilot monitoring is enabled.

## 9. Suggested implementation order at a glance

`Scope & repo → Backend/data/security → Tenant setup → Menu/tables/staff → POS/order/kitchen → Bill/payment/receipt → Approved MVP reports/operations → Release readiness → Pilot`

Optional post-MVP scope (only after separate approval): offline queue/sync and local LAN coordination.

Some frontend work can proceed in parallel against agreed API contracts, but no UI-only permission enforcement should be considered security complete. Inventory deductions must integrate with order lifecycle through a single idempotent domain event/transaction strategy, not through unrelated client-side updates.

## 10. Traceability to source documents

This roadmap is based on the consolidated `ServeU-Master-PRD.md` and its referenced specifications:

- Database Schema Specification
- API Contract Specification
- Permission Matrix Specification
- Order, Kitchen & POS State Machine Specification
- Frontend Responsive UI Specification
- Inventory, Recipe & Vendor Operations Specification
- Reports, Analytics & Scheduling Specification
- Offline Sync, Realtime & Connectivity Specification
- Testing, Deployment, Monitoring & Recovery Specification

If a conflict is discovered during implementation, do not silently resolve it in code. Record the conflict, identify the authoritative requirement, and update the PRD/specification through change control.
