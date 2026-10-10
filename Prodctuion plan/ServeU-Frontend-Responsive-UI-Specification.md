# ServeU Frontend + Responsive UI + Design System Specification

**Version:** 1.0 Draft  
**Status:** Implementation blueprint  
**Product:** ServeU restaurant management platform

## 1. Purpose and principles

ServeU uses one shared frontend that adapts automatically to mobile phones, tablets, laptops, desktop monitors, large kitchen displays, Android, Windows, portrait and landscape orientations. The principle is **design once, adapt automatically**: do not build separate business logic or manually fixed screens for each device.

Principles:
- Responsive by default; usable on touch and keyboard.
- POS workflows prioritize speed and few actions.
- Kitchen screens prioritize legibility and glanceable status.
- Content drives height; avoid fixed page dimensions and absolute positioning for normal layout.
- Long text must wrap, clamp, or move into details without overlapping other content.
- Images must never be stretched or allowed to dictate layout dimensions.
- Loading, empty, error, offline, syncing, and conflict states are designed explicitly.
- Accessibility is part of each component, not a later patch.
- Core UI and business logic are shared across web, Android, and Windows.

## 2. Frontend stack and platform architecture

Locked direction:
- React + TypeScript
- Vite
- PWA for web installation and app-shell caching
- TanStack Query for server state and cache invalidation
- React Hook Form + Zod for forms and client validation
- IndexedDB + Dexie for local/offline operational data
- Capacitor for Android packaging and native adapters
- Tauri for Windows packaging and native adapters
- REST API for standard operations and WebSocket for realtime events

```text
Shared React + TypeScript application
  ├── Web / PWA
  ├── Android / Capacitor
  └── Windows / Tauri
             │
       Platform adapters
(camera, barcode, files, notifications, printing)
             │
        REST + WebSocket
             │
           FastAPI
             │
         PostgreSQL
```

Platform-specific features must be behind adapters so they do not spread platform checks throughout business components.

## 3. Brand tokens

| Token | Hex | Intended use |
|---|---|---|
| Pearl Beige | `#f4e8c1` | Backgrounds, cards, receipts |
| Ash Grey | `#a0c1b9` | Borders, muted surfaces |
| Pacific Blue | `#70a0af` | Interactive accents |
| Vintage Lavender | `#706993` | Secondary actions, charts |
| Midnight Violet | `#331e38` | Main text, headings, dark surfaces |

Centralize colors, typography, spacing, radii, shadows, breakpoints, component sizes, touch targets, animation timing, and z-index values in design tokens/CSS variables. Check every meaningful text/background pairing for WCAG AA contrast; do not assume every palette color is safe for small text on every background.

## 4. Typography and spacing

Use a controlled type scale: Display, Heading 1–3, Body Large, Body, Body Small, Caption, and Numeric/Financial. Use fluid sizing such as `clamp()` where appropriate. Keep totals, amount received, change, remaining balance, profit, and stock quantities visually prominent and numerically aligned.

Use a consistent spacing scale (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`). Prefer content-driven sizing and flexible containers. Avoid arbitrary one-off pixel values and fixed-height text boxes.

## 5. Responsive layout system

Use CSS Grid, Flexbox, fluid sizing, and container queries when component behavior depends on its own width. Recommended starting breakpoints:

| Range | Default layout intent |
|---|---|
| Under 640px | Mobile |
| 640–767px | Large mobile / small tablet |
| 768–1023px | Tablet |
| 1024–1279px | Small desktop |
| 1280–1535px | Desktop |
| 1536px+ | Large desktop |

These are layout breakpoints, not device-brand rules. Components can respond to their container rather than the entire viewport. Main content should be fluid with a maximum readable width; conceptually `width: min(100% - 2rem, 1440px)`. Never make the app depend on a specific screen resolution or aspect ratio.

## 6. Application shell and navigation

Desktop uses a top bar, persistent sidebar, and main content. Tablet can use a compact sidebar. Mobile uses a top bar, main content, and limited bottom navigation; less-used routes go into a drawer or “More” menu. Desktop and mobile navigation point to the same routes and reuse the same permission rules.

Top bar may show restaurant/workspace, current branch, connectivity/sync status, notifications, and user profile. Branch selection only lists authorized branches; the backend must still validate branch access. Navigation visibility is a usability feature, never a security boundary.

Suggested routes:

```text
/login
/onboarding
/app/dashboard
/app/pos
/app/orders
/app/kitchen
/app/tables
/app/menu
/app/inventory
/app/recipes
/app/vendors
/app/reports
/app/staff
/app/settings
```

## 7. Role-aware dashboards

- **Owner/Manager:** sales, order count, average order value, payment breakdown, branch comparison, top products, staff performance, inventory/expiry alerts, recipe profitability, operational alerts.
- **Cashier:** active orders, pending payments, checkout, recent transactions.
- **Waiter:** tables, active orders, kitchen progress, ready orders.
- **Kitchen Staff:** KDS-focused workspace rather than a generic dashboard.

Only show widgets the role is allowed to access, while enforcing all permissions on the backend.

## 8. POS and order workspace

POS is a high-frequency, high-reliability workflow. Desktop can use a menu/category panel beside the current order. Tablet can use adaptive panels or a drawer. Mobile can use categories, a menu list/grid, a sticky order summary, and a full-screen order review. The workflow must remain consistent across layouts.

Menu item cards must support long names/descriptions, different image ratios, and changing widths. Keep price and primary action visible. Descriptions may collapse on narrow screens; titles should wrap or clamp without overlap.

### Bill Review

Bill Review is mandatory before payment. It shows items, quantities, price snapshots, subtotal, tax/service charges where configured, discounts, final payable, **Edit Order**, and **Proceed to Payment**. Edit Order returns to order editing and then back to Bill Review. On mobile use a single-column layout and keep the total and primary action easy to reach.

### Payment UI

Prominently show total payable, payment method, amount received, change, remaining balance, and payment status. Split/partial payments show paid and remaining amounts and each payment part. A failed payment must clearly state that the order remains unpaid and offer retry/another method. Never show success until the authoritative API confirms it. Offline cash is supported by the offline workflow; card/online payments must not be falsely marked successful offline.

## 9. Kitchen Display System (KDS)

KDS prioritizes readability, ticket age, status, and quick acknowledgement. A ticket can show order number, table, waiter, elapsed time, items, quantities, modifiers, cancellation/update messages, and status. Large displays show more columns; small displays show fewer, larger tickets. Use an adaptive grid, for example:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
```

The minimum ticket width is a design token and must be validated on actual supported screens. Status must not be communicated by color alone. Kitchen cancellation updates must be visually distinct from new items.

## 10. Table management

Use a visual grid on desktop/tablet where space allows and compact cards/list rows on mobile. A table card may show table number, status, active order, amount, waiter, elapsed time, and relevant quick actions. Order data remains the source of truth for active orders. Avoid showing actions the current role cannot perform.

## 11. Images and uploaded media

Images must never distort or force a component to overflow. Place images inside controlled aspect-ratio frames and choose fit behavior by purpose:

```css
.product-image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
```

Use `object-fit: contain` when the complete image must be visible (for example, certain packaged products or logos). Use `cover` when consistent thumbnail framing matters. Do not apply arbitrary fixed width/height to every source image.

Recommended upload flow: validate file type and size, optimize, create thumbnail/display variants, store file metadata, and render responsively. Use WebP/AVIF where supported, responsive image sizes, lazy loading, and object/CDN storage in production. Do not load a full-resolution original for a small card. The source image ratio must not control the page layout.

## 12. Text overflow and data tables

Text must not overlap controls. Use natural wrapping and, where suitable, `overflow-wrap: anywhere`; clamp only when a clear way to see the full value exists. Important information must not disappear solely because the screen is small.

- Desktop: full data tables.
- Tablet: condensed tables with lower-priority columns hidden or moved to details.
- Mobile: primary fields shown as cards/list rows with a “View details” action.

Do not force wide multi-column tables into a narrow mobile viewport. Avoid page-level horizontal scrolling for critical workflows; a specific data grid may use a clearly bounded horizontal scroller only when unavoidable.

## 13. Inventory, scanning, and recipes

Inventory uses full tables on desktop and cards on mobile. Keep item name, quantity/unit, stock status, expiry, cost, and branch accessible; secondary metadata can be in details. Summary cards may show total items, low stock, out of stock, near expiry, and expired stock.

Scanning flow:

```text
Scan → Identify item → Confirm item → Choose action
                                  ├─ Stock count
                                  ├─ Receive
                                  ├─ Adjustment
                                  ├─ Waste
                                  └─ Transfer
```

Camera/barcode support must use a platform adapter for web, Android, and Windows hardware differences.

Recipe screens show ingredients, quantities, units, unit costs, recipe cost, selling price, gross profit, margin, and analysis. Analysis filters include date range, branch, units sold, sales, ingredient consumption, cost, gross profit, margin, and theoretical-vs-actual variance.

## 14. Vendor screens

Vendor profile may show name, contact number, email, supplied items, purchase history, last visit, follow-up reminder, and notes. Vendor reminders are internal ServeU notifications initially; saving a phone number must not imply that an SMS/WhatsApp message was sent.

## 15. Reports and custom report builder

Use a consistent report layout: report header, filters, summary metrics, charts/tables, detailed data, export/schedule actions. Desktop may show horizontal filters; mobile should use a filter button and drawer/sheet.

Custom report builder flow:

```text
Choose data source → Choose columns → Filters → Group by
→ Sort → Totals → Preview → Save → Export / Schedule
```

Users should not need to write SQL. Report authorization and data retrieval belong to the backend report engine. Staff performance screens can show staff, orders, items sold, sales amount, average order value, cancellations, branch, date range, and rankings by orders, quantity, or sales amount. Historical order attribution is the source of truth.

## 16. Forms, dialogs, drawers, and feedback

Use React Hook Form + Zod for frontend form validation, with backend validation remaining authoritative. Forms need labels, required indicators, inline errors, keyboard navigation, visible focus, loading states, success feedback, and recoverable errors.

Use dialogs for focused confirmations and small actions. Use drawers for filters, order details, item details, and activity history. On mobile, drawers may become bottom sheets or full-screen panels; large workflows should not be squeezed into small modals.

Use toasts for short feedback such as “Order saved” or “Stock updated”. Important warnings/errors must remain visible rather than existing only in a disappearing toast. Every major screen needs loading, refreshing, empty, error, and relevant offline states. Empty states explain what is empty and provide a next action; avoid blank screens while data loads.

## 17. Offline and synchronization UX

Show clear connection states: `ONLINE`, `CHECKING`, `CONNECTION LOST`, `LOCAL MODE`, `INTERNET RESTORED`, `SYNCING`, and `SYNC COMPLETE`. Avoid rapid flickering on unstable connections.

Examples:

```text
Local Mode — cash orders can continue; some online-only actions are unavailable.
7 changes waiting to sync.
Some changes need review.
```

Do not silently discard local work. Persist pending work in IndexedDB, show sync progress and errors, and provide a safe recovery path for conflicts. The server/PostgreSQL is authoritative after synchronization. Local/LAN coordination behavior must be implemented and verified separately; the UI must not imply that cross-device local communication works unless it does.

## 18. PWA, Android, Windows, and printing

### PWA
- Installable app shell.
- Service-worker caching for static assets.
- Offline UI shell.
- IndexedDB operational data.
- Controlled sync and update notification.
- Do not indiscriminately cache sensitive API responses.

### Android / Capacitor
Use adapters for camera, barcode scanning, notifications, files, device capabilities, and compatible printer workflows.

### Windows / Tauri
Use adapters for local files, printer integration, notifications, and device capabilities. Share core UI and business logic.

### Printing
Receipt data and layout must be separated from printer-specific delivery. Support browser printing and platform-specific printer adapters as feasible; do not promise a printer model works until tested.

## 19. Accessibility and interaction

Target WCAG 2.2 AA as the baseline. Include semantic HTML, keyboard navigation, visible focus, accessible labels, sufficient contrast, screen-reader support, field-associated validation errors, correct dialog focus management, and touch targets large enough for comfortable use. Do not use color as the only status signal.

Desktop POS may provide shortcuts for new order, search, add item, send to kitchen, bill review, payment, and completion. Shortcuts must not hijack typing inside inputs. Confirm high-impact actions such as refunds, disabling staff, role changes, and inventory adjustments.

## 20. Data fetching, state, and performance

- TanStack Query owns server-state fetching, caching, mutation state, refetching, and invalidation.
- Keep ordinary UI state local; do not add a large global store without a demonstrated need.
- Dexie/IndexedDB stores offline operational data and queued operations.
- Split code by major route/module and lazy-load nonessential modules.
- Optimize images and virtualize very long lists when needed.
- Avoid unnecessary rerenders; POS and KDS must remain responsive during busy periods.
- Handle validation, authentication, authorization, network, offline, conflict, server, and unknown errors with appropriate recovery actions.

## 21. Reusable component contract

Reusable components may include:

```text
AppShell, TopBar, Sidebar, MobileNavigation, BranchSelector,
ConnectionIndicator, Button, Input, Select, Dialog, Drawer, Toast,
Tabs, Card, DataTable, EmptyState, LoadingState, ErrorState,
MenuItemCard, OrderPanel, BillReview, PaymentPanel, KitchenTicket,
TableCard, InventoryItemCard, RecipeCostCard, ReportFilter,
ReportTable, StaffRanking
```

Each component must define desktop/tablet/mobile behavior, overflow and long-text behavior, loading/empty/error states, and offline behavior where relevant. Keep business rules in appropriate services/state logic rather than hiding them inside presentation components.

## 22. Responsive acceptance criteria

The frontend is ready when:

- POS core flow works on phone, tablet, and desktop.
- KDS tickets remain readable on supported kitchen displays.
- Table and inventory layouts adapt without clipping.
- Reports and filters remain usable on mobile.
- Long names and descriptions do not overlap controls.
- Images never distort and do not break card dimensions.
- Forms work with touch and keyboard.
- Dialogs/drawers adapt to small screens.
- Offline and pending-sync states are visible.
- Navigation adapts without duplicating business logic.
- No critical mobile workflow requires page-level horizontal scrolling.
- Accessibility baseline is tested.
- Android and Windows reuse the shared UI/business core and platform-specific features are isolated.
- Tests cover representative small, medium, large, portrait, and landscape viewports.

## 23. Relationship to other specifications

This document must align with the Master PRD, Database Schema, API Contract, Permission Matrix, Order + Kitchen + POS State Machine, Inventory + Recipe + Vendor, Reports + Scheduling, Offline + Sync + Realtime, and Testing + Deployment specifications. The final `ServeU-Master-PRD.md` will consolidate decisions, remove duplication, resolve conflicts, and clearly label MVP versus later releases.

## 24. Next specification

Next recommended document: **Inventory + Recipe + Vendor Operations Specification**, covering stock movements, units/conversions, batches/expiry, receiving, waste, stock counts, transfers, scanning, recipe costing, theoretical-vs-actual consumption, vendor records, visits, and reminders.
