# Complete Quote-to-Delivery Lifecycle Implementation

This document outlines the architectural plan needed to construct the next major vertical of the SmartFab Lathe project as stipulated by `SPEC.md`. Now that the consultation, quote preparation, and LPO capture phases are rock solid, we need to transition Tickets into "Active Orders" and track them through production to final delivery.

## User Review Required

> [!WARNING]
> This phase introduces significant architectural additions, particularly regarding how vendors and delivery drivers are tracked. Please review the database changes carefully to ensure they match how your shop physically operates on the floor. 

## Proposed Changes

---

### Database Models

We will introduce three entirely new database tables to track the order lifecycle properly.

#### [NEW] `backend/app/models/vendor.py`
A new table to store your network of partner suppliers.
- **Fields:** `id`, `vendor_name`, `company_name`, `phone_number`, `email`, `services_offered`

#### [NEW] `backend/app/models/driver.py`
A new table to store delivery logistics.
- **Fields:** `id`, `name`, `phone_number`, `vehicle_details`

#### [NEW] `backend/app/models/delivery.py`
A table linking specific quote line-items to a driver for delivery.
- **Fields:** `id`, `ticket_id`, `driver_id`, `created_at`, `status`, `items_included` (JSON list of item IDs)

#### [MODIFY] `backend/app/models/quote.py`
We need to add production tracking capabilities specifically to the `QuoteItem` model, because `SPEC.md` states "*Each item includes: Assigned vendor, Production status*".
- **Added Fields:** `vendor_id` (ForeignKey), `production_status` (Enum: Order Received, Vendor Assigned, In Production, Quality Check, Ready for Delivery, Delivered)

---

### Endpoints (Backend)

We will construct the APIs required to power the production tracking screens.

#### [NEW] `backend/app/routers/vendors.py`
- `GET /admin/vendors/` (List all vendors)
- `POST /admin/vendors/` (Add new vendor)

#### [NEW] `backend/app/routers/production.py`
- `GET /admin/production/active-orders` (Fetch all Tickets with `status == ACTIVE_ORDER`)
- `PATCH /admin/production/items/{item_id}/status` (Update an item's production status)
- `PATCH /admin/production/items/{item_id}/vendor` (Assign a vendor to an item)

#### [NEW] `backend/app/routers/deliveries.py`
- `POST /admin/deliveries/` (Generate a new Delivery Note PDF and assign a Driver)

---

### Frontend Screens

We will construct the internal and external pages for the logistics pipeline.

#### [NEW] `frontend/src/app/dashboard/active-orders/page.tsx`
A dense data grid showing all Active Orders. Expanding a row will reveal each individual line item and dropdowns to manually update the "Production Status" enum and "Assign Vendor".

#### [NEW] `frontend/src/app/dashboard/deliveries/page.tsx`
A screen showing all items marked as `Ready for Delivery`. The staff can check-box multiple items, select a Delivery Driver from a dropdown, and hit "Generate Delivery Note" which will instantly spawn a Delivery Note PDF and email it!

#### [NEW] `frontend/src/app/track-order/page.tsx`
The public-facing customer portal. 
- A simple input box asking for `Order No` (Ticket ID) or `LPO No`.
- Upon searching, it will display a beautiful, read-only timeline of their items (e.g. "Item 1: In Production", "Item 2: Quality Check").

## Open Questions

> [!IMPORTANT]
> 1. When an item is marked as `Delivered`, do you want the system to automatically email the customer, or should notifications be silent during production?
> 2. For the `Delivery Note` PDF, do you want a signature line for the driver/receiver, similar to how we handled the initial quotation?

## Verification Plan

### Automated Tests
- Verify that assigning a vendor properly links the Foreign Key inside the `QuoteItem` table.
- Verify `production_status` changes persist in the database and reflect accurately on the public tracking page.

### Manual Verification
- We will perform an end-to-end sandbox run: Quote -> LPO -> Active Order -> Assign Vendor -> Status: Delivered -> Delivery Note Generated.
