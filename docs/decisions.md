# ServeU Product Decisions

Last updated: 2026-10-11

This file records approved product/release decisions and unresolved gates. Scope changes must be recorded here and reflected in the release plan; do not silently change scope in implementation.

## MVP Scope v1.0

- **Status:** Approved for the first pilot on 2026-10-11
- **Approval:** Project requester
- **Backlog reference:** E00 / SU-001

This is the release boundary for the first pilot. It refines the broader product capabilities in [ServeU-Master-PRD.md](../production-plans/ServeU-Master-PRD.md) without claiming that planned features are already implemented.

### Included in the first pilot

- Authentication, tenant/workspace onboarding, branch setup, staff, roles/permissions, and operational settings.
- Firebase Authentication email verification and password-reset emails are in scope. Staff invitation records/workflow are in scope; the invitation delivery channel and lifecycle are open Gate G-02.
- Menu/category management, tables/service areas, and branch-aware operations.
- Responsive English browser application/PWA; public pricing website.
- POS and orders, explicit Send to Kitchen, kitchen display/status workflow, and waiter attribution.
- Mandatory Bill Review; cash and manually recorded card/other payments; split and partial payments; receipts.
- Basic dashboard and predefined sales reports.
- Baseline server-side tenant/branch authorization, auditability, financial idempotency, testing, backup/restore planning, monitoring, and release hardening.

A manually recorded card payment is not a verified payment-gateway transaction. Online payment gateways are out of scope.

### Explicitly deferred from the first pilot

- Inventory, stock counts/movements, barcode scanning, recipes, automatic ingredient consumption, batches/expiry, and vendor workflows.
- Custom report builder, report exports, scheduled reports, and vendor reminders.
- Offline business writes, including offline order creation, a cash-order queue, and local counter-to-kitchen/LAN coordination.
- Packaged Android and Windows clients.
- Refund workflows, pending approval of a separate refund policy.
- Online payment gateways, AI reporting, and external SMS/WhatsApp/email delivery.

### Offline behavior in the pilot

The product is online-first. The app may cache the menu for **read-only viewing**, must show a clear offline status, and must block order and payment actions while offline. There are no offline business writes in this pilot. Client-generated UUIDs and idempotency keys should be used for retryable mutation/operation identifiers from the beginning, so a future cash-order queue can be added after the core loop is stable. The server remains authoritative for persisted business and financial records. Any future offline queue or LAN workflow requires a separate scope and technical approval.

### Financial, receipt, inventory, and recovery defaults

- **Currency:** PKR is the pilot default; currency remains configurable per tenant. Store money as integer minor units with an ISO 4217 currency code.
- **Tax/service charges:** No automatic tax or service charge is applied by default in the pilot. Any enabled charge requires an explicitly approved configuration/calculation policy.
- **Discounts:** Discounts are permission-controlled and enforced server-side. Do not add an unapproved hard-coded discount limit; any tenant-specific caps/approval rules must be explicit configuration.
- **Payments:** Cash and manual payment records (including manually recorded card/other methods) are in scope. Split/partial payments are in scope. Payment status is server-authoritative and mutations are idempotent.
- **Refunds:** Deferred from the pilot until the refund policy, permissions, approval path, and operational handling are approved.
- **Receipts:** Digital receipt data and browser printing may be supported. No specific printer model or hardware compatibility is committed for the pilot.
- **Stock-consumption trigger:** Not applicable to this baseline because inventory/recipes are deferred. If that scope is approved later, choose the triggering order/payment event before implementation.
- **Recovery objectives (provisionally approved pilot targets):** RPO ≤ 24 hours and RTO < 4 hours. Confirm these targets against the selected provider capability and a successful restore test before go-live. Backup retention remains open; see Gate G-03.

### Release-plan and change control

The release roadmap must reference **MVP Scope v1.0**. A scope change requires an explicit approval, a new scope version, and corresponding updates to the roadmap/backlog. Features deferred above remain deferred unless that change is recorded.

### Documentation conflict resolved by this baseline

The Master PRD describes refunds as a product capability, while the roadmap previously listed refunds in M4 and backlog ticket SU-055 marked them decision-gated. For the first pilot, this baseline resolves the release assignment: **refunds are deferred** pending an approved refund policy. This does not remove refunds from the longer-term product direction.

## Open gates

These gates do not change MVP Scope v1.0. Resolve each gate by its trigger before implementing the dependent workflow or making the associated pilot commitment. Owners are accountable roles; consulted roles provide implementation/operational input.

### G-01 — Void/cancel authority after Send to Kitchen

- **Open decision:** Who may initiate, approve, or reject a void/cancellation after an order or item has been sent to the kitchen; whether kitchen acknowledgement is required; and whether voiding a whole order differs from cancelling an item.
- **Current boundary:** Do not infer additional post-send authority. Keep cancellation reasons, valid state transitions, and audit requirements; backend authorization remains mandatory.
- **Owner:** Product owner.
- **Consulted:** Restaurant operations lead and engineering/security lead.
- **Trigger:** Before SU-033 implementation begins and before the cancellation API/state machine permissions are frozen.

### G-02 — Staff invitation delivery

- **Open decision:** Select the staff-invitation delivery channel and lifecycle (delivery provider/path, sender identity, expiry, resend, and revocation behavior). This is separate from Firebase Authentication verification/password-reset emails, which are in scope.
- **Owner:** Product owner.
- **Consulted:** Engineering/identity owner and operations lead.
- **Trigger:** Before SU-021 invitation delivery is implemented or the invitation API contract is frozen.

### G-03 — Recovery objectives and backup retention

- **Provisional targets approved:** RPO ≤ 24 hours and RTO < 4 hours. Backup retention remains to be specified.
- **Open decision:** Verify that the selected provider can meet these targets and choose backup retention.
- **Owner:** Project requester/product owner (oversight); operations/infrastructure lead (implementation).
- **Trigger:** Before go-live approval. Confirm provider capability and complete a successful restore test; set backup retention before configuring backups.

### G-04 — Tax and service-charge calculations

- **Open decision:** Define charge rules, calculation/rounding behavior, and applicable configuration before any automatic tax/service charge is enabled. These charges are off by default in the pilot.
- **Owner:** Product owner/finance approver.
- **Consulted:** Engineering lead.
- **Trigger:** Before implementing or enabling automatic tax/service calculations.

### G-05 — Discount limits and approval rules

- **Open decision:** Define any tenant-specific discount caps or additional approval thresholds. Discounts remain permission-controlled; no unapproved hard-coded limit may be introduced.
- **Owner:** Product owner/finance approver.
- **Consulted:** Engineering/security lead.
- **Trigger:** Before implementing/configuring caps or additional discount-approval logic.

### G-06 — Inventory consumption and stock policy

- **Open decision:** If inventory/recipes are later approved, choose the order/payment event that triggers consumption, negative-stock behavior, and the correction/reversal policy.
- **Owner:** Product owner.
- **Consulted:** Restaurant operations lead and engineering/domain lead.
- **Trigger:** Before E09/SU-092 is scheduled for implementation.

### G-07 — Receipt and scanner hardware

- **Open decision:** Select printer/scanner models and supported connection types only if device-specific support is required; no model is promised in MVP Scope v1.0.
- **Owner:** Product owner.
- **Consulted:** Restaurant operations/IT lead and platform engineering lead.
- **Trigger:** Before committing a hardware-specific acceptance criterion or scheduling SU-111.

### G-08 — Future offline writes and LAN coordination

- **Open decision:** Any cash-order queue or counter-to-kitchen LAN operation needs a separate scope, architecture, security boundary, and device/network test plan.
- **Current boundary:** No offline business writes in the pilot; menu cache is read-only and order/payment actions are blocked offline.
- **Owner:** Product owner.
- **Consulted:** Engineering architecture lead and restaurant operations lead.
- **Trigger:** Before E08/SU-080 or any offline-write/LAN implementation is scheduled.

### G-09 — Refund policy and authority

- **Open decision:** Define permitted refund types, reasons, approval authority, and processing/audit behavior. Refunds remain deferred from the pilot.
- **Owner:** Product owner/finance approver.
- **Consulted:** Restaurant operations and engineering/security leads.
- **Trigger:** Before SU-055 is scheduled or refund capability is promised to a pilot user.

### G-10 — Supported browser/OS and performance targets

- **Open decision:** Confirm supported browser/OS versions and measurable performance budgets for the pilot.
- **Owner:** Product owner.
- **Consulted:** Engineering and QA leads.
- **Trigger:** Before the M7 QA/performance plan and target-device testing are finalized.

### G-11 — Operational alert ownership

- **Open decision:** Name the role/team responsible for responding to production alerts and incidents.
- **Owner:** Product owner/operations owner.
- **Consulted:** Infrastructure/engineering lead.
- **Trigger:** Before pilot monitoring and on-call/escalation procedures are enabled.
