# ServeU API Contract Specification

**Document:** ServeU API Contract Specification  
**Version:** 1.0 Draft  
**Base Path:** `/api/v1`  
**Backend:** FastAPI  
**Authentication:** Firebase ID Token + ServeU authorization  
**Database:** PostgreSQL  
**Status:** Implementation Blueprint

---

## 1. Purpose

This document defines the external API contract between ServeU clients and the FastAPI backend.

Clients include:

- Web/PWA.
- Android/Capacitor.
- Windows/Tauri.
- Future supported clients.

The API is the only normal business-data boundary between clients and PostgreSQL.

```text
Client
  ↓
FastAPI
  ↓
Authentication
  ↓
Tenant/Branch Authorization
  ↓
Service / Domain Logic
  ↓
SQLAlchemy
  ↓
PostgreSQL
```

---

# 2. API Principles

1. REST is the primary business API.
2. WebSocket is used for authorized real-time events.
3. Every protected request is authenticated.
4. Tenant/branch access is determined server-side.
5. Client-provided tenant IDs are never trusted as authorization.
6. Business rules are enforced on the server.
7. Financial mutations are transactional and idempotent.
8. Request and response schemas are versioned.
9. API errors use a consistent format.
10. Pagination is used for potentially large collections.
11. Sensitive operations are audited.
12. Offline synchronization uses explicit idempotency and operation records.

---

# 3. Authentication

Clients authenticate with Firebase Authentication.

The client sends:

```http
Authorization: Bearer <firebase_id_token>
```

The backend:

1. Validates the Firebase token.
2. Resolves the ServeU user.
3. Resolves tenant membership.
4. Resolves branch access.
5. Evaluates permissions.
6. Executes the request.

Authentication answers:

> Who is the user?

ServeU authorization answers:

> What can this user do, and where?

---

# 4. Request Context

Every protected request should internally resolve a context similar to:

```text
user_id
tenant_id
authorized_branch_ids
role_ids
permission_keys
device_id
request_id
```

The client may request a specific branch, but the backend must verify membership.

---

# 5. Standard Headers

Recommended:

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <uuid>
Idempotency-Key: <uuid>
X-Device-ID: <device-id>
```

Not every endpoint requires every header.

`Idempotency-Key` is required for applicable financial and offline mutation operations.

---

# 6. Standard Response Envelope

Successful single resource:

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid"
  }
}
```

Collection:

```json
{
  "data": [],
  "meta": {
    "request_id": "uuid",
    "pagination": {
      "page": 1,
      "page_size": 25,
      "total": 100
    }
  }
}
```

The implementation may use cursor pagination for very large datasets.

---

# 7. Standard Error Format

Example:

```json
{
  "error": {
    "code": "ORDER_NOT_EDITABLE",
    "message": "This order can no longer be edited.",
    "details": {},
    "request_id": "uuid"
  }
}
```

The client must use stable error codes rather than parsing human-readable messages.

---

# 8. HTTP Status Rules

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 202 | Accepted for asynchronous processing |
| 204 | Successful operation with no response body |
| 400 | Invalid request |
| 401 | Authentication required/invalid |
| 403 | Authenticated but not authorized |
| 404 | Resource not available in authorized scope |
| 409 | Conflict |
| 422 | Validation failure |
| 429 | Rate limit |
| 500 | Unexpected server error |
| 503 | Temporary service unavailable |

For tenant isolation, the API should avoid revealing whether an unauthorized resource exists.

---

# 9. API Modules

Primary API groups:

```text
/auth
/tenants
/branches
/users
/staff
/roles
/permissions
/menu
/tables
/orders
/kitchen
/bills
/payments
/refunds
/receipts
/customers
/inventory
/recipes
/vendors
/reports
/notifications
/files
/devices
/sync
/settings
/audit
```

---

# 10. Authentication and Current User

## GET `/auth/me`

Returns current authenticated ServeU identity and authorized context.

Response includes:

```text
user
memberships
available tenants
available branches
roles
permissions
```

## GET `/auth/tenants`

Returns tenants available to the current user.

## GET `/auth/tenants/{tenant_id}/context`

Returns authorized tenant context and accessible branches.

---

# 11. Tenant API

## POST `/tenants`

Creates a restaurant/tenant.

Permission:

```text
authenticated onboarding user
```

Request:

```json
{
  "name": "Example Restaurant",
  "country_code": "PK",
  "currency_code": "PKR",
  "timezone": "Asia/Karachi"
}
```

Server creates:

- Tenant.
- Initial owner membership.
- Required default roles/configuration.

## GET `/tenants/{tenant_id}`

Requires tenant membership.

## PATCH `/tenants/{tenant_id}`

Requires:

```text
settings.manage
```

---

# 12. Branch API

## GET `/tenants/{tenant_id}/branches`

Lists authorized branches.

## POST `/tenants/{tenant_id}/branches`

Creates branch.

## GET `/branches/{branch_id}`

Returns branch details if authorized.

## PATCH `/branches/{branch_id}`

Updates branch.

## POST `/branches/{branch_id}/deactivate`

Deactivates branch.

Historical data remains available according to authorization.

---

# 13. Staff and User API

## GET `/tenants/{tenant_id}/staff`

Filters:

```text
branch_id
status
role
search
```

## POST `/tenants/{tenant_id}/staff/invitations`

Creates staff invitation.

## POST `/staff/{staff_id}/disable`

Disables staff access.

## PATCH `/staff/{staff_id}`

Updates staff operational information.

## GET `/staff/{staff_id}`

Returns staff profile and authorized branch/role information.

---

# 14. Role and Permission API

## GET `/tenants/{tenant_id}/roles`

## POST `/tenants/{tenant_id}/roles`

## PATCH `/roles/{role_id}`

## POST `/roles/{role_id}/permissions`

Requires:

```text
roles.manage
```

Permission changes must be audited.

---

# 15. Menu API

## GET `/branches/{branch_id}/menu/categories`

## POST `/tenants/{tenant_id}/menu/categories`

## PATCH `/menu/categories/{category_id}`

## GET `/branches/{branch_id}/menu/items`

Filters:

```text
category_id
status
search
```

## POST `/tenants/{tenant_id}/menu/items`

## GET `/menu/items/{item_id}`

## PATCH `/menu/items/{item_id}`

## POST `/branches/{branch_id}/menu/items/{item_id}/availability`

Controls branch availability.

Menu item price changes must not alter historical order item snapshots.

---

# 16. Table API

## GET `/branches/{branch_id}/areas`

## POST `/branches/{branch_id}/areas`

## GET `/branches/{branch_id}/tables`

## POST `/branches/{branch_id}/tables`

## PATCH `/tables/{table_id}`

## POST `/tables/{table_id}/status`

Status:

```text
available
occupied
reserved
cleaning
out_of_service
```

## POST `/tables/{table_id}/move`

Moves active table/order context where authorized.

## POST `/tables/{table_id}/merge`

Merges table/order context where supported.

---

# 17. Order API

Orders are the primary restaurant workflow.

## GET `/branches/{branch_id}/orders`

Filters:

```text
status
table_id
waiter_staff_id
date_from
date_to
search
```

## POST `/branches/{branch_id}/orders`

Creates order.

Request:

```json
{
  "table_id": "uuid",
  "waiter_staff_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2
    }
  ]
}
```

Server calculates trusted totals.

## GET `/orders/{order_id}`

Returns:

- Order.
- Items.
- Table.
- Waiter.
- Kitchen status.
- Payment summary.
- Cancellation state.

## PATCH `/orders/{order_id}`

Allowed only while order is editable.

## POST `/orders/{order_id}/items`

Adds item(s).

## PATCH `/orders/{order_id}/items/{order_item_id}`

Updates editable item.

## DELETE `/orders/{order_id}/items/{order_item_id}`

Removes an item before the relevant workflow state.

---

# 18. Send to Kitchen

## POST `/orders/{order_id}/send-to-kitchen`

Creates the initial kitchen update.

Idempotency is required.

Response:

```json
{
  "data": {
    "order_id": "uuid",
    "kitchen_ticket_id": "uuid",
    "status": "sent_to_kitchen"
  }
}
```

---

# 19. Additional Kitchen Updates

If new items are added after initial kitchen dispatch:

## POST `/orders/{order_id}/kitchen-updates`

Creates a separate kitchen update.

This prevents the original kitchen ticket from being silently rewritten.

---

# 20. Order Cancellation

## POST `/orders/{order_id}/items/{order_item_id}/cancel`

Request:

```json
{
  "reason_id": "uuid",
  "note": "Customer changed order"
}
```

Server evaluates:

- Permission.
- Current item state.
- Preparation state.
- Billing effect.
- Approval requirement.

If kitchen acknowledgement is required, the API creates a cancellation update rather than silently completing the process.

---

# 21. Cancellation Approval

## POST `/order-item-cancellations/{cancellation_id}/approve`

Requires the applicable manager/authorized approval permission.

## POST `/order-item-cancellations/{cancellation_id}/reject`

Rejected financial adjustment escalates according to configured authorization.

---

# 22. Order Status

## POST `/orders/{order_id}/status`

Used only for valid state transitions.

The server owns the state machine.

The client cannot arbitrarily set:

```text
paid
closed
ready
```

without satisfying required business rules.

---

# 23. Kitchen API

## GET `/branches/{branch_id}/kitchen/tickets`

Filters:

```text
status
station
date
```

## GET `/kitchen/tickets/{ticket_id}`

## POST `/kitchen/tickets/{ticket_id}/acknowledge`

## POST `/kitchen/tickets/{ticket_id}/start`

## POST `/kitchen/tickets/{ticket_id}/ready`

## POST `/kitchen/tickets/{ticket_id}/complete`

## POST `/kitchen/cancellation-updates/{update_id}/acknowledge`

Kitchen endpoints must be restricted to authorized kitchen/management roles.

---

# 24. Bill Review API

## GET `/orders/{order_id}/bill-review`

Returns calculated billing preview.

The server recalculates:

- Subtotal.
- Discounts.
- Taxes.
- Service charges.
- Total.
- Paid amount.
- Remaining amount.

## POST `/orders/{order_id}/bill-review/confirm`

Records the Bill Review confirmation before payment.

The client must not be allowed to modify trusted totals directly.

---

# 25. Payment API

## GET `/orders/{order_id}/payments`

Returns payment history.

## POST `/orders/{order_id}/payments`

Creates a payment.

Cash request example:

```json
{
  "method": "cash",
  "amount_minor": 500000,
  "received_minor": 600000,
  "currency_code": "PKR"
}
```

Server calculates/validates change.

Payment operation requires:

```http
Idempotency-Key: uuid
```

A duplicate idempotency key must return the original result rather than creating another payment.

---

# 26. Split/Partial Payment API

The same payment endpoint may support partial payments.

Example:

```json
{
  "method": "cash",
  "amount_minor": 250000,
  "currency_code": "PKR"
}
```

The server updates:

```text
paid_minor
remaining_minor
payment_status
```

Order closes only when the remaining balance reaches zero and all closure conditions are satisfied.

---

# 27. Refund API

## POST `/orders/{order_id}/refunds`

Request:

```json
{
  "payment_id": "uuid",
  "amount_minor": 100000,
  "reason": "Customer refund"
}
```

Requires appropriate permission.

If approval is required:

```text
requested → approved → processed
```

A refund must reference its original payment.

---

# 28. Receipt API

## GET `/orders/{order_id}/receipt`

Returns receipt data.

## POST `/orders/{order_id}/receipts`

Generates a receipt record.

The receipt can be returned for:

- Print.
- Digital.
- Share.

Receipt generation should be idempotent for the same transaction context.

---

# 29. Customer API

Later release:

## GET `/tenants/{tenant_id}/customers`

## POST `/tenants/{tenant_id}/customers`

## GET `/customers/{customer_id}`

## PATCH `/customers/{customer_id}`

## GET `/customers/{customer_id}/orders`

---

# 30. Inventory API

## GET `/branches/{branch_id}/inventory/items`

Filters:

```text
category_id
status
search
low_stock
near_expiry
expired
```

## POST `/tenants/{tenant_id}/inventory/items`

## PATCH `/inventory/items/{item_id}`

## GET `/inventory/items/{item_id}/stock`

Returns branch stock and relevant batches.

---

# 31. Inventory Movement API

## GET `/branches/{branch_id}/inventory/movements`

Filters:

```text
item_id
movement_type
date_from
date_to
```

## POST `/branches/{branch_id}/inventory/movements`

Used for authorized operational movements.

The backend validates the movement type and quantity.

---

# 32. Stock Count API

## POST `/branches/{branch_id}/stock-counts`

Creates stock count.

## GET `/stock-counts/{stock_count_id}`

## POST `/stock-counts/{stock_count_id}/items`

Adds/updates count values.

## POST `/stock-counts/{stock_count_id}/complete`

Completes count and creates adjustment movements transactionally.

---

# 33. Inventory Transfer API

## POST `/tenants/{tenant_id}/inventory-transfers`

Creates transfer.

## GET `/branches/{branch_id}/inventory-transfers`

## POST `/inventory-transfers/{transfer_id}/complete`

Completion must verify:

- source branch authorization.
- destination branch authorization.
- stock availability.
- item validity.

---

# 34. Inventory Scanning API

Scanning itself is primarily a client capability.

The client resolves:

```text
barcode/scanned identifier → inventory item
```

Then calls normal inventory APIs.

## GET `/branches/{branch_id}/inventory/scan/{identifier}`

Returns matching item(s).

The backend remains the authority for the resulting stock action.

---

# 35. Recipe API

## GET `/tenants/{tenant_id}/recipes`

## POST `/tenants/{tenant_id}/recipes`

## GET `/recipes/{recipe_id}`

## PATCH `/recipes/{recipe_id}`

## POST `/recipes/{recipe_id}/ingredients`

## PATCH `/recipes/{recipe_id}/ingredients/{ingredient_id}`

Recipe changes affect future calculations, not historical transaction snapshots.

---

# 36. Recipe Analysis API

## GET `/branches/{branch_id}/reports/recipes`

Filters:

```text
date_from
date_to
menu_item_id
branch_id
```

Returns:

- Units sold.
- Ingredient consumption.
- Recipe cost.
- Sales.
- Gross profit.
- Gross margin.
- Variance where available.

---

# 37. Vendor API

## GET `/tenants/{tenant_id}/vendors`

## POST `/tenants/{tenant_id}/vendors`

## GET `/vendors/{vendor_id}`

## PATCH `/vendors/{vendor_id}`

## POST `/vendors/{vendor_id}/visits`

## POST `/vendors/{vendor_id}/reminders`

## GET `/branches/{branch_id}/vendors/reminders`

---

# 38. Staff Performance API

## GET `/branches/{branch_id}/reports/staff-performance`

Filters:

```text
date_from
date_to
staff_id
ranking
```

Ranking options:

```text
quantity
orders
sales_amount
```

The backend calculates results from historical order data.

---

# 39. Reports API

## GET `/branches/{branch_id}/reports/sales`

## GET `/branches/{branch_id}/reports/products`

## GET `/branches/{branch_id}/reports/inventory`

## GET `/branches/{branch_id}/reports/recipes`

## GET `/branches/{branch_id}/reports/vendors`

## GET `/branches/{branch_id}/reports/staff-performance`

Reports must apply the same authorization model as operational APIs.

---

# 40. Custom Report API

## GET `/tenants/{tenant_id}/report-definitions`

## POST `/tenants/{tenant_id}/report-definitions`

Example:

```json
{
  "name": "Daily Branch Sales",
  "report_type": "sales",
  "definition": {
    "columns": [
      "date",
      "branch",
      "sales",
      "orders"
    ],
    "filters": {
      "date_range": "today"
    },
    "group_by": [
      "branch"
    ],
    "sort": [
      {
        "field": "sales",
        "direction": "desc"
      }
    ]
  }
}
```

The backend validates the definition against allowed report fields.

---

# 41. Report Run API

## POST `/report-definitions/{report_definition_id}/run`

Can execute synchronously for small reports.

For heavy reports:

```text
202 Accepted
```

and create a report run.

## GET `/report-runs/{report_run_id}`

## GET `/report-runs/{report_run_id}/download`

Download authorization must be checked.

---

# 42. Scheduled Report API

## GET `/tenants/{tenant_id}/report-schedules`

## POST `/tenants/{tenant_id}/report-schedules`

## PATCH `/report-schedules/{schedule_id}`

## POST `/report-schedules/{schedule_id}/run-now`

Scheduling must be idempotent and protected against duplicate execution.

---

# 43. Notifications API

## GET `/notifications`

Filters:

```text
read
type
```

## POST `/notifications/{notification_id}/read`

## POST `/notifications/read-all`

---

# 44. Files API

Binary upload mechanism may use direct object storage upload in future.

ServeU API owns metadata and authorization.

## POST `/files`

Creates/upload metadata.

## GET `/files/{file_id}`

Returns authorized file access information.

The API must not expose another tenant's files.

---

# 45. Devices API

## GET `/users/me/devices`

## POST `/users/me/devices`

## POST `/devices/{device_id}/revoke`

Device revocation must invalidate/disable applicable session or sync authority.

---

# 46. Sync API

## POST `/sync/operations`

Accepts one or more offline operations.

Example:

```json
{
  "operations": [
    {
      "operation_id": "uuid",
      "device_id": "uuid",
      "occurred_at": "2026-10-08T12:00:00Z",
      "entity_type": "order",
      "entity_id": "uuid",
      "operation_type": "create",
      "payload": {}
    }
  ]
}
```

Server processing:

```text
Authenticate
  ↓
Authorize
  ↓
Validate
  ↓
Check operation_id
  ↓
If already processed → return prior result
  ↓
Apply transaction
  ↓
Record sync result
```

## GET `/sync/operations/{operation_id}`

Returns current synchronization result.

## POST `/sync/pull`

Returns authorized server-side changes needed by the device according to the sync protocol.

The exact cursor/version mechanism is an implementation detail to be finalized with the offline engine.

---

# 47. Audit API

Audit data is normally read-only.

## GET `/tenants/{tenant_id}/audit-logs`

Filters:

```text
branch_id
user_id
action
entity_type
date_from
date_to
```

Only authorized management users can access audit information.

---

# 48. Settings API

## GET `/tenants/{tenant_id}/settings`

## PATCH `/tenants/{tenant_id}/settings`

## GET `/branches/{branch_id}/settings`

## PATCH `/branches/{branch_id}/settings`

Sensitive settings changes must be audited.

---

# 49. Cancellation Reason API

## GET `/tenants/{tenant_id}/cancellation-reasons`

## POST `/tenants/{tenant_id}/cancellation-reasons`

## PATCH `/cancellation-reasons/{reason_id}`

Supported management operations:

- Add.
- Rename.
- Deactivate.
- Reorder.

Historical selected reasons must remain understandable.

---

# 50. WebSocket Architecture

Suggested endpoint:

```text
/ws
```

Connection authentication must use a validated authenticated context.

The client subscribes only to authorized:

```text
tenant
branch
operational channels
```

---

# 51. WebSocket Event Envelope

Example:

```json
{
  "event_id": "uuid",
  "event_type": "kitchen.ticket.created",
  "tenant_id": "uuid",
  "branch_id": "uuid",
  "occurred_at": "2026-10-08T12:00:00Z",
  "data": {}
}
```

Clients must not trust the IDs for authorization; authorization was established by the server connection/subscription.

---

# 52. Core WebSocket Events

Examples:

```text
order.created
order.updated
order.item_added
order.item_cancelled
order.status_changed

kitchen.ticket.created
kitchen.ticket.updated
kitchen.ticket.ready
kitchen.ticket.completed
kitchen.cancellation.created
kitchen.cancellation.acknowledged

table.status_changed

payment.created
payment.succeeded
payment.failed
refund.created

inventory.updated

notification.created
```

---

# 53. Realtime Reliability

WebSocket is not the authoritative transaction mechanism.

Important business mutations happen through authenticated server APIs.

If a WebSocket message is missed:

1. Client reconnects.
2. Client refetches relevant server state.
3. Client resumes realtime subscription.

This prevents realtime delivery failure from corrupting business state.

---

# 54. API Idempotency

Idempotency is mandatory for operations where duplicate execution could cause financial or operational damage.

Examples:

- Payment.
- Refund.
- Send to Kitchen.
- Offline sync.
- Recipe consumption.
- Inventory movement where submitted as an offline replay.
- Scheduled report execution.

The API should return the original result for a repeated valid idempotency key.

---

# 55. Concurrency

The backend must assume multiple devices can update the same restaurant simultaneously.

Critical workflows should use:

- Database transactions.
- Row locking where necessary.
- Optimistic versioning where appropriate.
- Idempotency.
- Explicit state transition validation.

The implementation must not rely on client-side locking.

---

# 56. Order State Machine Rules

Clients request transitions.

The server validates allowed transitions.

Example:

```text
Draft
  ↓
Confirmed
  ↓
Sent to Kitchen
  ↓
Preparing
  ↓
Ready
  ↓
Served
  ↓
Bill Review
  ↓
Payment
  ↓
Paid
  ↓
Closed
```

Invalid transitions return stable error codes.

Example:

```text
ORDER_ALREADY_CLOSED
ORDER_NOT_EDITABLE
INVALID_ORDER_TRANSITION
```

---

# 57. Payment State Rules

The client cannot directly set payment status.

Server determines:

```text
Pending
Partial
Paid
Failed
Refunded
Partially Refunded
```

A successful payment requires a valid payment record.

A paid order requires total valid successful payments to satisfy the order's payable balance.

---

# 58. Offline API Rules

Offline clients must not invent server IDs for financial authority.

Client-created operations may use UUIDs.

The server returns authoritative:

- Order IDs.
- Payment IDs.
- Receipt IDs.
- Inventory movement IDs.
- Timestamps where required.

Local IDs must be mapped safely to server records.

---

# 59. API Security

The API must implement:

- Firebase token verification.
- Tenant authorization.
- Branch authorization.
- Permission checks.
- Input validation.
- Rate limiting where appropriate.
- Secure CORS.
- HTTPS in production.
- Request IDs.
- Structured security logs.
- Audit logs.
- Protection against duplicate financial requests.

No secret credentials should be exposed to clients.

---

# 60. API Performance

The API should:

- Paginate large lists.
- Avoid N+1 database queries.
- Select only necessary data for heavy reports.
- Use indexes based on real query patterns.
- Run heavy exports asynchronously.
- Avoid blocking critical request paths.
- Use WebSocket only for realtime events rather than replacing normal REST reads.

---

# 61. API Versioning

Current:

```text
/api/v1
```

Breaking API changes require a new version.

Non-breaking additions may remain in the same version.

Clients should not depend on undocumented response fields.

---

# 62. API Testing Requirements

Each endpoint group should have:

- Authentication tests.
- Permission tests.
- Tenant isolation tests.
- Branch isolation tests.
- Validation tests.
- Success tests.
- Failure tests.
- Idempotency tests where applicable.
- Transaction rollback tests for critical operations.

Critical workflows require end-to-end API tests.

---

# 63. API Definition of Done

An API module is complete when:

- Endpoint contract is documented.
- Request schema exists.
- Response schema exists.
- Permission requirement exists.
- Tenant/branch scope exists.
- Business rules are server-side.
- Errors use stable codes.
- Audit requirements are implemented.
- Idempotency is implemented where required.
- Tests exist.
- OpenAPI documentation is generated.
- Frontend integration is verified.

---

# 64. Recommended API Build Order

```text
1. Auth / Context
2. Tenants / Branches
3. Users / Staff / Roles
4. Menu / Tables
5. Orders
6. Kitchen
7. Bill Review
8. Payments / Refunds / Receipts
9. Inventory
10. Recipes
11. Vendors
12. Reports
13. Notifications
14. Files
15. Devices
16. Offline Sync
17. Audit
18. WebSocket Realtime
```

---

# 65. Final API Architecture

```text
                    Client
                      │
              Firebase ID Token
                      │
                      ▼
                FastAPI /api/v1
                      │
          ┌───────────┴───────────┐
          │                       │
    Authentication          Request Context
                                  │
                         Tenant / Branch / RBAC
                                  │
                                  ▼
                         Domain Services
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
              PostgreSQL                    WebSocket
                   │                             │
            Source of Truth              Realtime Events
```

The REST API remains the authoritative business transaction layer.

WebSocket provides realtime delivery but does not replace transactional APIs.

---

# 66. Next Specification

After the API contract, the next documents should define:

1. Permission Matrix.
2. Frontend Route Map.
3. Frontend Component/Design System.
4. Offline Sync Protocol in implementation detail.
5. Testing/Acceptance Matrix.

The Permission Matrix is the next major security document because every API endpoint must map to a clear permission and scope.
