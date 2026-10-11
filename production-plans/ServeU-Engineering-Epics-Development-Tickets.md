# ServeU — Engineering Epics & Development Tickets

**Document version:** 1.0  
**Status:** Draft for engineering planning  
**Basis:** ServeU Master PRD, Implementation Roadmap, and approved [MVP Scope v1.0](../docs/decisions.md#mvp-scope-v10)<br>
**Purpose:** Turn the product plan into implementation-ready epics and tickets without silently treating unresolved scope as approved.

---

## 1. How to use this backlog

- **P0 — Release blocker:** security, data integrity, core order/payment correctness, or required foundation.
- **P1 — MVP core:** required for a usable pilot release.
- **P2 — Conditional:** build only after the linked scope decision is approved.
- **Later:** explicitly outside the initial MVP unless re-approved.
- Tickets are complete only when acceptance criteria and relevant automated tests pass, authorization is enforced server-side, and documentation is updated.
- Estimates are intentionally omitted: the team should size tickets after confirming staffing, repository state, and delivery constraints.

### Scope guardrail

The approved first-pilot boundary is [MVP Scope v1.0](../docs/decisions.md#mvp-scope-v10): authentication/onboarding, tenant/branch/staff and permissions, menu/tables, POS/orders/kitchen, Bill Review, cash and manual payment recording, split/partial payments, receipts, basic dashboard/sales reports, settings, English responsive browser/PWA, and the public pricing website. Inventory/recipes/vendors, custom/scheduled reports, offline business writes, Android/Windows packages, refunds, and online gateways are explicitly deferred. Treat any scope change as a decision requiring approval and a versioned update; unresolved later-release work remains decision-gated.

---

## 2. Epics at a glance

| Epic | Priority | Outcome | Main dependency |
|---|---|---|---|
| E00 — Scope & Delivery Foundation | P0 | Approved MVP boundary, repo standards, CI environments | Product owner decisions |
| E01 — Identity, Tenancy & Authorization | P0 | Secure multi-tenant foundation | E00 |
| E02 — Branch, Staff & Restaurant Setup | P1 | Restaurant can configure a branch and staff | E01 |
| E03 — Menu & Order Management | P1 | Staff can create and track orders | E01–E02 |
| E04 — Kitchen Workflow & Live Updates | P1 | Kitchen receives and updates tickets | E03 |
| E05 — Bill Review, Payments & Receipts | P0 | Accurate bill, payment and closeout | E03 |
| E06 — Core Dashboard & Sales Reports | P1 | Owner/manager can review basic performance | E05 |
| E07 — Audit, Reliability & Security Hardening | P0 | Safe release and traceability | E01–E06 |
| E08 — Offline Cash Queue & Sync | P2 | Controlled offline cash operation | Explicit MVP decision; E03–E05 |
| E09 — Inventory, Recipes & Vendors | P2 | Stock operations and recipe intelligence | Explicit MVP decision; E02–E06 |
| E10 — Custom/Scheduled Reports & Reminders | P2 | Saved reports and scheduled delivery | Explicit MVP decision; E06, worker |
| E11 — Android/Windows Packaging & Hardware | Later/P2 | Installable clients and device integration | Explicit release decision; stable web app |
| E12 — Pilot, Observability & Release | P0 | Measured, recoverable pilot launch | E00–E07; conditional epics as approved |

---

## 3. E00 — Scope & Delivery Foundation

### SU-001 — Approve the MVP scope baseline
**Priority:** P0 · **Type:** Product decision · **Owner:** Product owner

**Description:** Record the first-release feature list and explicitly defer unapproved items.

**Acceptance criteria**
- [x] Each major feature is marked MVP, conditional, or later in `docs/decisions.md`.
- [x] Inventory/recipe/vendor, offline order queue, custom reports/scheduling, and Android/Windows launch have explicit release decisions.
- [x] Tax, service charge, discount, currency, receipt hardware, stock-consumption trigger, and recovery objectives have documented defaults or decision gates.
- [x] MVP Scope v1.0 is referenced by the release plan.

### SU-002 — Establish repository and code-quality conventions
**Priority:** P0 · **Type:** Engineering

**Acceptance criteria**
- [x] Backend and frontend project structure is documented.
- [x] Node and Python runtimes, npm and uv, and project dependencies are pinned; `package-lock.json` and `uv.lock` are committed.
- [x] Frontend npm scripts configure ESLint, Prettier, TypeScript `tsc`, and Vitest; the backend uv project pins Ruff, mypy, and pytest and documents their commands.
- [x] README documents local prerequisites, install/run/test commands, environment variable conventions, and the migration workflow.
- [x] Each app has at least one smoke test; CI runs lint, format, type checks, tests, dependency audits, and full-working-tree plus full-history Gitleaks scans without database or emulator services.
- [x] Secrets and credential files are excluded from source control; pre-commit hooks and GitHub Actions are configured.
- [x] Renovate enforces a 14-day minimum release age for routine updates.
- [x] Conventional Commit and branch conventions are documented in `AGENTS.md` and the README.
- [ ] GitHub Actions completes green on the pinned Node.js `24.21.0` and Python `3.14.7` runtimes before SU-002 is marked Done.

**Verification note:** The implementation and local quality/security checks are verified, but SU-002 remains in progress until a hosted GitHub Actions run is green on the pinned runtimes. Migration, tenant-isolation, and RBAC gates are **not applicable until M1** for this ticket (N/A; not run/not complete, unchecked) and do not block SU-002; see the task log.

### SU-003 — Create CI and environment configuration
**Priority:** P0 · **Type:** DevOps

**Ownership boundary:** SU-003 owns service-backed local and deployment configuration. SU-002's CI remains a service-free quality/security baseline.

**Acceptance criteria**
- [ ] Add a local Docker Compose environment that provides PostgreSQL and the Firebase Auth Emulator; document startup, readiness, and shutdown.
- [ ] Document and validate environment configuration, including safe variable names/placeholders, separate development/staging/production settings, and secret-manager usage. Never commit credentials.
- [ ] Validate database migrations both up and down against PostgreSQL in CI or a controlled release check; this service-backed validation is owned by SU-003, not the SU-002 quality workflow.
- [ ] Pull requests retain the SU-002 lint, format, type-check, test, dependency-audit, and secret-scan baseline; add service-backed checks only with the SU-003 environment.
- [ ] Deployment requires explicit environment configuration; secrets are stored outside the repository.

---

## 4. E01 — Identity, Tenancy & Authorization

### SU-010 — Integrate Firebase Authentication
**Priority:** P0 · **Type:** Backend + frontend

**Acceptance criteria**
- [ ] Sign-in and sign-out use Firebase Authentication.
- [ ] Firebase-managed email verification and password-reset workflows are available for pilot accounts.
- [ ] Backend validates identity tokens and rejects invalid/expired tokens.
- [ ] Firebase identity is mapped to a ServeU user record without treating Firebase claims as the source of business permissions.
- [ ] Authentication errors do not expose secrets or sensitive internals.

### SU-011 — Implement tenant membership and workspace selection
**Priority:** P0 · **Type:** Backend + frontend

**Acceptance criteria**
- [ ] A user can belong to more than one tenant.
- [ ] After login, users with multiple memberships can select a workspace.
- [ ] Every tenant-owned query is scoped server-side to an authorized tenant.
- [ ] The API never trusts a client-supplied `tenant_id` as proof of access.

### SU-012 — Implement branch access enforcement
**Priority:** P0 · **Type:** Backend

**Acceptance criteria**
- [ ] Users can access only branches granted by their membership/role.
- [ ] Unauthorized branch IDs return a safe denial and do not leak whether another tenant's records exist.
- [ ] Branch switching updates the active UI context only after server authorization.
- [ ] Automated tests cover cross-tenant and cross-branch access attempts.

### SU-013 — Implement role and permission checks
**Priority:** P0 · **Type:** Backend

**Acceptance criteria**
- [ ] Owner, Manager, Cashier, Waiter, and Kitchen Staff baseline roles are represented.
- [ ] Custom roles/permissions follow the approved permission matrix if included in MVP.
- [ ] Permission checks are deny-by-default and enforced on every protected endpoint.
- [ ] Sensitive permission changes are audited and take effect on the next authorized request/session revalidation.

### SU-014 — Implement resumable restaurant onboarding
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] First user can create a tenant and becomes its Owner.
- [ ] At least one branch is required to complete onboarding.
- [ ] Incomplete onboarding can be resumed safely.
- [ ] Duplicate submissions do not create duplicate tenants or branches.

---

## 5. E02 — Branch, Staff & Restaurant Setup

### SU-020 — Create and manage branch settings
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized users can create/edit branch name and approved operational settings.
- [ ] Branch-specific records remain isolated.
- [ ] Currency and timezone defaults are explicit and stored consistently.
- [ ] Branch deactivation does not erase historical sales or orders.

### SU-021 — Implement staff records and invitations
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized users can create staff profiles, assign roles/branch access, and invite staff.
- [ ] Staff can be deactivated without deleting historical attribution.
- [ ] Invite/reinvite and invalid/expired invite states are handled.
- [ ] A staff user cannot grant permissions they do not have authority to grant.
- [ ] Invitation delivery channel and lifecycle follow open Gate G-02 in [docs/decisions.md](../docs/decisions.md#open-gates); do not assume Firebase Auth email is the invitation channel.

### SU-022 — Implement tables and service areas
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized users can create, edit, deactivate, and organize tables/service areas.
- [ ] Orders can reference a table or an approved takeaway/other service type.
- [ ] A table's current-order indicator is derived from valid order state, not stale frontend state.

### SU-023 — Implement menu and item management
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized users can manage categories, menu items, prices, and availability.
- [ ] Historical order items retain the name/price snapshot needed to preserve the original bill.
- [ ] Unavailable/deactivated items cannot be newly ordered, but historical orders remain readable.
- [ ] Price changes are audited if required by the permission matrix.

---

## 6. E03 — Menu & Order Management

### SU-030 — Implement order creation and item editing
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized staff can create an order, add/remove items, update quantities, and add permitted notes.
- [ ] Each order has tenant, branch, creator, and waiter attribution where applicable.
- [ ] Order and item totals are calculated server-side using a shared money/rounding policy.
- [ ] Duplicate submit/retry does not create duplicate orders when an idempotency key is supplied.

### SU-031 — Implement order and item state transitions
**Priority:** P1 · **Type:** Backend

**Acceptance criteria**
- [ ] Valid transitions follow the approved order state machine.
- [ ] Invalid transitions are rejected server-side.
- [ ] Item state and order state are stored separately.
- [ ] State changes record actor and timestamp; important transitions are auditable.

### SU-032 — Implement explicit Send to Kitchen action
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Orders are not silently sent to kitchen before the explicit action, unless a later approved workflow says otherwise.
- [ ] Sending creates a kitchen ticket/update with stable identifiers.
- [ ] Additional items create a distinct kitchen update rather than rewriting the original ticket history.
- [ ] Retrying a send request does not create duplicate kitchen tickets.

### SU-033 — Implement item cancellation workflow
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Cancellation requires a configured reason; an optional note can be recorded.
- [ ] Void/cancel authority after Send to Kitchen follows Gate G-01; resolve that gate before implementing the workflow or freezing API permissions.
- [ ] Cancellation before prep updates the bill according to the approved rules.
- [ ] During-prep cancellation does not reduce the bill until kitchen acknowledgement where required.
- [ ] After-prep financial adjustments require the configured manager/owner-authorized approval path.
- [ ] Cancellation and billing adjustment are separately auditable.

---

## 7. E04 — Kitchen Workflow & Live Updates

### SU-040 — Build kitchen ticket queue
**Priority:** P1 · **Type:** Frontend + backend

**Acceptance criteria**
- [ ] Kitchen view shows new, acknowledged, preparing, ready, and completed tickets as allowed by role.
- [ ] Tickets display item, quantity, notes, table/order reference, and elapsed time where available.
- [ ] Queue is branch-scoped and respects staff permissions.
- [ ] Refresh/reconnect restores the current queue from server state.

### SU-041 — Implement kitchen status updates and acknowledgement
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Kitchen staff can make only allowed state transitions.
- [ ] Acknowledgement of cancellation/update is linked to the correct kitchen update.
- [ ] Kitchen status changes are persisted before success is shown.
- [ ] Duplicate or stale updates are handled without corrupting the ticket state.

### SU-042 — Add WebSocket event delivery
**Priority:** P1 · **Type:** Backend

**Acceptance criteria**
- [ ] Authenticated clients receive authorized branch events only.
- [ ] WebSocket connections enforce the same tenant/branch access rules as REST.
- [ ] Events carry stable entity IDs and version/timestamp information.
- [ ] REST remains authoritative; clients refetch state after reconnect or detected event gaps.

---

## 8. E05 — Bill Review, Payments & Receipts

### SU-050 — Implement mandatory bill review
**Priority:** P0 · **Type:** Full stack

**Acceptance criteria**
- [ ] Before payment, the user sees items, quantities, prices, subtotal, applicable tax/service/discounts, and final payable.
- [ ] Edit Order returns to the order-editing workflow and requires bill review again.
- [ ] Server recalculates the final bill at payment time to prevent stale-client totals.
- [ ] The rounding and discount/tax order of operations is documented and tested.

### SU-051 — Implement cash payment and change calculation
**Priority:** P0 · **Type:** Full stack

**Acceptance criteria**
- [ ] Cashier enters amount received; system calculates change due.
- [ ] Payment cannot be confirmed with invalid or insufficient received amount unless an approved partial-payment flow applies.
- [ ] Repeated confirmation cannot record the same payment twice.
- [ ] Cash payment records actor, amount, method, timestamp, and order reference.

### SU-052 — Implement manual/card payment records
**Priority:** P1 · **Type:** Backend + frontend

**Acceptance criteria**
- [ ] Cash, card-recorded-as-manual, and configurable manual/other methods follow approved MVP scope.
- [ ] Manual entry is not represented as a verified gateway transaction.
- [ ] Failed or cancelled payment attempts do not mark the order paid.
- [ ] Online gateway integration remains out of scope unless explicitly approved.

### SU-053 — Implement split bill and partial payments
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] If included in approved MVP, bills can be split by items or amounts and paid using mixed methods.
- [ ] Remaining balance is calculated server-side after each payment.
- [ ] An order is not marked fully paid until the remaining balance is zero under the approved rounding rules.
- [ ] Concurrent payment attempts cannot overpay or close the order twice.

### SU-054 — Generate receipt and close order
**Priority:** P0 · **Type:** Full stack

**Acceptance criteria**
- [ ] Successful payment triggers receipt generation and the approved order close sequence.
- [ ] Receipt preserves the final item/price/tax/payment snapshot.
- [ ] Print is optional; the workflow supports the approved digital/no-receipt options.
- [ ] A receipt-generation failure can be retried without duplicating the payment.

### SU-055 — Implement refund workflow
**Priority:** P2 · **Type:** Backend + frontend · **Decision-gated**

**Acceptance criteria**
- [ ] Full/partial refund permission, required reason, original payment reference, and audit behavior are specified.
- [ ] Refund is distinct from order/item cancellation.
- [ ] Manual refund records do not falsely imply a payment gateway performed the refund.
- [ ] Implement only after refund scope and operational policy are approved.

---

## 9. E06 — Core Dashboard & Sales Reports

### SU-060 — Implement basic sales dashboard
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Authorized owner/manager sees approved core metrics for the selected branch/date range.
- [ ] Metrics use the same report definitions as underlying sales reports.
- [ ] Tenant/branch scoping is tested.
- [ ] Empty states and timezone/date-boundary behavior are handled.

### SU-061 — Implement predefined sales reports
**Priority:** P1 · **Type:** Full stack

**Acceptance criteria**
- [ ] Approved baseline reports include sales totals and order counts with date and branch filters.
- [ ] Payment method breakdown is included if confirmed in MVP.
- [ ] Refunds/cancellations are represented consistently and not double-counted.
- [ ] Report queries are tested against known sample data and financial totals.

### SU-062 — Implement waiter/staff performance reports
**Priority:** P2 · **Type:** Full stack · **Decision-gated**

**Acceptance criteria**
- [ ] Product owner confirms MVP status and ranking rules.
- [ ] Metrics use historical order attribution rather than the staff member currently assigned to an account.
- [ ] Date and branch filters are applied consistently.
- [ ] Cancellations and reassignment rules are documented to prevent misleading rankings.

---

## 10. E07 — Audit, Reliability & Security Hardening

### SU-070 — Implement audit log for sensitive actions
**Priority:** P0 · **Type:** Backend

**Acceptance criteria**
- [ ] Role/permission changes, financial adjustments, cancellations, refunds, and sensitive settings changes are recorded as applicable.
- [ ] Audit entries include actor, tenant/branch scope, action, target, timestamp, and relevant before/after values without storing secrets.
- [ ] Normal users cannot alter or delete audit records.
- [ ] Audit reads are permission-controlled.

### SU-071 — Add API validation and consistent error handling
**Priority:** P0 · **Type:** Backend

**Acceptance criteria**
- [ ] Request payloads and query parameters are schema-validated.
- [ ] API errors use a documented stable response shape.
- [ ] Internal exceptions and sensitive data are not returned to clients.
- [ ] Validation, authentication, authorization, conflict, and not-found responses have tests.

### SU-072 — Add database constraints and migration safety
**Priority:** P0 · **Type:** Backend/DB

**Acceptance criteria**
- [ ] Foreign keys, unique constraints, and check constraints protect key invariants.
- [ ] Tenant/branch scoping columns and indexes match access patterns.
- [ ] Migrations are reviewed, tested on representative data, and have a documented recovery approach.
- [ ] Financial records are not hard-deleted where history must be preserved.

### SU-073 — Add backup and restore runbook
**Priority:** P0 · **Type:** DevOps

**Acceptance criteria**
- [ ] Backup schedule and retention are documented for the selected database provider.
- [ ] Restore is tested in a non-production environment.
- [ ] Verify the provisionally approved RPO ≤ 24 h / RTO < 4 h targets against provider capability, pass a successful restore test, and revise/escalate before go-live if the provider cannot meet them.
- [ ] Restore verification includes tenant, order, payment, and audit consistency checks.

### SU-074 — Add observability and operational alerts
**Priority:** P1 · **Type:** DevOps

**Acceptance criteria**
- [ ] Structured logs include request/correlation IDs but exclude credentials and sensitive payment data.
- [ ] Errors, latency, failed jobs, database health, and sync failures (if enabled) can be monitored.
- [ ] Alerts have a documented owner and response procedure.
- [ ] A health endpoint does not expose secrets or internal configuration.

---

## 11. E08 — Offline Cash Queue & Sync (Decision-Gated)

**Status:** Deferred from MVP Scope v1.0. The pilot allows read-only cached menu viewing but no offline business writes; order/payment actions are blocked offline. A future cash queue may be considered after the core loop is stable and requires separate approval.

### SU-080 — Define offline operation and dependency model
**Priority:** P2 · **Type:** Architecture

**Acceptance criteria**
- [ ] Supported offline actions and explicitly unsupported actions are listed.
- [ ] Every queued operation has a stable operation ID, device/user/branch/entity references, timestamp, and sync state.
- [ ] Dependency order is preserved (for example, create order before adding items and sending kitchen ticket).
- [ ] Offline payment policy explicitly allows cash only; card/online payments are never falsely marked successful.

### SU-081 — Persist offline operations locally
**Priority:** P2 · **Type:** Frontend

**Acceptance criteria**
- [ ] IndexedDB/Dexie stores queued operations durably across app restart.
- [ ] User can see pending, syncing, synced, and failed states.
- [ ] Local data is scoped to the signed-in user/tenant/branch and is cleared or protected on sign-out according to approved policy.
- [ ] Storage quota/error cases are handled visibly.

### SU-082 — Implement idempotent sync and conflict handling
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Server validates identity, tenant, branch, permissions, and operation idempotency before applying changes.
- [ ] Server acknowledgement is required before an operation is marked synced.
- [ ] Financial and state conflicts never use blind last-write-wins.
- [ ] Retry behavior is bounded/observable and can resume after restart.

### SU-083 — Specify counter-to-kitchen local network behavior
**Priority:** Later · **Type:** Architecture decision

**Acceptance criteria**
- [ ] A local coordinator/LAN strategy is selected before implementation.
- [ ] Supported topology, security boundary, discovery, reconnect, and failure behavior are documented.
- [ ] The product does not promise counter-to-kitchen operation during internet loss unless the chosen design and tests demonstrate it.

---

## 12. E09 — Inventory, Recipes & Vendors (Decision-Gated)

**Status:** P2 until scope is approved. Do not let this delay core POS correctness unless it is confirmed as a pilot requirement.

### SU-090 — Implement inventory item, unit and batch model
**Priority:** P2 · **Type:** Backend + frontend

**Acceptance criteria**
- [ ] Branch-specific stock, supported units, conversion rules, optional batches/lots, expiry, supplier, and reorder thresholds are defined.
- [ ] Each stock change is a movement with type, quantity, actor, timestamp, branch, and reason where required.
- [ ] Historical movements are immutable or corrected by compensating movements.
- [ ] Unit conversion and negative-stock policy are explicit and tested.

### SU-091 — Implement stock receiving, count, waste and transfer
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Purchase/receiving, physical count, waste, adjustment, and branch transfer workflows are distinct movement types.
- [ ] Transfers create linked transfer-out and transfer-in records.
- [ ] Expiry/batch adjustments preserve traceability.
- [ ] Permission and audit rules are enforced server-side.

### SU-092 — Implement recipe costing and sales-linked consumption
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Recipes link menu items to ingredients and quantities with unit conversion.
- [ ] Recipe cost, selling price, gross profit, and margin use documented formulas.
- [ ] Product owner selects the exact order/payment event that triggers consumption.
- [ ] Consumption is idempotent and can be reversed/corrected through an auditable movement, not silent deletion.

### SU-093 — Implement stock and expiry alerts
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Low/out-of-stock, near-expiry, and expired states use configurable thresholds.
- [ ] Dashboard and reports are branch-scoped.
- [ ] Alert thresholds and timezone/date handling are tested.

### SU-094 — Implement inventory scan adapter
**Priority:** P2 · **Type:** Platform integration

**Acceptance criteria**
- [ ] Target hardware and supported barcode formats are approved.
- [ ] Scanner input maps to a known item or presents a safe not-found flow.
- [ ] Scan can launch approved stock/count/receive workflows without bypassing validation or permissions.
- [ ] Camera scanning and external scanners are treated as separate supported adapters where necessary.

### SU-095 — Implement vendor contacts and follow-up reminders
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Vendor contact details, supplied items, notes, and follow-up date are stored with access controls.
- [ ] Reminders appear in-app or through the approved MVP channel.
- [ ] Storing a phone number does not imply SMS/WhatsApp messages are sent.
- [ ] External messaging integrations remain out of scope unless separately approved.

### SU-096 — Implement theoretical-vs-actual consumption variance
**Priority:** Later/P2 · **Type:** Reporting

**Acceptance criteria**
- [ ] Requires approved inventory and recipe scope plus reliable sales-consumption linkage.
- [ ] Report compares theoretical recipe consumption to actual stock movements for the same branch and period.
- [ ] Variance units, cost impact, and known limitations are explained.

---

## 13. E10 — Custom/Scheduled Reports & Reminders (Decision-Gated)

### SU-100 — Build shared report engine
**Priority:** P2 · **Type:** Backend

**Acceptance criteria**
- [ ] Dashboard, predefined reports, exports, and scheduled reports use shared metric definitions where feasible.
- [ ] All report execution enforces tenant/branch authorization.
- [ ] Date boundaries and timezone behavior are consistent.
- [ ] Heavy reports do not block core order/payment requests.

### SU-101 — Build custom report definition and execution
**Priority:** P2 · **Type:** Full stack

**Acceptance criteria**
- [ ] Product owner confirms builder scope and permitted data sources.
- [ ] Saved definitions specify data source, columns, filters, grouping, sorting, and totals.
- [ ] Invalid or unauthorized fields are rejected server-side.
- [ ] Report definitions are versioned or safely handled when fields change.

### SU-102 — Implement CSV/PDF/Excel exports
**Priority:** P2 · **Type:** Backend + frontend

**Acceptance criteria**
- [ ] Required formats and library choices are confirmed.
- [ ] Export totals match the on-screen report for the same filters.
- [ ] Large exports run asynchronously where needed and have expiration/access controls.
- [ ] Generated files are tenant-scoped and are not exposed through guessable public URLs.

### SU-103 — Implement scheduled reports and background worker
**Priority:** P2 · **Type:** Backend/DevOps

**Acceptance criteria**
- [ ] Schedules define report, timezone, cadence, recipients/access, and output format.
- [ ] Each scheduled execution has an idempotent run key and visible success/failure state.
- [ ] Retries are bounded and failures are observable.
- [ ] Core POS/kitchen flows do not depend on the worker being available.

### SU-104 — AI report assistant
**Priority:** Later · **Type:** Product/AI

**Acceptance criteria**
- [ ] Not part of MVP by default.
- [ ] Any future assistant calls the approved Report Engine rather than querying the database directly.
- [ ] Access controls, supported questions, cost controls, data privacy, and answer validation are specified before implementation.

---

## 14. E11 — Android/Windows Packaging & Hardware

### SU-110 — Decide first-release client platforms
**Priority:** P0 decision · **Type:** Product

**Acceptance criteria**
- [ ] First release explicitly lists browser/PWA, Android APK, and/or Windows EXE.
- [ ] Supported OS/device versions and update/distribution approach are defined.
- [ ] Platform-specific hardware requirements are recorded.

### SU-111 — Define printer integration adapter
**Priority:** P2 · **Type:** Platform integration

**Acceptance criteria**
- [ ] Printer models/protocols, receipt/kitchen ticket formats, paper width, and connection types are confirmed.
- [ ] Print failure does not duplicate an order/payment.
- [ ] Reprint permissions and audit expectations are defined.
- [ ] Browser, Android, and Windows printing limitations are tested on target devices.

### SU-112 — Package Android client with Capacitor
**Priority:** Later/P2 · **Type:** Platform

**Acceptance criteria**
- [ ] Only scheduled after Android is approved for the release.
- [ ] Login/session, network transitions, app lifecycle, local storage, scanner, and printer adapters are tested on target devices.
- [ ] Signing and distribution process is documented.

### SU-113 — Package Windows client with Tauri
**Priority:** Later/P2 · **Type:** Platform

**Acceptance criteria**
- [ ] Only scheduled after Windows is approved for the release.
- [ ] Installer/update, app permissions, local storage, printer/scanner adapters, and recovery are tested.
- [ ] Signing and distribution process is documented.

---

## 15. E12 — Pilot, Observability & Release

### SU-120 — Build end-to-end critical path tests
**Priority:** P0 · **Type:** QA

**Acceptance criteria**
- [ ] Create order → send kitchen → prepare/ready → bill review → cash payment → receipt → close is covered.
- [ ] Cancellation before prep and the approved during/after-prep paths are covered.
- [ ] Cross-tenant/branch access attempts are covered.
- [ ] Payment retry/duplicate submit and concurrent update cases are covered.

### SU-121 — Perform security and permission regression
**Priority:** P0 · **Type:** QA/Security

**Acceptance criteria**
- [ ] Every role is tested against the permission matrix for core workflows.
- [ ] API calls are tested independently of frontend visibility.
- [ ] Tenant/branch ID tampering is tested.
- [ ] Sensitive logs and errors are reviewed for data leakage.

### SU-122 — Prepare pilot checklist and feedback process
**Priority:** P1 · **Type:** Product/QA

**Acceptance criteria**
- [ ] Pilot site, staff roles, supported devices, training, and rollback contact are recorded.
- [ ] Known limitations and deferred features are shared with pilot users.
- [ ] Feedback is captured with severity, reproduction steps, and expected behavior.
- [ ] Pilot exit criteria and go/no-go owner are named.

### SU-123 — Release readiness review
**Priority:** P0 · **Type:** Release management

**Acceptance criteria**
- [ ] All P0 tickets are complete or have an explicit signed-off exception.
- [ ] Database backup/restore test has passed.
- [ ] Monitoring, incident owner, rollback procedure, and support workflow are ready.
- [ ] No unresolved critical security or financial correctness defect remains.

---

## 16. Suggested first sprint order

1. SU-001 — Approve MVP scope baseline.
2. SU-002 — Repository and code-quality conventions.
3. SU-003 — CI and environment configuration.
4. SU-010 — Firebase Authentication integration.
5. SU-011 — Tenant membership and workspace selection.
6. SU-012 — Branch access enforcement.
7. SU-013 — Role and permission checks.
8. SU-072 — Database constraints and migration safety (start alongside E01).

**Sprint planning note:** Do not begin all feature epics in parallel. Tenant isolation, permission checks, money handling, and order-state rules are foundational; a frontend screen is not complete until its API and authorization behavior are implemented and tested.

---

## 17. Open product-owner and operational gates

The first-pilot boundary is approved in [MVP Scope v1.0](../docs/decisions.md#mvp-scope-v10). Every remaining gate has an accountable role-owner and trigger in [docs/decisions.md](../docs/decisions.md#open-gates). Resolve gates before their dependent ticket or release trigger:

- G-01 — post-Send-to-Kitchen void/cancel authority: before SU-033.
- G-02 — staff invitation delivery: before SU-021.
- G-03 — provider capability, backup retention and alert ownership: validate provisional RPO ≤ 24 h / RTO < 4 h targets and restore test before go-live.
- G-04/G-05 — tax/service rules and discount caps: before implementing/enabling those rules.
- G-06 — stock-consumption/negative-stock policy: before E09/SU-092.
- G-07 — hardware selection: before hardware-specific commitment/SU-111.
- G-08 — future offline writes/LAN: before E08/SU-080.
- G-09 — refund policy: before SU-055.
- G-10 — browser/OS and performance targets: before M7 QA planning.
- G-11 — production alert response owner: before pilot monitoring is enabled.

---

## 18. Definition of Done — applies to every ticket

- [ ] Acceptance criteria are met and demonstrated.
- [ ] Unit/integration/e2e tests appropriate to the change pass.
- [ ] Server-side authorization and tenant/branch isolation are verified.
- [ ] Loading, empty, error, retry, and permission-denied states are handled where relevant.
- [ ] Logs avoid passwords, tokens, secrets, and unnecessary sensitive data.
- [ ] API/schema/user-facing documentation is updated.
- [ ] Database migrations and rollback/recovery notes are reviewed if applicable.
- [ ] Product owner or designated reviewer accepts the behavior against the approved scope.

---

## 19. Reference documents

- `ServeU-Master-PRD.md`
- `ServeU-Implementation-Roadmap-Development-Task-Breakdown.md`
- `docs/decisions.md` — approved MVP scope and remaining release gates
- `ServeU-Database-Schema-Specification.md`
- `ServeU-API-Contract-Specification.md`
- `ServeU-Permission-Matrix-Specification.md`
- `ServeU-Order-Kitchen-POS-State-Machine-Specification.md`
- `ServeU-Frontend-Responsive-UI-Specification.md`
- `ServeU-Inventory-Recipe-Vendor-Operations-Specification.md`
- `ServeU-Reports-Analytics-Scheduling-Specification.md`
- `ServeU-Offline-Sync-Realtime-Connectivity-Specification.md`
- `ServeU-Testing-Deployment-Monitoring-Recovery-Specification.md`
