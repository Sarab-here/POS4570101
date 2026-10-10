# ServeU Master Product Requirements Document (PRD)

**Document:** ServeU Master PRD  
**Version:** 1.0 Draft  
**Status:** Build-Ready Planning Baseline  
**Product:** ServeU  
**Primary Platform:** Responsive Web / PWA  
**Future Platforms:** Android APK, Windows EXE  
**Database:** PostgreSQL  
**Backend:** FastAPI + Python  
**ORM:** SQLAlchemy 2.x  
**Migrations:** Alembic  
**Authentication:** Firebase Authentication + ServeU backend authorization  
**Realtime:** REST API + WebSocket  
**Offline Storage:** IndexedDB + Dexie  

---

## 1. Document Purpose

This document is the master product and technical source of truth for ServeU.

It consolidates the approved product requirements, restaurant workflows, architecture decisions, security principles, offline strategy, reporting requirements, responsive UI strategy, and future platform direction.

The goal is to build ServeU as a reliable restaurant management platform that can support a single restaurant, multiple branches, online operation, controlled offline operation, live kitchen workflows, billing, inventory intelligence, recipe profitability, staff performance, vendors, reporting, and future Android/Windows clients.

### Core principle

> **Build once, adapt everywhere, and keep the server authoritative whenever connectivity is available.**

---

# 2. Product Vision

ServeU is a restaurant operations platform designed to connect the complete operational flow:

**Restaurant → Branch → Staff → Tables → Orders → Kitchen → Billing → Payments → Inventory → Recipes → Vendors → Reports**

The system should provide a fast and understandable experience for restaurant owners and staff while remaining secure, multi-tenant, branch-aware, offline-capable, and scalable.

---

# 3. Product Goals

## 3.1 Primary Goals

1. Fast restaurant order and checkout workflow.
2. Live kitchen order tracking.
3. Secure multi-tenant architecture.
4. Branch-specific operational data.
5. Controlled offline operation.
6. Reliable POS and payment workflows.
7. Inventory and stock intelligence.
8. Recipe costing and profitability analysis.
9. Staff performance reporting.
10. Custom and scheduled reporting.
11. Responsive UI across desktop, tablet, and mobile.
12. Future Android APK and Windows EXE using the same core application.
13. Strong auditability for sensitive operations.
14. Maintainable architecture that can evolve without unnecessary microservices.

## 3.2 Success Targets

The implementation should target:

- Simple order + payment flow in approximately 60 seconds where operationally realistic.
- Cashier checkout in no more than a few primary actions.
- Online kitchen ticket propagation in approximately 1 second under normal network conditions.
- No cross-tenant data access.
- Offline operational orders must survive device restart and sync safely.
- Core workflows covered by automated tests.

These are engineering targets, not guarantees under arbitrary network/device conditions.

---

# 4. Non-Goals

The following are not core MVP accounting/product responsibilities:

- Full accounting platform.
- Tax filing system.
- Payroll system.
- Delivery marketplace.
- Native iOS application.

Online payment gateways, advanced AI reporting, and some external communication channels are future capabilities unless explicitly promoted into an approved release.

---

# 5. Release Scope

## 5.1 Core MVP

The core product foundation includes:

- Authentication and roles.
- Restaurant/tenant onboarding.
- Branch management.
- Menu management.
- Tables.
- Orders.
- Kitchen/KDS.
- POS and billing.
- Cash and manual payment methods.
- Receipts.
- Basic dashboard and sales reporting.
- Staff management.
- Settings.
- Currency configuration.
- English UI baseline.
- Public pricing website.

The approved later requirements in this document may be implemented in the corresponding release rather than silently being treated as MVP.

## 5.2 v1.1

Target capabilities:

- Customers.
- Notifications/activity.
- Report exports.
- Search and advanced filters.
- Multilingual and RTL support.
- Multi-device sessions.

## 5.3 v1.2

Target capabilities:

- Completion of production cloud sync.
- Expanded offline menu availability.
- Expanded offline order creation and synchronization.
- Production-grade conflict handling.

## 5.4 v2+

Target capabilities:

- Inventory/stock intelligence expansion where not already delivered.
- Online payment gateways.
- Platform administration console.
- Android APK.
- Windows EXE.
- Advanced AI reporting assistant.
- Optional branch-local coordinator/server for larger restaurants.
- Additional external communication integrations.

> Note: Mr. Irfan's operational requirements are part of the Master Product direction. Their exact release assignment must follow the implementation plan rather than being assumed to all be MVP.

---

# 6. Users and Roles

## 6.1 Platform Admin

Controls platform-level administration.

## 6.2 Owner

Controls the restaurant/tenant, branches, staff, operational settings, reports, and sensitive approvals.

## 6.3 Manager

Handles daily operations, approvals, refunds, adjustments, and management workflows according to assigned permissions.

## 6.4 Cashier

Handles POS, billing, payments, receipts, and permitted order operations.

## 6.5 Waiter

Handles tables, orders, waiter attribution, and permitted item/order actions.

## 6.6 Kitchen Staff

Handles kitchen tickets, preparation states, completion, and cancellation acknowledgements.

## 6.7 Custom Roles

The system should support custom roles/permission sets where required.

---

# 7. Identity, Tenant and Branch Model

The following entities must remain conceptually separate:

**User Identity ≠ Staff Record ≠ Restaurant/Tenant ≠ Branch**

A user may have membership in one or more tenants.

A tenant may have one or more branches.

A staff member may have access to one or more authorized branches according to permissions.

The backend must derive tenant and branch access from authenticated membership rather than trusting IDs supplied by the frontend.

---

# 8. Multi-Tenant Architecture

ServeU uses:

> **Shared PostgreSQL database + shared schema + tenant_id + branch_id where relevant + server-side authorization.**

Every tenant-owned record must be tenant-scoped.

Branch-specific records must also be branch-scoped.

The system must prevent:

- Cross-tenant reads.
- Cross-tenant updates.
- Cross-tenant deletes.
- Unauthorized cross-branch access.

PostgreSQL constraints, indexes, transactions, authorization checks, and—where appropriate—PostgreSQL Row-Level Security should be evaluated/used as an additional defense layer.

Historical data must remain intact when staff, menu items, branches, or configuration entries become inactive.

---

# 9. Branch Management

Each branch should support:

- Branch name.
- Location/address.
- Contact information.
- Timezone.
- Operational hours.
- Tables.
- Staff access.
- Kitchen settings.
- Inventory.
- Branch operational settings.
- Branch-specific reports.

The user must be able to select an authorized branch and load branch-specific operational data.

Owners/managers with multi-branch access should be able to switch branches and view consolidated reports where authorized.

Branches should normally be deactivated rather than deleted.

---

# 10. Restaurant Onboarding

First-time onboarding:

1. Sign up.
2. Authenticate/verify identity.
3. Create restaurant/tenant.
4. Create first branch.
5. Create owner profile.
6. Configure basic settings.
7. Optionally configure menu and tables.
8. Invite staff.
9. Enter dashboard.

The onboarding flow should be resumable and should not force the owner through an unnecessarily long wizard.

The creator of a new tenant becomes the Owner unless an explicit platform workflow defines otherwise.

---

# 11. Authentication and Authorization

## 11.1 Authentication

Firebase Authentication is responsible for user identity and authentication lifecycle.

ServeU remains responsible for:

- Tenant membership.
- Branch membership.
- Roles.
- Permissions.
- Operational authorization.
- Business data access.

Flow:

**User → Firebase Login → Firebase ID Token → FastAPI → PostgreSQL Membership/RBAC → Authorized Request**

## 11.2 Authorization Rules

The frontend must never be treated as the security boundary.

The backend must verify:

- Authenticated identity.
- Tenant membership.
- Branch membership.
- Role.
- Permission.
- Resource ownership/scope.

Tenant IDs sent by the client must not be trusted as authorization.

Sensitive actions must be server-authorized and audited.

---

# 12. Permission Model

Representative permissions include:

### Orders

- orders.view
- orders.create
- orders.edit
- orders.send_to_kitchen
- orders.cancel
- orders.cancel_after_prep

### Payments

- payments.create
- payments.refund
- payments.refund_approve

### Inventory

- inventory.view
- inventory.receive
- inventory.adjust
- inventory.transfer
- inventory.count

### Reports

- reports.view
- reports.export
- reports.schedule

### Staff

- staff.view
- staff.create
- staff.edit
- staff.disable

### Settings

- settings.manage

### Roles

- roles.manage

Permissions must be evaluated together with tenant and branch membership.

---

# 13. Core Order Lifecycle

The central operational entity is the Order.

Recommended lifecycle:

**Draft → Confirmed → Sent to Kitchen → Preparing → Ready → Served → Bill Review → Payment → Paid → Closed**

Order state, kitchen state, payment state, and item-level state must remain independently represented where necessary.

## 13.1 Kitchen State

**Not Sent → New → Acknowledged → Preparing → Ready → Completed**

## 13.2 Payment State

**Pending → Partial → Paid → Failed → Refunded / Partially Refunded**

---

# 14. Order Creation and Kitchen Workflow

The waiter/cashier creates an order.

The order can be reviewed before sending.

**Send to Kitchen** is an explicit action.

Once sent, the kitchen receives a kitchen ticket/update.

Additional items added later must be sent as a separate kitchen update.

Cancelled sent items generate a separate kitchen cancellation update.

Kitchen staff must acknowledge cancellation updates.

---

# 15. Order Cancellation Rules

Core approved rules:

1. Authorized waiter/manager/cashier can initiate item cancellation.
2. Cancellation reason is mandatory.
3. Reasons are predefined.
4. An optional note can be added.
5. "Other" may include an optional note.
6. Owner/authorized senior user can configure cancellation reasons.
7. Historical orders preserve the reason that was selected at the time.
8. Cancellation status records whether it occurred:
   - Before Prep
   - During Prep
   - After Prep
9. Cancellation during preparation removes the billing amount after kitchen acknowledgement.
10. Before preparation, the amount can be removed automatically.
11. After preparation has started, monetary adjustment requiring approval follows the defined authorization workflow.
12. Rejected manager adjustment escalates to the owner/authorized senior user.
13. Cancellation activity is audited.

Advanced reminder/escalation/reopen controls are deferred unless separately approved.

---

# 16. POS and Billing

## 16.1 Bill Review

A Bill Review screen is mandatory before payment.

It displays:

- Items.
- Quantity.
- Price.
- Subtotal.
- Tax/service charges where configured.
- Discounts.
- Final payable amount.

The user can:

**Proceed to Payment** or **Edit Order**.

Editing returns to the order editing workflow and then back to Bill Review.

## 16.2 Payment Methods

MVP supports:

- Cash.
- Card/manual payment recording.
- Configurable Manual/Other methods.

Online gateways are future functionality.

## 16.3 Split and Partial Payments

Support:

- Split by items.
- Split by amount.
- Partial payments.
- Mixed payment methods.
- Remaining balance tracking.

## 16.4 Failed Payments

A failed payment must not close the order.

The cashier may retry or select another payment method.

## 16.5 Successful Payment

Sequence:

**Payment Confirmed → Order Paid → Receipt Generated → Order Closed → Ready for Next Order**

## 16.6 Cash Payment

Cash workflow:

**Amount Received → Change Calculated → Cashier Confirms → Payment Complete**

## 16.7 Duplicate Payment Protection

Payment operations must be idempotent to prevent duplicate financial records.

---

# 17. Refunds

Refunds are separate from normal item cancellation.

Paid/closed orders cannot be normally edited.

Refunds support:

- Full refund.
- Partial refund.
- Mandatory reason.
- Original payment/reference linkage.
- Manager authorization.
- Audit trail.

---

# 18. Receipts

A successful payment generates a receipt record.

Receipt options:

- Print.
- Digital/share.
- No receipt.

Receipt content may include:

- Restaurant information.
- Branch information.
- Order number.
- Table.
- Waiter.
- Items.
- Quantity.
- Discounts.
- Charges.
- Payment method.
- Date/time.

Receipt formatting should be configurable through settings without changing historical transaction data.

---

# 19. Table Management

Tables belong to a branch.

Table data may include:

- Table number/name.
- Capacity.
- Area/section.
- Active/inactive.
- Current status.

Statuses:

- Available.
- Occupied.
- Reserved.
- Cleaning.
- Out of Service.

Suggested areas:

- Indoor.
- Outdoor.
- VIP.
- Terrace.
- Hall.

Basic table move/merge capability should be supported where practical.

---

# 20. Waiter Attribution

Every operational order should retain historical waiter attribution.

The waiter responsible for the order should be visible where relevant during order punching and reporting.

Staff performance must be derived from historical order data rather than mutable monthly counters.

---

# 21. Menu Management

Menu structure:

**Category → Menu Item**

Menu items should support:

- Name.
- Description.
- Category.
- Selling price.
- Image.
- Active/inactive.
- Branch availability where required.
- Recipe linkage where configured.

Historical order items must store a price snapshot so future menu price changes do not alter historical orders.

---

# 22. Inventory Management

Inventory is a major operational intelligence module.

Each inventory item should support:

- Item name.
- Category.
- Unit.
- Current quantity.
- Minimum/reorder threshold.
- Maximum/target quantity where useful.
- Cost per unit.
- Supplier/vendor.
- Branch.
- Batch/lot where required.
- Expiry information where required.
- Active/inactive status.

## 22.1 Stock Movement

Every material stock change should create a movement record.

Movement types include:

- Opening.
- Purchase.
- Recipe Consumption.
- Waste.
- Adjustment.
- Stock Count.
- Transfer In.
- Transfer Out.
- Return.
- Expired.
- Manual Correction.

The system should preserve movement history rather than only updating a current quantity.

## 22.2 Inventory Intelligence

The system should identify:

- Current stock.
- Used quantity.
- Remaining quantity.
- Low stock.
- Out of stock.
- Near expiry.
- Expired stock.
- Waste.
- Stock adjustments.
- Branch transfers.
- Supplier-related activity.

---

# 23. Inventory Scanning

Inventory scanning should support a camera/scanner adapter.

Typical flow:

**Scan → Identify Item → View Stock → Count/Add/Adjust/Transfer/Waste → Save Movement**

The core business logic must not depend on a specific camera implementation so the same workflow can be adapted for web, Android, and Windows hardware.

---

# 24. Physical Stock Count

A stock count should compare counted quantity against system quantity and create an auditable adjustment.

The system must retain:

- Previous quantity.
- Counted quantity.
- Difference.
- User.
- Time.
- Branch.
- Reason.
- Resulting stock.

---

# 25. Inventory Transfers

Multi-branch transfers use linked operations:

**Transfer Out → Transfer In**

The system must preserve source and destination branches and prevent unauthorized transfers.

---

# 26. Recipe Management

Recipes connect menu items to inventory ingredients.

A recipe should support:

- Ingredients.
- Quantity per ingredient.
- Units.
- Ingredient cost.
- Recipe cost.
- Selling price.
- Gross profit.
- Gross margin.
- Active/inactive state.

## 26.1 Recipe Consumption

When the defined order event occurs, recipe consumption should deduct inventory.

Consumption must be idempotent so the same order event cannot consume stock twice.

---

# 27. Recipe Profitability Analysis

Reports should support date/time and branch filtering.

Metrics include:

- Units sold.
- Ingredient consumption.
- Recipe cost.
- Total sales.
- Gross profit.
- Gross margin.
- Branch comparison.
- Period comparison.

The system should distinguish theoretical recipe consumption from actual stock movement where possible.

Example:

**Expected consumption: 15 kg  
Actual consumption: 17 kg  
Variance: 2 kg**

This can help identify:

- Portion inconsistency.
- Waste.
- Recipe inaccuracies.
- Stock shrinkage.
- Operational issues.

---

# 28. Staff Performance

Staff performance reporting should support:

- Staff name.
- Branch.
- Orders.
- Items sold.
- Quantity.
- Sales amount.
- Average order value.
- Cancellations.
- Date range.

Rankings can be generated by:

- Quantity.
- Number of orders.
- Sales amount.

Reward/commission functionality should remain configurable/future-facing rather than being tied to payroll.

---

# 29. Vendor Management

Vendor records should support:

- Vendor name.
- Contact number.
- Contact details.
- Supplied items.
- Branch association where required.
- Visit/follow-up notes.
- Reminder date/time.
- Reminder status.

Saving a vendor number does not automatically send an SMS/WhatsApp/email.

External messaging integrations are separate future integrations.

---

# 30. Reporting Architecture

ServeU should use a centralized Report Engine.

The same reporting layer should support:

- Dashboard.
- Predefined reports.
- Custom reports.
- Exports.
- Scheduled reports.

Reports must be tenant- and branch-authorized.

## 30.1 Report Categories

- Sales.
- Product/Menu.
- Staff.
- Inventory.
- Recipe.
- Vendor.

## 30.2 Report Filters

Examples:

- Today.
- Yesterday.
- Week.
- Month.
- Custom date range.
- Branch.
- Category.
- Item.
- Staff.
- Payment method.
- Vendor.
- Movement type.

---

# 31. Custom Report Builder

Authorized users should be able to define:

- Data source.
- Columns.
- Filters.
- Date range.
- Branch/location.
- Staff.
- Product/item.
- Sales/payment type.
- Inventory metrics.
- Grouping.
- Sorting.
- Totals.

Reports should be viewable on screen and, where supported, exported to:

- PDF.
- Excel.
- CSV.

Saved report definitions may be reused.

---

# 32. Scheduled Reports

The system should support scheduled report definitions.

Example:

> Every day at 8:00 PM send the complete XYZ report for Branch A.

A schedule should define:

- Report definition.
- Branch/tenant scope.
- Recipient.
- Format.
- Schedule.
- Timezone.
- Active/inactive state.

A background worker executes scheduled jobs.

Jobs should support:

**Pending → Running → Completed / Failed**

with controlled retries.

Duplicate execution protection is required.

---

# 33. Notifications

Notification categories:

- Operational.
- Reminder.
- Report.

MVP/initial notification support should prioritize in-app notifications and system-generated alerts.

External email/SMS/WhatsApp integrations are separate integrations.

Critical authorization/security notifications must not be silently disabled.

---

# 34. Real-Time Architecture

ServeU uses:

> **REST API + WebSocket**

REST is used for normal CRUD, business transactions, and reliable commands.

WebSocket is used for real-time operational updates such as:

- New kitchen ticket.
- Kitchen status change.
- Order status.
- Table status.
- Payment/status updates where appropriate.
- Other authorized branch events.

WebSocket authorization must enforce the same tenant and branch boundaries as REST.

---

# 35. Offline Architecture

ServeU uses:

> **Online-first with controlled offline capability.**

The browser/client should not require internet for every operational action.

## 35.1 Connectivity States

Recommended states:

**ONLINE → CHECKING → CONNECTION LOST → LOCAL MODE → INTERNET RESTORED → SYNCING → SYNC COMPLETE → ONLINE**

The system should avoid rapid status flickering when the network is unstable.

## 35.2 Offline Storage

Production client-side operational storage uses:

**IndexedDB + Dexie**

not localStorage as the primary production offline database.

## 35.3 Offline Operations

An offline operation should contain identifiers such as:

- operation_id.
- tenant_id.
- branch_id.
- user_id.
- device_id.
- entity type.
- entity ID.
- operation type.
- timestamp.
- payload.
- sync status.

## 35.4 Offline Operations

Supported operational offline flows should include, according to release scope:

- Existing menu access.
- Existing tables.
- Create/edit order.
- Send order to local kitchen.
- Kitchen status updates.
- Cash payment.
- Receipt generation.
- Basic operational tracking.
- Safe inventory operations where defined.

Card/online gateway payments must never be falsely marked successful while offline.

---

# 36. Offline Counter-to-Kitchen Operation

A restaurant should not become completely dependent on internet connectivity for local operational coordination when the restaurant LAN/Wi-Fi remains available.

The architecture should support local operational coordination for:

**Counter → Local Kitchen → Waiter**

during internet interruption.

The exact browser-to-browser/LAN transport mechanism remains an implementation-level technical decision.

For larger restaurants, an optional local branch coordinator/server may be introduced later.

---

# 37. Offline Synchronization

When connectivity returns:

**Validate → Authenticate → Authorize Tenant/Branch → Check Idempotency → Apply Transaction → Server ACK → Mark Local Operation Synced**

The server/PostgreSQL remains authoritative after synchronization.

During an outage, local state is a temporary operational source of truth for the device/branch workflow.

## 37.1 Idempotency

The same operation ID submitted more than once must not create duplicate business effects.

## 37.2 Conflict Handling

Safe auto-merge may be used for genuinely non-conflicting changes.

Financial and critical status conflicts must use safe resolution/authorized review.

Blind last-write-wins must not be used for sensitive financial state.

## 37.3 Dependency Ordering

Offline dependent operations must preserve logical order.

Example:

**Create Order → Add Items → Send Kitchen → Kitchen Status → Cash Payment → Close**

Pending operations must survive device restart.

Offline activity must remain auditable.

---

# 38. Database Architecture

## 38.1 Technology

- PostgreSQL.
- SQLAlchemy 2.x.
- psycopg 3.
- Alembic.

## 38.2 Data Principles

Use relational integrity for:

- Foreign keys.
- Unique constraints.
- Check constraints.
- Transactions.
- Indexes.

Money must be stored as integer minor units with currency context.

Example:

```text
amount_minor = 125000
currency = PKR
```

The system must not use floating-point values for financial totals.

## 38.3 Core Data Domains

High-level hierarchy:

**Tenant → Branch → Users/Staff → Menu → Tables → Orders → Kitchen → Payments → Inventory → Recipes → Vendors → Reports → Audit Logs → Sync**

---

# 39. Backend Architecture

Backend:

**FastAPI + Python**

Architecture:

> **Modular Monolith**

The system should avoid unnecessary microservices.

Suggested feature modules:

- auth
- tenants
- users
- roles
- branches
- menu
- orders
- kitchen
- pos
- payments
- customers
- inventory
- recipes
- vendors
- reports
- notifications
- sync
- settings
- admin

Each module should separate responsibilities such as:

- Models.
- Schemas.
- Routes/controllers.
- Services.
- Business rules.
- Data access where useful.

SQLAlchemy ORM should be used for normal application operations.

SQLAlchemy Core/SQL should be available for complex reporting and optimized queries.

---

# 40. API Architecture

REST API versioning:

**/api/v1/**

The frontend must never directly connect to PostgreSQL.

Architecture:

**React / Android / Windows → FastAPI → Authorization → Services → SQLAlchemy → PostgreSQL**

WebSocket is an additional realtime channel.

API responses and validation should be consistent across clients.

---

# 41. Frontend Architecture

Frontend:

- React.
- TypeScript.
- Vite.
- PWA.
- TanStack Query.
- React Hook Form.
- Zod.

TanStack Query handles server state, caching, synchronization, and mutations.

React state/context handles local UI state where appropriate.

The application should avoid unnecessary global state complexity.

---

# 42. Cross-Platform Strategy

ServeU should be designed as one core application with platform adapters.

Target:

**Web/PWA → Capacitor Android → Tauri Windows**

The business logic and UI components should remain shared as much as practical.

Platform-specific adapters may handle:

- Camera.
- Barcode/scanner.
- Notifications.
- File access.
- Printing.
- Device capabilities.

Platform-specific behavior must not pollute the core domain logic.

---

# 43. Responsive UI Architecture

ServeU must be responsive by architecture, not by repeatedly redesigning pages for each device.

Supported environments:

- Desktop.
- Laptop.
- Tablet.
- Mobile.
- Android.
- Windows.

## 43.1 Design Principle

> **Design once, adapt everywhere.**

Use:

- CSS Grid.
- Flexbox.
- Responsive containers.
- Fluid spacing.
- Responsive typography.
- Defined aspect ratios.
- Adaptive cards/tables.
- Touch-friendly controls.
- Reusable design-system components.

Avoid arbitrary fixed positioning and hardcoded widths that break on smaller screens.

## 43.2 Responsive Composition

The same component may change layout according to available space.

Example:

Desktop:

**Sidebar + Main Content**

Tablet:

**Compact/Collapsible Sidebar + Main Content**

Mobile:

**Header + Main Content + Mobile Navigation**

The business workflow remains consistent while presentation adapts.

---

# 44. Image and Media Handling

Uploaded images must not be stretched or distorted when the viewport changes.

Use:

- Preserved aspect ratios.
- Responsive containers.
- `object-fit` rules.
- Appropriate cropping rules.
- Responsive image variants where useful.

Recommended media pipeline:

**Original → Optimized Versions → Thumbnail / Medium / Large**

Images should be served according to display context where practical.

Text must wrap safely and should not overflow containers.

Long titles/descriptions should use controlled wrapping or truncation where appropriate.

---

# 45. Responsive POS

POS is primarily optimized for restaurant counter screens and large displays.

It must remain usable on:

- Desktop.
- Laptop.
- Tablet.

Mobile support should preserve the same business workflow while adapting layout to limited width.

The POS should prioritize:

- Large touch targets.
- Fast item selection.
- Clear order summary.
- Minimal unnecessary navigation.
- Fast payment flow.

---

# 46. Responsive Kitchen/KDS

KDS should optimize for large kitchen displays while remaining usable on smaller devices.

Large screens may display multiple ticket columns.

Smaller screens may stack or scroll ticket groups.

The underlying kitchen states and ticket data remain identical.

---

# 47. UI Design System

The approved ServeU palette:

| Token | Value | Intended Role |
|---|---|---|
| Pearl Beige | `#f4e8c1` | Backgrounds, cards, receipts |
| Ash Grey | `#a0c1b9` | Borders, muted surfaces |
| Pacific Blue | `#70a0af` | Interactive accents |
| Vintage Lavender | `#706993` | Secondary actions/charts |
| Midnight Violet | `#331e38` | Primary text, headers, dark surfaces |

The design system must centralize colors as tokens/variables.

Accessibility must be considered, including sufficient contrast for text and controls.

---

# 48. Settings and Configuration

Settings are divided into:

## Global Restaurant Settings

- Restaurant name.
- Logo.
- Contact.
- Address.
- Country.
- Language.
- Timezone.
- Currency.
- Global roles/permissions.
- Cancellation reasons.
- Report definitions.
- Payment methods.

## Branch Settings

- Branch name.
- Address.
- Contact.
- Hours.
- Tables.
- Kitchen.
- Staff access.
- Inventory.
- Operational settings.

Branch overrides should only exist where operationally meaningful.

Sensitive settings changes must be audited.

---

# 49. Currency and Money

Money must use:

- Integer minor units.
- ISO 4217 currency code.
- Currency exponent.

Historical transactions must retain their transaction currency context.

Changing future currency settings must not rewrite historical financial records.

---

# 50. Audit Logging

Sensitive and operationally important actions should generate audit records.

Examples:

- Login/security changes.
- Role/permission changes.
- Staff disablement.
- Order cancellation.
- Refund.
- Payment correction.
- Inventory adjustment.
- Stock count.
- Transfer.
- Sensitive settings change.
- Approval/rejection.
- Offline synchronization.

Audit data should include relevant:

- User.
- Tenant.
- Branch.
- Action.
- Entity.
- Timestamp.
- Device where applicable.
- Previous/new state where appropriate.

---

# 51. File and Media Storage

Binary media should not unnecessarily live inside core relational tables.

Recommended architecture:

**Object/File Storage → File Metadata in PostgreSQL**

Use this for:

- Menu images.
- Restaurant logo.
- Report exports.
- Other supported documents/media.

---

# 52. AI Reporting Assistant

AI reporting is intentionally not a core dependency of POS, Kitchen, Inventory, or Payments.

Future flow:

**Admin → AI Report Assistant → Report Definition/Intent → ServeU Report Engine → Authorization → PostgreSQL → Results → AI Analysis**

AI must not directly receive unrestricted database access.

Possible future capabilities:

- Natural language report requests.
- Branch comparisons.
- Inventory anomaly explanations.
- Recipe profitability questions.
- Staff performance summaries.
- Report scheduling assistance.

If the AI service fails, core restaurant operations must continue.

---

# 53. Background Jobs

A background worker handles non-critical asynchronous work such as:

- Scheduled reports.
- Export generation.
- Reminders.
- Notifications.
- Other long-running jobs.

Core POS/Kitchen/Payment operations must not depend on successful completion of background jobs.

Job states:

**Pending → Running → Completed / Failed**

Retries must be controlled and idempotent.

---

# 54. Deployment Architecture

Recommended production structure:

```text
Users
  ↓
CDN / Static Frontend
  ↓
FastAPI Application
  ↓
Service / Domain Layer
  ↓
PostgreSQL

Background Worker
  ↓
Scheduled Jobs / Reports / Notifications

Object Storage
  ↓
Images / Exports / Files
```

The system should be containerized.

Production should use managed PostgreSQL where practical.

---

# 55. Environments

Maintain:

1. Local development.
2. Staging/QA.
3. Production.

Initial testing can use low-cost/free-tier cloud infrastructure where appropriate.

Staging must never be treated as production.

Android/Windows QA builds may target staging.

---

# 56. CI/CD

Recommended flow:

**Git Push → Automated Tests → Build → Deploy → Health Check**

Production deployment should require successful quality gates.

Database migrations must be controlled and reversible where practical.

---

# 57. Reliability

The system must include:

- Automated database backups.
- Restore testing.
- Health checks.
- Error monitoring.
- Structured logs.
- Background job monitoring.
- Sync failure monitoring.
- Authentication/security event monitoring.

A backup that has never been restored/tested must not be considered fully reliable.

---

# 58. Testing Strategy

Testing must cover both business logic and failure conditions.

## 58.1 Unit Tests

Examples:

- Order totals.
- Discounts.
- Tax/service charge calculations.
- Payment calculations.
- Change calculation.
- Refund logic.
- Recipe costing.
- Inventory movement.
- Stock thresholds.
- Permission checks.
- Report calculations.
- Sync idempotency.

## 58.2 Integration Tests

Examples:

- Tenant isolation.
- Branch authorization.
- Order creation.
- Kitchen updates.
- Payment transaction.
- Refund transaction.
- Inventory deduction.
- Recipe consumption.
- Report generation.
- Scheduled jobs.
- Offline synchronization.

## 58.3 End-to-End Tests

Critical user journeys:

- Login.
- Tenant creation.
- Branch selection.
- Menu setup.
- Table order.
- Send to kitchen.
- Kitchen preparation.
- Bill review.
- Cash payment.
- Split payment.
- Receipt.
- Refund.
- Inventory update.
- Recipe consumption.
- Reports.

## 58.4 Failure Tests

Test:

- Internet loss.
- Internet restoration.
- Duplicate sync operation.
- Duplicate payment attempt.
- Device restart during offline queue.
- WebSocket disconnect.
- API timeout.
- Background job failure.
- Permission removal.
- Unauthorized branch access.
- Unauthorized tenant access.

---

# 59. Security Quality Gates

Before production:

- No cross-tenant access.
- No unauthorized branch access.
- Authentication correctly validated.
- Role/permission checks server-side.
- Sensitive actions audited.
- Financial operations idempotent.
- Input validation enforced.
- Secrets excluded from client bundles.
- Production HTTPS.
- Secure configuration management.
- Dependency/security scanning.
- Database access restricted.

---

# 60. Performance Quality Gates

The application should remain responsive under realistic restaurant workloads.

Performance work should focus on:

- Fast POS interaction.
- Fast kitchen updates.
- Efficient database queries.
- Proper indexing.
- Pagination for large datasets.
- Efficient report queries.
- Background generation for heavy exports.
- Controlled WebSocket usage.
- Efficient image delivery.
- Minimal unnecessary frontend re-rendering.

---

# 61. Acceptance Criteria

A release is not considered complete merely because screens exist.

A feature is complete when:

1. UI exists.
2. Backend authorization exists.
3. Database model exists.
4. Business rules are implemented.
5. Error states are handled.
6. Relevant audit behavior exists.
7. Offline behavior is defined where applicable.
8. Tests exist.
9. Responsive behavior works.
10. Security boundaries are verified.
11. Performance is acceptable.
12. Documentation is updated.

---

# 62. Core End-to-End Restaurant Flow

The complete intended flow is:

```text
Owner creates Restaurant
        ↓
Creates Branch
        ↓
Adds Staff
        ↓
Creates Menu
        ↓
Creates Tables
        ↓
Waiter opens Table
        ↓
Creates Order
        ↓
Send to Kitchen
        ↓
Kitchen receives Ticket
        ↓
Kitchen prepares
        ↓
Kitchen marks Ready
        ↓
Waiter serves
        ↓
Bill Review
        ↓
Payment
        ↓
Receipt
        ↓
Order Closed
        ↓
Recipe Consumption
        ↓
Inventory Updated
        ↓
Reports Updated
        ↓
Staff Performance Updated
```

Where the system is offline, supported operations are queued and synchronized safely when connectivity returns.

---

# 63. Operational Intelligence Flow

ServeU should connect:

```text
Order
  ↓
Menu Item
  ↓
Recipe
  ↓
Ingredients
  ↓
Inventory Consumption
  ↓
Actual Stock
  ↓
Variance
  ↓
Cost
  ↓
Selling Price
  ↓
Gross Profit
  ↓
Reports
```

This allows the restaurant to understand not only sales, but also what was consumed, what remains, where shortages/waste occur, and which recipes/products are profitable.

---

# 64. Reporting Intelligence Flow

```text
Operational Data
      ↓
Report Engine
      ↓
Dashboard / Predefined Reports
      ↓
Custom Report Builder
      ↓
Export / Schedule
      ↓
Future AI Assistant
```

The Report Engine remains the authoritative reporting layer.

---

# 65. Important Architecture Principles

1. PostgreSQL is the business data source of truth.
2. Firebase authenticates identity; ServeU authorizes business access.
3. Tenant and branch isolation is enforced server-side.
4. Financial operations use transactions and idempotency.
5. Money is stored as integer minor units.
6. Historical business records must not be rewritten by future configuration changes.
7. Offline operation is controlled, not an unrestricted local copy of the server.
8. Local offline state is temporary operational truth during outage; server/PostgreSQL becomes authoritative after sync.
9. Real-time communication uses REST + WebSocket.
10. Modular monolith is preferred over unnecessary microservices.
11. Frontend never accesses PostgreSQL directly.
12. Responsive design is built into the component architecture.
13. Platform-specific features use adapters.
14. Background jobs must not block core restaurant operations.
15. AI must not become a dependency for core restaurant operations.
16. Auditability is required for sensitive actions.
17. Existing data should be preserved rather than casually deleted.
18. Every feature must have defined authorization and failure behavior.

---

# 66. Deferred / Future Technical Decisions

The following remain intentionally open until implementation design requires them:

- Exact browser-to-browser/LAN offline transport.
- Optional local branch coordinator implementation.
- Exact cloud provider for production.
- Exact object-storage provider.
- Redis adoption threshold.
- Online payment gateway/provider.
- External SMS/WhatsApp/email providers.
- AI provider and model.
- Advanced reward/commission engine.
- Advanced reservation system.
- Platform administration depth.
- Native/hardware-specific printer integrations.

These decisions must not be allowed to destabilize the core architecture.

---

# 67. Implementation Order

Recommended implementation sequence:

## Phase 1 — Foundation

- Repository.
- Development environments.
- React/Vite frontend.
- FastAPI backend.
- PostgreSQL.
- SQLAlchemy.
- Alembic.
- CI/CD.
- Base design system.
- Error handling.
- Logging.
- Testing framework.

## Phase 2 — Identity and Tenant

- Firebase authentication.
- Users.
- Tenants.
- Branches.
- Roles.
- Permissions.
- Staff membership.
- Authorization middleware.
- Audit foundation.

## Phase 3 — Restaurant Core

- Menu.
- Categories.
- Tables.
- Branch configuration.
- Order creation.
- Order editing.
- Waiter attribution.

## Phase 4 — Kitchen

- Send to Kitchen.
- KDS.
- Ticket states.
- Additional item updates.
- Cancellation updates.
- Kitchen acknowledgement.
- Realtime WebSocket updates.

## Phase 5 — POS

- Bill Review.
- Discounts/charges.
- Cash payment.
- Manual/card recording.
- Split/partial payments.
- Receipt.
- Refunds.
- Idempotency.

## Phase 6 — Inventory and Recipes

- Inventory items.
- Movements.
- Stock counts.
- Waste.
- Transfers.
- Batches/expiry.
- Recipe management.
- Recipe costing.
- Consumption.
- Variance.

## Phase 7 — Reporting

- Report Engine.
- Dashboard.
- Sales reports.
- Staff reports.
- Inventory reports.
- Recipe reports.
- Vendor reports.
- Custom Report Builder.
- Exports.
- Scheduled reports.

## Phase 8 — Offline and Sync

- IndexedDB/Dexie.
- Offline queue.
- Connectivity state machine.
- Idempotent sync.
- Conflict handling.
- Restart recovery.
- Local operational coordination.

## Phase 9 — Cross-Platform

- PWA hardening.
- Android/Capacitor.
- Windows/Tauri.
- Platform adapters.
- Device-specific testing.

## Phase 10 — Production Hardening

- Performance.
- Security testing.
- Backup/restore.
- Monitoring.
- Failure testing.
- Load testing.
- Production deployment.
- Operational documentation.

---

# 68. Definition of Done

ServeU is production-ready only when:

- Core workflows work end-to-end.
- Tenant isolation is tested.
- Branch authorization is tested.
- Payment and refund flows are safe.
- Kitchen realtime flow is reliable.
- Offline-supported operations survive restart.
- Synchronization is idempotent.
- Inventory/recipe calculations are correct.
- Reports reconcile with source data.
- Responsive layouts work across target device classes.
- Security controls are verified.
- Backups and restore procedures are tested.
- Monitoring is active.
- CI/CD quality gates pass.
- Critical user journeys have automated coverage.
- No known critical security/data-integrity defects remain.

---

# 69. Final Architecture Summary

```text
                         SERVEU
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     Responsive UI                     Future Clients
          │                                 │
   React + TypeScript              Capacitor / Tauri
          │                                 │
          └────────────────┬────────────────┘
                           │
                    REST + WebSocket
                           │
                       FastAPI
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Authorization       Domain Services    Background Worker
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     SQLAlchemy 2
                           │
                       PostgreSQL
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Business Data       Audit / Sync       Reporting
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    Object/File Storage
```

### Final product principle

> **ServeU should feel like one simple restaurant application to the user, while internally maintaining strong tenant isolation, reliable transactions, controlled offline capability, real-time operations, accurate inventory/recipe intelligence, and a scalable reporting architecture.**

---

## Document Status

**Planning status:** Major architecture and product decisions consolidated.

**Next step:** Convert this master PRD into the implementation backlog, database schema specification, API contract, permission matrix, and UI/component specification before production coding begins.
