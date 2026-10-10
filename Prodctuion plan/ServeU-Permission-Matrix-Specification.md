# ServeU Permission Matrix Specification

**Document:** ServeU Permission Matrix  
**Version:** 1.0 Draft  
**Scope:** Tenant, Branch, Role, Approval and Action Authorization  
**Status:** Implementation Blueprint

---

## 1. Purpose

This document defines what each ServeU role can do, where they can do it, and which actions require additional approval.

ServeU authorization has three layers:

```text
Identity
  ↓
Tenant Membership
  ↓
Branch Scope
  ↓
Role / Permission
  ↓
Action
```

A user having a role does **not** automatically grant access to every branch.

The backend is always the final authorization authority.

---

# 2. Core Roles

ServeU uses these primary roles:

| Role | Purpose |
|---|---|
| Platform Admin | Platform-level administration |
| Owner | Full restaurant/business ownership |
| Manager | Daily operational management |
| Cashier | Billing, payments and checkout |
| Waiter | Tables and customer orders |
| Kitchen Staff | Kitchen/KDS operations |

Custom tenant roles are supported.

---

# 3. Scope Model

Permissions are evaluated against:

```text
Tenant Scope
+
Branch Scope
+
Permission
+
Resource State
+
Approval Requirement
```

Example:

A Cashier may have:

```text
payments.create
```

but only for branches assigned to that cashier.

A Manager may have:

```text
orders.cancel_after_prep
```

but the system may still require an approval workflow depending on the financial effect.

---

# 4. Scope Types

## Tenant-Wide

Applies across the authorized restaurant/business.

Examples:

- Global settings.
- Roles.
- Tenant-level cancellation reasons.
- Consolidated reports.

## Branch-Specific

Applies only to assigned branches.

Examples:

- Tables.
- Orders.
- Kitchen.
- Branch inventory.
- Branch sales reports.

## Own-Action

A permission may be restricted to records created/assigned to the current staff member.

Example:

A waiter may edit their own draft order while it is editable.

## Managed Scope

Manager/Owner can access operational records for authorized branches.

---

# 5. Permission Naming Convention

Permissions follow:

```text
domain.action
```

Examples:

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

Where additional specificity is needed:

```text
orders.cancel_after_prep
refunds.approve
staff.manage
roles.manage
```

---

# 6. Platform Admin

Platform Admin operates at platform level.

## Allowed

- Manage platform tenants.
- View platform-level tenant metadata.
- Manage platform configuration.
- Manage platform operational administration.
- Access platform health/administration tools.
- Handle platform-level support workflows where explicitly authorized.

## Not automatically allowed

Platform Admin should not silently bypass restaurant business authorization for normal operational actions.

Access to tenant business data must be explicit, audited and support the principle of least privilege.

---

# 7. Owner

Owner has the highest normal restaurant-level authority.

## Tenant Management

| Action | Owner |
|---|---:|
| View tenant | ✅ |
| Edit tenant | ✅ |
| Create branch | ✅ |
| Edit branch | ✅ |
| Deactivate branch | ✅ |
| View all authorized branches | ✅ |
| Consolidated reporting | ✅ |

## Staff

| Action | Owner |
|---|---:|
| View staff | ✅ |
| Invite staff | ✅ |
| Edit staff | ✅ |
| Disable staff | ✅ |
| Assign branch access | ✅ |
| Manage roles | ✅ |
| Manage permissions/custom roles | ✅ |

## Menu

| Action | Owner |
|---|---:|
| View menu | ✅ |
| Create category | ✅ |
| Edit category | ✅ |
| Create menu item | ✅ |
| Edit menu item | ✅ |
| Change price | ✅ |
| Configure branch availability | ✅ |

## Orders

| Action | Owner |
|---|---:|
| View orders | ✅ |
| Create order | ✅ |
| Edit order | ✅ |
| Send to kitchen | ✅ |
| Cancel item | ✅ |
| Handle cancellation escalation | ✅ |
| View order history | ✅ |

## Payments

| Action | Owner |
|---|---:|
| View payments | ✅ |
| Create payment | ✅ |
| Split/partial payment | ✅ |
| Refund | ✅ |
| Approve refund | ✅ |
| View payment history | ✅ |

## Inventory

| Action | Owner |
|---|---:|
| View inventory | ✅ |
| Receive stock | ✅ |
| Adjust stock | ✅ |
| Waste stock | ✅ |
| Stock count | ✅ |
| Transfer stock | ✅ |
| Manage inventory settings | ✅ |

## Recipes

| Action | Owner |
|---|---:|
| View recipes | ✅ |
| Create recipe | ✅ |
| Edit recipe | ✅ |
| View recipe cost | ✅ |
| View profitability | ✅ |

## Reports

| Action | Owner |
|---|---:|
| View reports | ✅ |
| Custom reports | ✅ |
| Export reports | ✅ |
| Schedule reports | ✅ |
| Consolidated branch reports | ✅ |

## Settings

| Action | Owner |
|---|---:|
| Restaurant settings | ✅ |
| Branch settings | ✅ |
| Payment settings | ✅ |
| Receipt settings | ✅ |
| Kitchen settings | ✅ |
| Inventory settings | ✅ |
| Notification settings | ✅ |
| Cancellation reasons | ✅ |

---

# 8. Manager

Manager handles normal operational management.

## Allowed

| Area | Manager |
|---|---:|
| View branch operations | ✅ |
| Manage tables | ✅ |
| Manage orders | ✅ |
| Send orders to kitchen | ✅ |
| Cancel orders/items | ✅ |
| Handle operational cancellation approvals | ✅ |
| Payments | ✅ |
| Refunds | Configurable |
| Inventory view | ✅ |
| Inventory adjustments | Configurable |
| Stock counts | ✅ |
| Recipes | View / configurable edit |
| Vendors | ✅ |
| Reports | ✅ |
| Staff operational management | ✅ |
| Settings | Limited |

Manager should not automatically have:

- Ownership transfer.
- Platform administration.
- Role/permission administration unless explicitly granted.
- Sensitive tenant-level security configuration.

---

# 9. Cashier

Cashier focuses on checkout and sales operations.

## Allowed

| Action | Cashier |
|---|---:|
| View assigned branch orders | ✅ |
| Create order | Configurable |
| Edit order before lock | Configurable |
| Bill Review | ✅ |
| Cash payment | ✅ |
| Card/manual payment | ✅ |
| Split payment | ✅ |
| Partial payment | ✅ |
| Receipt generation | ✅ |
| Print/share receipt | ✅ |
| View payment history | Configurable |
| Refund | ❌ by default |
| Refund with manager approval | Request only |
| Inventory adjustment | ❌ |
| Role management | ❌ |
| Tenant settings | ❌ |
| Staff permissions | ❌ |

Cashier may initiate a refund request if the workflow permits it, but approval remains with an authorized role.

---

# 10. Waiter

Waiter focuses on tables and orders.

## Allowed

| Action | Waiter |
|---|---:|
| View assigned branch tables | ✅ |
| View table status | ✅ |
| Open table order | ✅ |
| Create order | ✅ |
| Add items | ✅ |
| Edit editable items | ✅ |
| Send to kitchen | ✅ |
| Add later items | ✅ |
| Request/carry out permitted cancellation | Configurable |
| View kitchen status | ✅ |
| Mark service-related status | Configurable |
| Bill Review | View / configurable |
| Take payment | ❌ by default |
| Refund | ❌ |
| Inventory adjustment | ❌ |
| Reports | Limited |
| Staff management | ❌ |
| Settings | ❌ |

Waiter attribution is stored historically on orders so performance reporting remains accurate.

---

# 11. Kitchen Staff

Kitchen Staff operates the KDS.

## Allowed

| Action | Kitchen Staff |
|---|---:|
| View kitchen tickets | ✅ |
| Acknowledge ticket | ✅ |
| Start preparation | ✅ |
| Mark ready | ✅ |
| Complete kitchen task | ✅ |
| Acknowledge cancellation update | ✅ |
| View order item details needed for preparation | ✅ |
| Edit customer order | ❌ |
| Take payment | ❌ |
| Refund | ❌ |
| Inventory adjustment | ❌ by default |
| Staff management | ❌ |
| Tenant settings | ❌ |

Kitchen staff may see only the data required for kitchen operations.

---

# 12. Order Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| orders.view | ✅ | ✅ | ✅ | ✅ | Limited |
| orders.create | ✅ | ✅ | Config | ✅ | ❌ |
| orders.edit | ✅ | ✅ | Config | ✅* | ❌ |
| orders.send_to_kitchen | ✅ | ✅ | Config | ✅ | ❌ |
| orders.add_items_after_send | ✅ | ✅ | Config | ✅ | ❌ |
| orders.cancel | ✅ | ✅ | Config | Config | ❌ |
| orders.cancel_after_prep | ✅ | Config | ❌ | Config | ❌ |
| orders.view_history | ✅ | ✅ | Config | Own/assigned | Limited |
| orders.close | ✅ | ✅ | ✅ | ❌ | ❌ |

`*` Waiter editing is subject to order state.

---

# 13. Kitchen Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| kitchen.view | ✅ | ✅ | Limited | Limited | ✅ |
| kitchen.acknowledge | ✅ | ✅ | ❌ | ❌ | ✅ |
| kitchen.start | ✅ | ✅ | ❌ | ❌ | ✅ |
| kitchen.ready | ✅ | ✅ | ❌ | ❌ | ✅ |
| kitchen.complete | ✅ | ✅ | ❌ | ❌ | ✅ |
| kitchen.cancel_acknowledge | ✅ | ✅ | ❌ | ❌ | ✅ |

---

# 14. Payment Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| payments.view | ✅ | ✅ | ✅ | Limited | ❌ |
| payments.create | ✅ | ✅ | ✅ | ❌* | ❌ |
| payments.split | ✅ | ✅ | ✅ | ❌ |
| payments.partial | ✅ | ✅ | ✅ | ❌ |
| payments.refund_request | ✅ | ✅ | Config | ❌ | ❌ |
| refunds.approve | ✅ | Config | ❌ | ❌ | ❌ |
| refunds.process | ✅ | Config | Config | ❌ | ❌ |

`*` Waiter can be granted payment collection in a custom role, but it is not the default role behavior.

---

# 15. Inventory Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| inventory.view | ✅ | ✅ | ❌ | ❌ | Limited |
| inventory.receive | ✅ | Config | ❌ | ❌ | ❌ |
| inventory.adjust | ✅ | Config | ❌ | ❌ | ❌ |
| inventory.waste | ✅ | Config | ❌ | ❌ | Config |
| inventory.stock_count | ✅ | ✅ | ❌ | ❌ | Config |
| inventory.transfer | ✅ | Config | ❌ | ❌ | ❌ |
| inventory.view_movements | ✅ | ✅ | ❌ | ❌ | Limited |
| inventory.manage_items | ✅ | Config | ❌ | ❌ | ❌ |

Kitchen may receive limited inventory visibility where operationally useful, without granting stock-adjustment authority.

---

# 16. Recipe Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| recipes.view | ✅ | ✅ | ❌ | ❌ | Limited |
| recipes.create | ✅ | Config | ❌ | ❌ | ❌ |
| recipes.edit | ✅ | Config | ❌ | ❌ | ❌ |
| recipes.cost_view | ✅ | ✅ | ❌ | ❌ | ❌ |
| recipes.profitability_view | ✅ | ✅ | ❌ | ❌ | ❌ |

---

# 17. Reports Permission Matrix

| Report | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| Sales | ✅ | ✅ | Limited | Limited | ❌ |
| Product/Menu | ✅ | ✅ | Limited | Limited | ❌ |
| Staff performance | ✅ | ✅ | ❌ | Own/limited | ❌ |
| Inventory | ✅ | ✅ | ❌ | ❌ | Limited |
| Recipe profitability | ✅ | ✅ | ❌ | ❌ | ❌ |
| Vendor | ✅ | ✅ | ❌ | ❌ | ❌ |
| Custom reports | ✅ | Config | ❌ | ❌ | ❌ |
| Export | ✅ | Config | Config | ❌ | ❌ |
| Schedule reports | ✅ | Config | ❌ | ❌ | ❌ |
| Consolidated branches | ✅ | Config | ❌ | ❌ | ❌ |

---

# 18. Staff Management

| Action | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| staff.view | ✅ | ✅ | Limited | ❌ | ❌ |
| staff.invite | ✅ | Config | ❌ | ❌ | ❌ |
| staff.edit | ✅ | Config | ❌ | ❌ | ❌ |
| staff.disable | ✅ | Config | ❌ | ❌ | ❌ |
| staff.branch_access | ✅ | Config | ❌ | ❌ | ❌ |
| staff.role_assign | ✅ | Config | ❌ | ❌ | ❌ |

---

# 19. Role Management

By default:

| Action | Owner | Manager | Others |
|---|---:|---:|---:|
| roles.view | ✅ | Config | ❌ |
| roles.create | ✅ | Config | ❌ |
| roles.edit | ✅ | Config | ❌ |
| roles.permissions | ✅ | Config | ❌ |

Ownership-level security controls should remain protected from accidental removal.

---

# 20. Settings Permissions

| Settings | Owner | Manager | Cashier | Waiter | Kitchen |
|---|---:|---:|---:|---:|---:|
| Tenant settings | ✅ | Limited | ❌ | ❌ | ❌ |
| Branch settings | ✅ | Config | ❌ | ❌ | ❌ |
| Menu settings | ✅ | Config | ❌ | ❌ | ❌ |
| Payment settings | ✅ | Config | ❌ | ❌ | ❌ |
| Receipt settings | ✅ | Config | ❌ | ❌ | ❌ |
| Kitchen settings | ✅ | Config | ❌ | ❌ | Limited |
| Inventory settings | ✅ | Config | ❌ | ❌ | ❌ |
| Cancellation reasons | ✅ | Config | ❌ | ❌ | ❌ |
| Roles/permissions | ✅ | Config | ❌ | ❌ | ❌ |

---

# 21. Cancellation Authorization

Cancellation behavior depends on item preparation state.

## Before Preparation

If policy allows:

```text
Authorized staff
    ↓
Cancel item
    ↓
Kitchen update if already dispatched
    ↓
Billing amount removed
```

## During Preparation

Core rule:

```text
Cancellation requested
    ↓
Kitchen cancellation update
    ↓
Kitchen acknowledgement
    ↓
Billing amount removed
```

## After Preparation

```text
Cancellation requested
    ↓
Approval workflow
    ↓
Manager/authorized approver
    ↓
Billing adjustment
```

If an authorized approver rejects the financial adjustment, escalation goes to the owner or owner-authorized senior user.

---

# 22. Approval Authority

Default hierarchy:

```text
Waiter/Cashier
    ↓
Manager
    ↓
Owner / Owner-authorized senior user
```

The exact permission is what matters, not only the person's job title.

An owner-authorized senior custom role may receive explicit approval permission.

There should be no hidden monetary limit in the core MVP unless the tenant explicitly configures one later.

---

# 23. Refund Authorization

Recommended default:

```text
Cashier
  ↓
May initiate refund request

Manager
  ↓
May approve configured refund

Owner
  ↓
Final authority
```

The system should support configurable permission assignment for different businesses.

Refunds must always contain:

- Original payment.
- Amount.
- Reason.
- Requesting user.
- Approving user where applicable.
- Timestamp.
- Audit record.

---

# 24. Sensitive Actions Requiring Audit

At minimum:

- Login/security events.
- Staff invitation.
- Staff disable.
- Role changes.
- Permission changes.
- Branch access changes.
- Tenant settings changes.
- Payment creation.
- Payment failure.
- Refund request.
- Refund approval.
- Refund processing.
- Order cancellation.
- Post-preparation cancellation approval.
- Inventory adjustment.
- Inventory transfer.
- Stock count completion.
- Recipe changes affecting costing.
- Scheduled report creation/change.
- Device revoke.
- Offline sync rejection/conflict.

---

# 25. Branch Authorization

A user can operate only within assigned branches unless they have tenant-wide authority.

Example:

```text
User
 ├── Tenant A
 │    ├── Branch 1
 │    └── Branch 2
 │
 └── Tenant B
      └── Branch 3
```

If currently operating in Branch 1:

- Branch 1 data → allowed.
- Branch 2 data → allowed only if the user has Branch 2 access and the action supports cross-branch scope.
- Branch 3 → denied unless the user switches to Tenant B and has access there.

The frontend branch selector is not a security mechanism.

---

# 26. Cross-Branch Reporting

Owner may view:

```text
Branch A
Branch B
Branch C
Combined
```

Manager access depends on assigned permissions.

Cashier/Waiter/Kitchen normally remain branch-scoped.

---

# 27. Tenant Isolation

Every protected query must effectively enforce:

```text
WHERE tenant_id = authorized_tenant_id
```

and, where applicable:

```text
AND branch_id IN authorized_branch_ids
```

The application must never rely only on frontend filtering.

PostgreSQL Row-Level Security may additionally be evaluated for defense-in-depth on appropriate tables.

---

# 28. Custom Roles

Owners may create custom roles.

Example:

```text
Senior Cashier
```

with:

```text
payments.create
payments.split
reports.sales.view
refunds.request
```

Custom roles must use existing permission keys.

Custom permissions should not be arbitrary client-defined executable logic.

---

# 29. Permission Evaluation

Recommended server-side sequence:

```text
1. Authenticate user
2. Resolve tenant membership
3. Resolve branch scope
4. Resolve role assignments
5. Resolve permission keys
6. Check resource ownership/scope
7. Check current resource state
8. Check approval requirement
9. Execute transaction
10. Audit sensitive action
```

---

# 30. Denied Access Behavior

The API returns:

```text
401
```

when authentication is missing/invalid.

The API returns:

```text
403
```

when the authenticated user lacks required permission.

For resources outside the user's tenant/scope, the implementation may return:

```text
404
```

to avoid leaking resource existence.

---

# 31. UI Behavior

The frontend should hide or disable actions the user cannot perform.

However:

> UI restrictions are for user experience, not security.

Every action must still be authorized by the backend.

Example:

A Waiter should not see:

```text
Refund
Manage Roles
Inventory Adjustment
```

but if the frontend is manipulated manually, the API must still reject unauthorized requests.

---

# 32. Approval UX

When approval is required, the UI should clearly explain:

```text
Why approval is required
Who can approve
What financial effect is pending
Current status
```

Example:

```text
Cancellation requires manager approval because
the item has already entered preparation.
```

---

# 33. Permission Matrix Definition of Done

Authorization is complete when:

- Every protected endpoint has a permission.
- Every permission has a role mapping.
- Tenant scope is defined.
- Branch scope is defined.
- Approval rules are defined.
- Sensitive actions are audited.
- Unauthorized API calls are tested.
- Cross-tenant access tests pass.
- Cross-branch access tests pass.
- UI visibility matches permissions.
- Backend remains authoritative.

---

# 34. Next Specification

The next major document should define the **Frontend Route + UI Component + Responsive Design System**.

It should cover:

1. Application shell.
2. Dashboard.
3. Branch selector.
4. POS/order screens.
5. Kitchen/KDS.
6. Inventory.
7. Recipes.
8. Reports.
9. Staff.
10. Settings.
11. Mobile responsive behavior.
12. Tablet behavior.
13. Desktop/large-screen behavior.
14. Image and card sizing.
15. Typography and text wrapping.
16. PWA/Android/Windows behavior.
17. Accessibility.
18. Design tokens.

The UI specification should explicitly use responsive layouts rather than fixed screen dimensions so the same UI adapts across phone, tablet, laptop and large desktop displays.
