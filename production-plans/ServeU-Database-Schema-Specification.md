# ServeU Database Schema Specification

**Document:** ServeU Database Schema Specification  
**Version:** 1.0 Draft  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy 2.x  
**Driver:** psycopg 3  
**Migrations:** Alembic  
**Status:** Implementation Blueprint

---

## 1. Purpose

This document defines the relational database blueprint for ServeU.

It translates the Master PRD's business domains into PostgreSQL entities, relationships, constraints, indexes, and data rules.

The database must prioritize:

- Tenant isolation.
- Branch isolation.
- Financial integrity.
- Historical accuracy.
- Transaction safety.
- Auditability.
- Offline synchronization.
- Reporting performance.
- Future extensibility.

---

# 2. Core Database Principles

## 2.1 PostgreSQL Is the Source of Truth

PostgreSQL is authoritative for persisted business data.

During controlled offline operation, local client state may temporarily act as the operational source for supported actions. After synchronization, PostgreSQL becomes authoritative.

## 2.2 Every Tenant-Owned Record Is Scoped

Tenant-owned tables must contain:

```text
tenant_id
```

Branch-specific tables additionally contain:

```text
branch_id
```

where branch ownership is meaningful.

## 2.3 Never Trust Tenant IDs From the Client

The authenticated user identity is resolved first.

The backend determines:

```text
user → tenant membership → branch membership → permission
```

Client-supplied tenant/branch IDs are treated as requested scope, not proof of authorization.

## 2.4 Financial Data Is Immutable by Default

Historical:

- orders
- order items
- payments
- refunds
- receipts
- inventory movements

must not be rewritten simply because current configuration changes.

Corrections should use explicit adjustment/refund/audit mechanisms.

## 2.5 Money

Never use floating point for financial amounts.

Use:

```text
amount_minor BIGINT
currency_code CHAR(3)
```

Example:

```text
125000 PKR
```

Currency exponent/metadata is maintained by the currency configuration layer.

## 2.6 Quantities

Inventory quantities should use PostgreSQL `NUMERIC`, not floating-point.

Example:

```text
quantity NUMERIC(18,6)
```

This supports:

- grams
- kilograms
- millilitres
- litres
- pieces
- fractional operational quantities

---

# 3. Entity Overview

High-level relationship:

```text
User
  │
  ├── UserTenantMembership ── Tenant
  │                              │
  │                              ├── Branch
  │                              │     ├── Staff Access
  │                              │     ├── Tables
  │                              │     ├── Menu Availability
  │                              │     ├── Orders
  │                              │     ├── Inventory
  │                              │     └── Reports
  │                              │
  │                              ├── Roles / Permissions
  │                              ├── Menu Categories
  │                              ├── Menu Items
  │                              ├── Recipes
  │                              ├── Vendors
  │                              ├── Customers
  │                              └── Settings
  │
  └── Audit / Device / Session
```

Order flow:

```text
Table
  ↓
Order
  ↓
Order Items
  ↓
Kitchen Ticket / Kitchen Events
  ↓
Bill
  ↓
Payments
  ↓
Receipt
  ↓
Refunds
```

Inventory flow:

```text
Inventory Item
  ↓
Recipe Ingredient
  ↓
Recipe
  ↓
Menu Item
  ↓
Order Item
  ↓
Recipe Consumption
  ↓
Inventory Movement
```

Reporting flow:

```text
Operational Tables
       ↓
   Report Engine
       ↓
Report Definitions / Runs / Schedules
```

Offline flow:

```text
Client
  ↓
Sync Operation
  ↓
Validation
  ↓
Authorization
  ↓
Idempotency
  ↓
Business Transaction
  ↓
Sync Result
```

---

# 4. Identity and Access Tables

## 4.1 users

Purpose: application identity linked to Firebase Authentication.

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| firebase_uid | VARCHAR | Unique |
| email | CITEXT | Unique where appropriate |
| display_name | VARCHAR | User display name |
| phone | VARCHAR | Optional |
| status | VARCHAR | active/inactive |
| last_login_at | TIMESTAMPTZ | Nullable |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |

Constraints:

- `firebase_uid` unique.
- Email normalization must be handled consistently.
- Do not store Firebase passwords.

---

## 4.2 tenants

Represents a restaurant/business account.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | Required |
| slug | VARCHAR | Unique platform identifier |
| logo_file_id | UUID | Nullable |
| country_code | CHAR(2) | Optional |
| default_currency_code | CHAR(3) | Required |
| timezone | VARCHAR | Required |
| status | VARCHAR | active/inactive |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |

A tenant must not be physically deleted if historical records depend on it.

---

## 4.3 branches

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK |
| name | VARCHAR | Required |
| code | VARCHAR | Branch identifier |
| address | TEXT | Optional |
| city | VARCHAR | Optional |
| country_code | CHAR(2) | Optional |
| phone | VARCHAR | Optional |
| timezone | VARCHAR | Required |
| status | VARCHAR | active/inactive |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |

Constraints:

- `(tenant_id, code)` unique.
- `tenant_id` indexed.
- Branch cannot reference another tenant's records.

---

## 4.4 user_tenant_memberships

Connects a user to a tenant.

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| user_id | UUID |
| status | VARCHAR |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Constraint:

```text
UNIQUE(tenant_id, user_id)
```

---

## 4.5 user_branch_memberships

Controls branch access.

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| branch_id | UUID |
| user_id | UUID |
| status | VARCHAR |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Constraint:

```text
UNIQUE(branch_id, user_id)
```

A branch membership must belong to the same tenant as the user-tenant membership.

---

## 4.6 roles

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| name | VARCHAR |
| system_key | VARCHAR |
| description | TEXT |
| is_system | BOOLEAN |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

System roles:

- Platform Admin
- Owner
- Manager
- Cashier
- Waiter
- Kitchen Staff

---

## 4.7 permissions

| Field | Type |
|---|---|
| id | UUID |
| key | VARCHAR |
| description | TEXT |

Example:

```text
orders.create
orders.edit
orders.send_to_kitchen
orders.cancel
payments.create
payments.refund
inventory.adjust
reports.export
settings.manage
```

---

## 4.8 role_permissions

Many-to-many role/permission mapping.

```text
role_id
permission_id
```

Unique:

```text
UNIQUE(role_id, permission_id)
```

---

## 4.9 user_roles

Allows role assignment to users.

```text
tenant_id
user_id
role_id
branch_id NULLABLE
```

A nullable branch may represent tenant-wide role scope.

---

## 4.10 staff_profiles

Operational staff record separate from identity.

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| user_id | UUID nullable |
| employee_code | VARCHAR nullable |
| display_name | VARCHAR |
| phone | VARCHAR |
| status | VARCHAR |
| hired_at | DATE nullable |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

A staff profile may exist before a user accepts an invitation.

---

# 5. Restaurant Configuration

## 5.1 tenant_settings

Stores restaurant-wide settings.

Recommended approach:

Use typed relational fields for security/critical configuration and structured JSON for extensible low-risk settings.

Possible fields:

```text
tenant_id
language
timezone
currency
receipt_settings JSONB
order_settings JSONB
notification_settings JSONB
inventory_settings JSONB
```

Do not put security-critical authorization rules only in JSON.

---

## 5.2 branch_settings

```text
branch_id
hours JSONB
kitchen_settings JSONB
table_settings JSONB
operational_settings JSONB
```

---

# 6. Menu

## 6.1 menu_categories

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| name | VARCHAR |
| description | TEXT |
| sort_order | INTEGER |
| status | VARCHAR |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

## 6.2 menu_items

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| category_id | UUID |
| name | VARCHAR |
| description | TEXT |
| price_minor | BIGINT |
| currency_code | CHAR(3) |
| image_file_id | UUID nullable |
| status | VARCHAR |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Menu item price changes must not modify historical order item snapshots.

---

## 6.3 branch_menu_items

Controls branch availability.

```text
branch_id
menu_item_id
available
price_minor_override NULLABLE
sort_order
```

If branch-specific pricing is supported, historical orders still store the actual transaction price.

---

# 7. Tables and Areas

## 7.1 table_areas

```text
id
tenant_id
branch_id
name
sort_order
status
```

Examples:

- Indoor
- Outdoor
- VIP
- Terrace
- Hall

## 7.2 restaurant_tables

```text
id
tenant_id
branch_id
area_id
table_number
name
capacity
status
created_at
updated_at
```

Statuses:

- Available
- Occupied
- Reserved
- Cleaning
- Out of Service

---

# 8. Orders

## 8.1 orders

Central business entity.

Suggested fields:

| Field | Type |
|---|---|
| id | UUID |
| tenant_id | UUID |
| branch_id | UUID |
| order_number | VARCHAR |
| table_id | UUID nullable |
| customer_id | UUID nullable |
| waiter_staff_id | UUID nullable |
| created_by_user_id | UUID |
| status | VARCHAR |
| currency_code | CHAR(3) |
| subtotal_minor | BIGINT |
| discount_minor | BIGINT |
| tax_minor | BIGINT |
| service_charge_minor | BIGINT |
| total_minor | BIGINT |
| paid_minor | BIGINT |
| remaining_minor | BIGINT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| closed_at | TIMESTAMPTZ nullable |

Order totals should be calculated by trusted backend business logic.

## 8.2 order_items

```text
id
tenant_id
branch_id
order_id
menu_item_id
item_name_snapshot
unit_price_minor
currency_code
quantity
modifier_data JSONB
kitchen_status
cancellation_status
cancel_reason_id nullable
cancel_note nullable
created_at
updated_at
```

Important:

`item_name_snapshot` and `unit_price_minor` preserve historical values.

---

# 9. Cancellation Reasons

## 9.1 cancellation_reasons

```text
id
tenant_id
name
description
sort_order
status
created_at
updated_at
```

Historical order items reference the reason ID and should also preserve enough snapshot information to remain understandable if the reason is later renamed/deactivated.

---

# 10. Order Events

## 10.1 order_events

Append-oriented operational history.

```text
id
tenant_id
branch_id
order_id
order_item_id nullable
event_type
actor_user_id
payload JSONB
created_at
```

Examples:

- Order Created.
- Order Confirmed.
- Sent to Kitchen.
- Item Added.
- Item Cancelled.
- Cancellation Acknowledged.
- Order Served.
- Bill Reviewed.
- Payment Started.
- Order Closed.

This supports auditability and operational history.

---

# 11. Kitchen

## 11.1 kitchen_tickets

```text
id
tenant_id
branch_id
order_id
ticket_number
status
created_at
updated_at
completed_at nullable
```

## 11.2 kitchen_ticket_items

```text
id
tenant_id
branch_id
kitchen_ticket_id
order_item_id
quantity
status
created_at
updated_at
```

## 11.3 kitchen_events

```text
id
tenant_id
branch_id
kitchen_ticket_id
kitchen_ticket_item_id nullable
event_type
actor_user_id
created_at
payload JSONB
```

This supports additional kitchen updates and cancellation acknowledgements.

---

# 12. Billing

A separate bill table may be introduced when billing needs become more complex.

## 12.1 bills

```text
id
tenant_id
branch_id
order_id
subtotal_minor
discount_minor
tax_minor
service_charge_minor
total_minor
currency_code
status
created_at
updated_at
```

If the initial implementation does not require a separate bill entity, the order may carry the authoritative totals while preserving Bill Review events.

---

# 13. Payments

## 13.1 payments

```text
id
tenant_id
branch_id
order_id
payment_reference
method
status
amount_minor
currency_code
received_minor nullable
change_minor nullable
external_reference nullable
idempotency_key
created_by_user_id
created_at
updated_at
```

Methods:

- cash
- card
- manual
- other
- future online gateway methods

Statuses:

- pending
- partial
- succeeded
- failed
- refunded
- partially_refunded

Unique idempotency key must prevent duplicate financial effects.

---

# 14. Refunds

## 14.1 refunds

```text
id
tenant_id
branch_id
order_id
payment_id
amount_minor
currency_code
reason
status
requested_by_user_id
approved_by_user_id nullable
created_at
approved_at nullable
```

Refunds must never silently overwrite the original payment.

---

# 15. Receipts

## 15.1 receipts

```text
id
tenant_id
branch_id
order_id
receipt_number
payment_id nullable
format
delivery_method
receipt_snapshot JSONB
created_at
```

The receipt snapshot preserves the transaction representation at generation time.

---

# 16. Customers

Customers are part of the later product scope.

## 16.1 customers

```text
id
tenant_id
name
phone
email
notes
status
created_at
updated_at
```

## 16.2 customer_order_links

Normally the relationship can be represented through `orders.customer_id`.

---

# 17. Inventory

## 17.1 inventory_categories

```text
id
tenant_id
name
sort_order
status
```

## 17.2 units

```text
id
tenant_id nullable
code
name
base_unit_id nullable
conversion_factor
```

Examples:

- g
- kg
- ml
- litre
- piece
- dozen
- pack

Unit conversion must be explicit and deterministic.

## 17.3 inventory_items

```text
id
tenant_id
category_id
name
sku nullable
unit_id
cost_per_unit_minor
currency_code
minimum_quantity
target_quantity nullable
tracking_mode
status
created_at
updated_at
```

---

# 18. Inventory by Branch

## 18.1 branch_inventory_items

```text
id
tenant_id
branch_id
inventory_item_id
current_quantity
minimum_quantity_override nullable
target_quantity_override nullable
status
updated_at
```

This keeps branch stock independent.

---

# 19. Inventory Batches

## 19.1 inventory_batches

```text
id
tenant_id
branch_id
inventory_item_id
batch_number nullable
quantity
unit_cost_minor
expiry_date nullable
received_at
status
```

Supports expiry tracking and future FEFO logic.

---

# 20. Inventory Movements

## 20.1 inventory_movements

```text
id
tenant_id
branch_id
inventory_item_id
batch_id nullable
movement_type
quantity
unit_cost_minor nullable
reference_type nullable
reference_id nullable
reason nullable
created_by_user_id
created_at
```

Movement types:

- opening
- purchase
- recipe_consumption
- waste
- adjustment
- stock_count
- transfer_in
- transfer_out
- return
- expired
- manual_correction

Stock should be reconstructable from movement history.

---

# 21. Stock Counts

## 21.1 stock_counts

```text
id
tenant_id
branch_id
status
counted_by_user_id
started_at
completed_at nullable
```

## 21.2 stock_count_items

```text
id
stock_count_id
inventory_item_id
system_quantity
counted_quantity
difference_quantity
```

Completion creates inventory movement records.

---

# 22. Inventory Transfers

## 22.1 inventory_transfers

```text
id
tenant_id
source_branch_id
destination_branch_id
status
created_by_user_id
created_at
completed_at nullable
```

## 22.2 inventory_transfer_items

```text
id
inventory_transfer_id
inventory_item_id
quantity
```

Transfer completion should create linked transfer-out and transfer-in movements.

---

# 23. Recipes

## 23.1 recipes

```text
id
tenant_id
menu_item_id
name
selling_price_snapshot_minor nullable
status
created_at
updated_at
```

## 23.2 recipe_ingredients

```text
id
tenant_id
recipe_id
inventory_item_id
quantity
unit_id
created_at
updated_at
```

The recipe should define the expected ingredient quantity per recipe/menu item unit.

---

# 24. Recipe Consumption

## 24.1 recipe_consumptions

```text
id
tenant_id
branch_id
order_id
order_item_id
recipe_id
quantity_produced
consumption_status
idempotency_key
created_at
```

Unique idempotency rules must prevent duplicate inventory consumption.

---

# 25. Vendors

## 25.1 vendors

```text
id
tenant_id
name
phone
email nullable
address nullable
notes nullable
status
created_at
updated_at
```

## 25.2 vendor_items

```text
id
tenant_id
vendor_id
inventory_item_id
preferred
last_cost_minor nullable
```

## 25.3 vendor_visits

```text
id
tenant_id
branch_id nullable
vendor_id
visit_at
notes
created_by_user_id
```

## 25.4 vendor_reminders

```text
id
tenant_id
branch_id nullable
vendor_id
reminder_at
title
notes
status
created_by_user_id
completed_at nullable
```

---

# 26. Staff Performance

No monthly performance counter should be treated as the source of truth.

Performance is derived from historical operational data.

Potential reporting queries aggregate:

```text
orders.waiter_staff_id
order_items.quantity
orders.total_minor
orders.status
orders.created_at
orders.branch_id
```

A future materialized/reporting table may be introduced only if performance requires it.

---

# 27. Reports

## 27.1 report_definitions

```text
id
tenant_id
name
description
report_type
definition JSONB
created_by_user_id
status
created_at
updated_at
```

The definition stores:

- columns
- filters
- grouping
- sorting
- totals
- date configuration
- data source

The backend validates report definitions.

## 27.2 report_schedules

```text
id
tenant_id
report_definition_id
branch_id nullable
schedule_expression
timezone
format
recipient_config JSONB
status
created_at
updated_at
```

## 27.3 report_runs

```text
id
tenant_id
report_definition_id
schedule_id nullable
branch_id nullable
status
started_at
completed_at nullable
file_id nullable
error_message nullable
```

---

# 28. Files

## 28.1 files

Metadata only.

```text
id
tenant_id
branch_id nullable
storage_key
file_name
mime_type
size_bytes
checksum nullable
purpose
created_by_user_id
created_at
```

Actual binary data belongs in object/file storage.

---

# 29. Notifications

## 29.1 notifications

```text
id
tenant_id
branch_id nullable
user_id nullable
type
title
message
payload JSONB
read_at nullable
created_at
```

---

# 30. Devices and Sessions

## 30.1 devices

```text
id
tenant_id
branch_id nullable
user_id
device_key
device_name
platform
last_seen_at
status
created_at
updated_at
```

Supports:

- device identification
- offline operation
- security/session management

## 30.2 sessions

If ServeU maintains application sessions in addition to Firebase identity:

```text
id
user_id
tenant_id nullable
device_id nullable
status
created_at
expires_at
revoked_at nullable
```

Session implementation must not conflict with Firebase's identity lifecycle.

---

# 31. Offline Sync

## 31.1 sync_operations

```text
id
operation_id
tenant_id
branch_id
user_id
device_id
entity_type
entity_id nullable
operation_type
occurred_at
payload JSONB
status
received_at
processed_at nullable
result JSONB nullable
error_code nullable
error_message nullable
```

Critical unique constraint:

```text
UNIQUE(operation_id)
```

This is the primary server-side idempotency mechanism for offline operations.

## 31.2 Sync Status

Recommended:

- pending
- processing
- synced
- failed
- conflict
- rejected

---

# 32. Audit Logs

## 32.1 audit_logs

```text
id
tenant_id nullable
branch_id nullable
user_id nullable
device_id nullable
action
entity_type
entity_id nullable
before_state JSONB nullable
after_state JSONB nullable
metadata JSONB nullable
created_at
```

Audit logs should be append-oriented.

They should not be editable through normal application workflows.

---

# 33. Suggested Core Status Enums

Application-level enums should be defined centrally.

Examples:

```text
TenantStatus
BranchStatus
MembershipStatus
StaffStatus
OrderStatus
OrderItemStatus
KitchenStatus
PaymentStatus
RefundStatus
InventoryMovementType
InventoryStatus
ReportRunStatus
JobStatus
SyncStatus
NotificationStatus
```

PostgreSQL enum vs validated VARCHAR should be selected consistently. The implementation should avoid a mixed uncontrolled approach.

---

# 34. Critical Constraints

The database must enforce, where possible:

1. Tenant foreign-key consistency.
2. Branch belongs to tenant.
3. User membership belongs to tenant.
4. Branch membership belongs to tenant.
5. Order belongs to branch and tenant.
6. Order item belongs to the same order/tenant.
7. Payment belongs to same order/tenant.
8. Inventory movement belongs to same branch/tenant.
9. Recipe belongs to same tenant as menu item.
10. Recipe ingredient belongs to same tenant as recipe/inventory item.
11. Transfer source/destination belong to same tenant.
12. Refund belongs to original payment/order.
13. Sync operation ID is unique.
14. Payment idempotency key is unique in its intended scope.

Where PostgreSQL cannot directly enforce a cross-table business invariant, the service transaction must enforce it.

---

# 35. Indexing Strategy

Indexes should be created around real access patterns.

Minimum expected indexes:

### Tenant/Branch

```text
tenant_id
(tenant_id, branch_id)
```

### Orders

```text
(tenant_id, branch_id, created_at)
(tenant_id, branch_id, status)
(tenant_id, branch_id, table_id)
(tenant_id, branch_id, waiter_staff_id)
```

### Order Items

```text
(order_id)
(menu_item_id)
```

### Payments

```text
(order_id)
(tenant_id, branch_id, created_at)
(idempotency_key)
```

### Inventory

```text
(tenant_id, branch_id, inventory_item_id)
(inventory_item_id, created_at)
(expiry_date)
```

### Reports

Indexes should follow actual report query patterns and be added after query analysis.

Do not index every column by default.

---

# 36. Transaction Boundaries

Critical business operations should use database transactions.

Examples:

## Successful Cash Payment

```text
BEGIN
  validate order
  validate payment
  create payment
  update order paid amount/status
  create receipt
  create audit event
COMMIT
```

## Recipe Consumption

```text
BEGIN
  validate order event
  check idempotency
  create recipe consumption
  create inventory movements
  update branch stock
  create audit event
COMMIT
```

## Inventory Transfer

```text
BEGIN
  validate source stock
  create transfer
  create transfer-out
  create transfer-in
  update source/destination stock
  audit
COMMIT
```

If any critical step fails, the transaction must roll back.

---

# 37. Soft Deactivation

Use active/inactive states instead of physical deletion for entities with historical dependencies.

Examples:

- Staff.
- Branches.
- Menu items.
- Categories.
- Inventory items.
- Vendors.
- Roles.
- Cancellation reasons.

Hard deletion should be restricted to data that is genuinely safe to remove and is not part of business history.

---

# 38. Reporting Data Integrity

Reports should derive from authoritative transactional records.

For financial reports:

```text
Orders + Order Items + Payments + Refunds
```

For inventory reports:

```text
Inventory Movements + Current Branch Stock
```

For recipe profitability:

```text
Orders + Recipe Definitions + Inventory Costs
```

For staff performance:

```text
Historical Order Attribution + Order Items + Sales
```

Reports must not rely on manually maintained counters as the only source of truth.

---

# 39. Migration Strategy

Alembic is the schema migration authority.

Rules:

1. Every schema change gets a migration.
2. Production migrations are version-controlled.
3. Destructive changes require explicit review.
4. Large data migrations should be planned separately.
5. Backward-compatible migrations are preferred.
6. Rollback/recovery strategy must be considered before production deployment.

---

# 40. Future Scaling

The initial database remains a shared PostgreSQL schema.

If a future exceptional tenant requires isolation beyond the shared model, the architecture should allow a migration toward:

- Dedicated schema.
- Dedicated database.
- Dedicated infrastructure.

This is a future scaling option, not an MVP requirement.

---

# 41. Database Definition of Done

Database implementation is complete for a feature when:

- Tables exist.
- Foreign keys exist.
- Tenant/branch scope is correct.
- Constraints exist.
- Required indexes exist.
- SQLAlchemy models exist.
- Alembic migration exists.
- Service transaction boundaries are defined.
- Authorization scope is verified.
- Historical data behavior is defined.
- Audit requirements are implemented.
- Relevant tests exist.

---

# 42. Final Entity Map

```text
AUTH
├── users
├── tenants
├── branches
├── user_tenant_memberships
├── user_branch_memberships
├── roles
├── permissions
├── role_permissions
├── user_roles
└── staff_profiles

CONFIGURATION
├── tenant_settings
└── branch_settings

MENU
├── menu_categories
├── menu_items
└── branch_menu_items

TABLES
├── table_areas
└── restaurant_tables

ORDERS
├── orders
├── order_items
├── cancellation_reasons
└── order_events

KITCHEN
├── kitchen_tickets
├── kitchen_ticket_items
└── kitchen_events

POS
├── bills
├── payments
├── refunds
└── receipts

CUSTOMERS
└── customers

INVENTORY
├── inventory_categories
├── units
├── inventory_items
├── branch_inventory_items
├── inventory_batches
├── inventory_movements
├── stock_counts
├── stock_count_items
├── inventory_transfers
└── inventory_transfer_items

RECIPES
├── recipes
├── recipe_ingredients
└── recipe_consumptions

VENDORS
├── vendors
├── vendor_items
├── vendor_visits
└── vendor_reminders

REPORTING
├── report_definitions
├── report_schedules
└── report_runs

SYSTEM
├── files
├── notifications
├── devices
├── sessions
├── sync_operations
└── audit_logs
```

---

# 43. Next Specification

After this schema blueprint, the next implementation document should define:

1. REST API contract.
2. Endpoint authorization.
3. Request/response schemas.
4. Error format.
5. Idempotency rules.
6. WebSocket event contract.
7. Permission matrix.
8. Frontend route/component map.
9. Offline operation contract.

The API contract should use this schema as its data foundation.
