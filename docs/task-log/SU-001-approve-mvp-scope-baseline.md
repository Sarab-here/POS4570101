# SU-001 — Approve the MVP scope baseline

- **Priority:** P0
- **Epic:** E00 — Scope & Delivery Foundation
- **Type:** Product decision
- **Status:** Scope baseline approved and recorded; SU-001's decision criteria are complete. RPO/RTO targets are provisional pending provider-capability confirmation and a successful restore test before go-live; migration, tenant-isolation, and RBAC gates are not applicable until M1 (N/A; not run/not complete) and do not block this ticket.
- **Decision record:** [`docs/decisions.md`](../decisions.md#mvp-scope-v10)
- **Approved:** 2026-10-11

## Summary

Approved **MVP Scope v1.0** for the first pilot. The release is a responsive English browser/PWA restaurant workflow with tenant/branch onboarding and authorization, menu/tables, POS/orders/kitchen, Bill Review, cash/manual payment recording, split/partial payments, receipts, basic dashboard/sales reports, settings, and the public pricing website.

The first pilot excludes inventory/recipes/vendors, advanced/custom/scheduled reports, offline business writes, packaged Android/Windows clients, refunds pending a policy, and online payment gateways. Offline behavior is read-only menu caching with a clear offline status; order/payment actions are blocked while offline. Retryable mutations use client-generated UUID/idempotency identifiers from the start, without granting offline-write authority.

## Technical summary and architectural decisions

- Keep the initial client as a responsive browser/PWA; do not package Android/Windows clients in the pilot.
- Treat offline availability as read-only menu access only. Do not queue or persist offline business writes in MVP Scope v1.0.
- Add stable client-generated UUID/idempotency identifiers to retryable mutations from the beginning, while the backend remains authoritative for persisted records, authorization, and financial state.
- Keep the modular-monolith/server-authoritative architecture and tenant/branch enforcement specified by the Master PRD.

## Files added or modified

- Added `docs/decisions.md` with the approved scope, defaults, deferred features, open release gates, and change-control rule.
- Added this task record and `docs/task-log/INDEX.md`.
- Renamed the planning directory to `production-plans/`, corrected documentation links, updated the Master PRD/backlog/canonical roadmap, and removed the duplicate `(1)` roadmap file.
- Added Firebase Authentication email workflows to scope and recorded Gate G-01 (post-kitchen void/cancel authority) and Gate G-02 (staff invitation delivery).
- Added owners/triggers to all open gates and recorded the provisionally approved RPO ≤ 24 h / RTO < 4 h targets, pending provider-capability confirmation and a successful restore test.

## Security and tenant/branch authorization

No application code or authorization behavior was implemented in this product-decision ticket. The approved baseline retains the requirement that tenant and branch scope, permissions, payment state, and idempotency are enforced by the backend; frontend restrictions remain UX only. Runtime tenant-isolation and RBAC behavior require implementation and verification by M1.

## Tests and verification

- Documentation whitespace validation: `git diff --check` — passed for tracked changes; whitespace in newly added Markdown files was checked separately.
- Database migration up/down tests — not run; this documentation-only ticket adds no application or migration implementation.
- Multi-tenant isolation suite — not run; this ticket adds no application behavior or test suite.
- RBAC permission-matrix suite — not run; this ticket adds no authorization behavior or test suite.

For SU-001, all three M1 gates are **not applicable until M1** (N/A; not run/not complete). Their checkboxes remain unchecked and they do not block this ticket; run and pass them before M1 is declared complete.

## Product-decision acceptance criteria

- [x] First-pilot features and explicit deferrals are recorded in MVP Scope v1.0.
- [x] Inventory/recipe/vendor, offline, reporting, refund, and platform decisions are explicit.
- [x] Currency, charge/discount, receipt, stock-consumption, and recovery defaults/gates are documented.
- [x] The release roadmap references the approved scope version.

## Definition of Done checklist

- [x] Scope decision and release boundary are recorded and traceable to the Master PRD.
- [x] Related PRD, backlog, and roadmap documents are updated.
- [x] Task log records scope, files, security implications, and verification status.
- [ ] M1 migration up/down gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-001).
- [ ] M1 tenant-isolation gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-001).
- [ ] M1 RBAC gate — not applicable until M1 (N/A; not run, not complete; not a blocker for SU-001).

## Remaining release gates

See the owner/trigger register in [`docs/decisions.md`](../decisions.md#open-gates). In particular, resolve G-01 before SU-033 and G-02 before SU-021. Confirm the provisionally approved RPO ≤ 24 h / RTO < 4 h targets against provider capability, pass a restore test before go-live, and approve backup retention before backup configuration. Other gated policies remain deferred until their listed triggers.
