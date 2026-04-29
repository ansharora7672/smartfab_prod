# SmartFab Lathe — Complete Codebase Documentation

> **What this is:** A quick-reference guide to every file, class, and function in your codebase.  
> **Format:** File → Class/Function → Takes → Returns → 1-2 liner.
> **Last Updated:** April 17, 2026 — This file lives in the repo and should be updated as we build.

---

## Project Overview

| Layer | Tech | Purpose |
|-------|------|---------|
| **Backend** | FastAPI + SQLModel + PostgreSQL + asyncpg | REST API, business logic, email service, PDF generation |
| **Frontend** | Next.js 15 + Tailwind CSS + ShadCN | Public website + internal admin dashboard |
| **DB** | PostgreSQL (local) | `postgresql+asyncpg://postgres:admin@localhost:5432/hiringpipeline` |

---

# 🔧 BACKEND (`backend/app/`)

---

## 1. Configuration & Database

---

### config.py

| Name | Type | Description |
|------|------|-------------|
| `Settings` | Class (Pydantic `BaseSettings`) | Loads all env vars from `.env`. Fields: `DATABASE_URL`, `APP_ENV`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `SMTP_EMAIL`, `SMTP_APP_PASSWORD`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`. |
| `settings` | Instance | Global singleton — import this anywhere to access config values. |

---

### database.py

| Name | Takes | Returns | Description |
|------|-------|---------|-------------|
| `engine` | — | `AsyncEngine` | Async SQLAlchemy engine with connection pooling (5 base, 10 overflow). Echoes SQL only in dev mode. |
| `async_session` | — | `sessionmaker` | Factory that creates `AsyncSession` instances. `expire_on_commit=False` keeps data accessible after commit. |
| `get_session()` | — | `AsyncSession` (yields) | FastAPI dependency. Opens a DB session for one request, then auto-closes it. |
| `init_db()` | — | `None` | Runs `SQLModel.metadata.create_all` — creates all tables if they don't exist. Called once on startup. |
| `bootstrap_admin()` | — | `None` | If the `users` table is empty, creates a Super Admin using creds from `.env`. Does nothing if any user exists. |

---

### reset_db.py / reset_quotes_db.py

Standalone scripts to drop specific tables during development. Run with `python -m app.reset_db`.

---

## 2. Models (`models/`)

> These are your **database table definitions**. Each class with `table=True` maps to a PostgreSQL table.

---

### models/user.py

| Name | Type | Description |
|------|------|-------------|
| `UserRole` | Enum (`ADMIN`, `STAFF`) | Defines the two internal roles in the system. |
| `User` | DB Table (`users`) | Stores all internal users. Fields: `id` (UUID PK), `email` (unique, indexed), `hashed_password`, `full_name`, `role` (default STAFF), `is_active` (default True), `created_at`, `updated_at`. |

---

### models/ticket.py

| Name | Type | Description |
|------|------|-------------|
| `TicketStatusEnum` | Enum | `PENDING` → `CLAIMED` → `CALL_COMPLETED` → `IN_QUOTE_PREPARATION` → `ACTIVE_ORDER` → `CLOSED` |
| `Ticket` | DB Table (`tickets`) | One row per customer inquiry. Fields: `id` (UUID PK), `ticket_id` (public format `SFL-YYYYMMDD-XXXX`, unique, indexed), `created_at`, customer fields (`customer_name`, `company_name`, `email`, `phone_number`, `company_address`), booking fields (`consultation_date`, `consultation_time`), `status`, `assigned_to_id` (FK to `users.id`), `reminder_sent_at`, `completion_prompt_sent_at`. |

---

### models/availability.py

| Name | Type | Description |
|------|------|-------------|
| `StaffAvailability` | DB Table (`staff_availability`) | One row = one 30-min slot a staff member marked as available. Fields: `id` (UUID PK), `user_id` (FK to `users.id`), `date`, `start_time`, `created_at`. |

---

### models/quote.py

| Name | Type | Description |
|------|------|-------------|
| `QuoteStatusEnum` | Enum | `DRAFT` → `SENT` → `APPROVED` / `REJECTED` / `MODIFICATION_REQUESTED` |
| `Quote` | DB Table (`quotes`) | One quote per ticket (can have revisions). Fields: `id`, `ticket_id` (FK), `quote_no` (unique, uses ticket_id format), `company_name`, `address`, `phone_no`, `quote_date`, `lpo_no`, `lead_time_approx`, `status`, `created_at`, `updated_at`. Has a `items` relationship. |
| `QuoteItem` | DB Table (`quote_items`) | One line item in a quote. Fields: `id`, `quote_id` (FK), `sr_no`, `item_description`, `qty`, `u_price`, `total_amount`. Has a `quote` back-relationship. |

---

### models/invoice.py

| Name | Type | Description |
|------|------|-------------|
| `InvoiceStatusEnum` | Enum | `DRAFT`, `SENT`, `PAID`, `CANCELLED` |
| `Invoice` | DB Table (`invoices`) | Commercial invoice (distinct from quotation). Fields: `id`, `ticket_id` (FK), `invoice_no`, delivery/payment metadata fields, totals (`taxable_value`, `vat_total`, `invoice_total`), `amount_chargeable_words`, `status`, timestamps. Has `items` relationship. |
| `InvoiceItem` | DB Table (`invoice_items`) | One line item in an invoice. Fields include VAT fields (`rate_excl_vat`, `rate_incl_vat`, `discount_aed`, `vat_percentage`), `amount`, `total_incl_vat`, `per` (unit). |

---

## 3. Schemas (`schemas/`)

> **Schemas** are Pydantic models used for **request/response validation**. They do NOT touch the database — they define the shape of JSON data going in and out of your API.

---

### schemas/auth.py

| Name | Description |
|------|-------------|
| `UserRegister` | Shape of data for registering (not currently used in a public endpoint). |
| `UserLogin` | What the login form sends: `email` (EmailStr), `password`. |
| `TokenResponse` | Shape of a JWT token response: `access_token`, `token_type`. |
| `UserResponse` | Safe user info (no password hash): `id`, `email`, `full_name`, `role`, `is_active`. |
| `ChangePasswordRequest` | Validates new password is 8+ chars with at least one letter and one digit. |

---

### schemas/admin_users.py

| Name | Description |
|------|-------------|
| `UserCreateRequest` | Admin sends: `email`, `full_name`, `role`. |
| `UserCreateResponse` | API returns: `message`, `email`, `temporary_password`. |
| `UserListItem` | One user: `id`, `email`, `full_name`, `role`, `is_active`, `created_at`, `updated_at`. |
| `UserListResponse` | `users: List[UserListItem]` + `total: int`. |
| `UserRoleUpdateRequest` | `role: UserRole`. |
| `UserStatusUpdateRequest` | `is_active: bool`. |

---

### schemas/availability.py

| Name | Description |
|------|-------------|
| `AvailabilitySlot` | One slot: `date` + `start_time`. |
| `SetAvailabilityRequest` | `slots: List[AvailabilitySlot]`. |
| `PublicSlotResponse` | `date`, `start_time`, `available_capacity`. |

---

### schemas/ticket.py

| Name | Description |
|------|-------------|
| `TicketBase` | Shared fields with length limits. |
| `TicketCreate` | Extends `TicketBase`. Adds phone number validator (must start with `+971`). |
| `TicketPublic` | Extends `TicketBase`. Adds system fields: `id`, `ticket_id`, `created_at`, `status`, `assigned_to_id`, `assignee_name`. |
| `TicketAssignRequest` | `user_id: UUID`. |

---

### schemas/quote.py

| Name | Description |
|------|-------------|
| `QuoteItemBase` | `sr_no`, `item_description`, `qty`, `u_price`, `total_amount`. |
| `QuoteItemCreate` | Same as base — used for incoming data. |
| `QuoteItemResponse` | Adds `id`, `quote_id` to base. |
| `QuoteBase` | `ticket_id`, `company_name`, `address`, `phone_no`, `lpo_no`, `lead_time_approx`. |
| `QuoteCreate` | Extends `QuoteBase` + `items: List[QuoteItemCreate]`. |
| `QuoteResponse` | Extends `QuoteBase` + `id`, `quote_no`, `quote_date`, `status`, timestamps, `items`. |

---

## 4. Services (`services/`)

---

### services/auth.py

| Function | Takes | Returns | Description |
|----------|-------|---------|-------------|
| `hash_password(plain)` | `str` | `str` | bcrypt hash. |
| `verify_password(plain, hashed)` | `str`, `str` | `bool` | Checks match. |
| `create_access_token(user_id, email, role)` | `str`, `str`, `str` | `str` (JWT) | Signed JWT with expiry. |

---

### services/emails.py

| Function | Takes | Returns | Description |
|----------|-------|---------|-------------|
| `_generate_quote_response_token(quote_id, email)` | `str`, `str` | `str` (JWT) | Signed token for email buttons. 30-day expiry. |
| `send_welcome_email(to, name, password)` | `str`, `str`, `str` | `bool` | New user welcome email with temp password. |
| `send_ticket_lifecycle_notification(to, type, ctx)` | `str`, `str`, `dict` | `bool` | 4 types: NEW_TICKET_ALERT, ASSIGNED, UPCOMING_REMINDER, CALL_COMPLETED_PROMPT. |
| `send_quote_email(to, quote_data, ticket_data)` | `str`, `dict`, `dict` | `bool` | Full quote email + PDF attachment + action buttons. |
| `send_approval_followup_email(to, name, invoice_no)` | `str`, `str`, `str` | `bool` | Post-approval — asks for LPO. |
| `send_rejection_followup_email(to, name, invoice_no)` | `str`, `str`, `str` | `bool` | Post-rejection — asks for feedback. |
| `send_modification_followup_email(to, name, invoice_no)` | `str`, `str`, `str` | `bool` | Post-modification — says we'll be in touch. |

---

### services/pdf_generator.py

| Name | Takes | Returns | Description |
|------|-------|---------|-------------|
| `LOGO_BASE64` | — | `str` | Company logo base64-encoded for HTML embedding. |
| `generate_quote_pdf(quote_data, ticket_data)` | `dict`, `dict` | `bytes` | Playwright (headless Chromium) renders HTML → A4 PDF bytes. |

---

### services/scheduler.py

| Name | Description |
|------|-------------|
| `scheduler` | APScheduler `AsyncIOScheduler` instance. |
| `check_upcoming_and_past_calls()` | Runs every 5 min. Sends reminder 1hr before call, completion prompt 10min after. |
| `start_scheduler()` / `stop_scheduler()` | Lifecycle hooks called on app startup/shutdown. |

---

## 5. Routers (`routers/`)

---

### routers/auth.py — Prefix: `/api/auth`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | ❌ | Login → sets HTTP-only cookie |
| `/api/auth/me` | GET | ✅ | Returns current user info |
| `/api/auth/logout` | POST | ❌ | Clears cookie |
| `/api/auth/change-password` | POST | ✅ | Changes password |

| Dependency: `get_current_user(request, session)` — Central auth dependency used by all protected routes. |

---

### routers/admin_users.py — Prefix: `/admin/users`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/users/` | POST | Admin | Create user + send welcome email |
| `/admin/users/` | GET | Admin | List all users |
| `/admin/users/{id}/role` | PATCH | Admin | Change role (protected against last-admin demotion) |
| `/admin/users/{id}/status` | PATCH | Admin | Toggle active/inactive |

---

### routers/availability.py — Prefix: `/admin/availability`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/availability/` | GET | ✅ | Get my future slots |
| `/admin/availability/` | POST | ✅ | Wipe & replace all future slots |

---

### routers/ticket.py — Mixed public/admin

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/public/tickets/` | POST | ❌ | Create inquiry ticket (rate limited: 15/min) |
| `/public/tickets/available-slots` | GET | ❌ | Available consultation slots |
| `/admin/tickets/pending` | GET | ✅ | PENDING + CLAIMED tickets |
| `/admin/tickets/transition` | GET | ✅ | CALL_COMPLETED + IN_QUOTE_PREPARATION tickets with latest quote |
| `/admin/tickets/{id}/claim` | PATCH | ✅ | Claim a PENDING ticket |
| `/admin/tickets/{id}/mark_completed` | PATCH | ✅ | Move CLAIMED → CALL_COMPLETED |
| `/admin/tickets/{id}/assign` | PATCH | Admin | Force-assign ticket |

---

### routers/quotes.py — Prefix: `/admin/quotes` + `/public/quotes`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/quotes/` | POST | ✅ | Create quote (generates quote_no with revision suffix) |
| `/admin/quotes/{ticket_id}` | GET | ✅ | All quotes for a ticket |
| `/admin/quotes/quote/{quote_id}` | GET | ✅ | Single quote + ticket info (for PDF view) |
| `/admin/quotes/{quote_id}/send` | POST | ✅ | Email quote to customer (background thread) |
| `/public/quotes/respond` | GET | ❌ | Customer responds via email button (JWT-secured) |

---

## 6. Main Entry Point — main.py

| Name | Description |
|------|-------------|
| `lifespan()` | Startup: `init_db()`, `bootstrap_admin()`, `start_scheduler()`. Shutdown: `stop_scheduler()`. |
| `app` | FastAPI instance with SlowAPI rate limiter, CORS for localhost:3000. |
| Health check | `GET /` → `{status: "healthy"}` |

---

# 🎨 FRONTEND (`frontend/src/`)

---

## Root Layout & Config

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root HTML wrapper. Fonts: Plus Jakarta Sans, Inter, Geist. SEO metadata. |
| `lib/utils.ts` | `cn()` — Tailwind class merger (clsx + tailwind-merge). |
| `config/calender.ts` | Calendar config: working days, 9-5, 30-min slots. |
| `contexts/AuthContext.tsx` | React Context for auth: `user`, `isLoading`, `login()`, `logout()`. |

---

## Public Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page: Navbar → Hero → PositioningStrip → Services → Process → Footer |
| `/quote` | `app/quote/page.tsx` | 3-step quote request: Company Details → Calendar Booking → Confirmation |
| `/quote-response` | `app/quote-response/page.tsx` | Customer responds to quote email (approve/reject/modify) |

---

## Dashboard Pages

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | Welcome + stat cards (hardcoded 0s) |
| `/dashboard/login` | `app/dashboard/login/page.tsx` | Email/password login form |
| `/dashboard/tickets/pending` | `...tickets/pending/page.tsx` | Pending consultations table with claim/complete actions |
| `/dashboard/transition` | `.../transition/page.tsx` | Quote preparation: generate, preview, send, resend |
| `/dashboard/availability` | `.../availability/page.tsx` | Weekly availability calendar grid |
| `/dashboard/staff` | `.../staff/page.tsx` | Admin: user CRUD with role/status management (ShadCN dialogs) |
| `/dashboard/quotes/new` | `.../quotes/new/page.tsx` | Quote builder with line items |
| `/dashboard/quotes/[id]/pdf` | `.../quotes/[id]/pdf/page.tsx` | Pixel-perfect A4 quotation PDF view with print |

---

## Landing Page Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Fixed, transparent→solid on scroll, mobile menu |
| `Hero` | Full-viewport, background image + navy overlay, CTAs |
| `PositioningStrip` | Capabilities strip with dot separators |
| `Services` | 12 services in 3 categories with scroll animations |
| `Process` | 4-step "How It Works" with connecting lines |
| `Footer` | Dark navy, 3-column: brand, links, contact |
| `ScrollReveal` | Intersection Observer fade-in wrapper |
| `QuoteForms` | CompanyDetailsForm + BookingCalendar + ConfirmationScreen |

---

## ShadCN UI Components (`components/ui/`)

`button.tsx`, `dialog.tsx`, `alert-dialog.tsx` — Standard ShadCN primitives used in Staff Management.

---

## Quick Reference: Full API Route Map

| Method | Route | Auth | Module |
|--------|-------|------|--------|
| GET | `/` | ❌ | Health check |
| POST | `/api/auth/login` | ❌ | Auth |
| GET | `/api/auth/me` | ✅ | Auth |
| POST | `/api/auth/logout` | ❌ | Auth |
| POST | `/api/auth/change-password` | ✅ | Auth |
| POST | `/admin/users/` | Admin | User mgmt |
| GET | `/admin/users/` | Admin | User mgmt |
| PATCH | `/admin/users/{id}/role` | Admin | User mgmt |
| PATCH | `/admin/users/{id}/status` | Admin | User mgmt |
| GET | `/admin/availability/` | ✅ | Availability |
| POST | `/admin/availability/` | ✅ | Availability |
| POST | `/public/tickets/` | ❌ | Tickets |
| GET | `/public/tickets/available-slots` | ❌ | Tickets |
| GET | `/admin/tickets/pending` | ✅ | Tickets |
| GET | `/admin/tickets/transition` | ✅ | Tickets |
| PATCH | `/admin/tickets/{id}/claim` | ✅ | Tickets |
| PATCH | `/admin/tickets/{id}/mark_completed` | ✅ | Tickets |
| PATCH | `/admin/tickets/{id}/assign` | Admin | Tickets |
| POST | `/admin/quotes/` | ✅ | Quotes |
| GET | `/admin/quotes/{ticket_id}` | ✅ | Quotes |
| GET | `/admin/quotes/quote/{quote_id}` | ✅ | Quotes |
| POST | `/admin/quotes/{quote_id}/send` | ✅ | Quotes |
| GET | `/public/quotes/respond` | ❌ | Quotes |
