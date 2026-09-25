# WorkSphere

A full-stack Enterprise HR & Employee Management System built to demonstrate production-grade Angular engineering: standalone components, Signals, a deliberate mix of Signals-first and NgRx state, the classic RxJS operator set, guards/interceptors, lazy loading, and role-based access control — backed by a real Express + Prisma + PostgreSQL API, not mocked data.

This project was built incrementally across 10 phases (auth → employees/departments → attendance/leave → performance/recruitment/payroll → documents/announcements/notifications/search → dashboards → hardening → deployment), with every phase verified against the real API and a real headless-browser walkthrough before moving on.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Database schema](#database-schema)
- [Roles & permissions](#roles--permissions)
- [API reference](#api-reference)
- [Angular concepts demonstrated](#angular-concepts-demonstrated)
- [RxJS in this codebase](#rxjs-in-this-codebase)
- [State management](#state-management)
- [Running locally](#running-locally)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [Testing](#testing)
- [Deployment notes](#deployment-notes)
- [Known limitations & future improvements](#known-limitations--future-improvements)

## Features

| Module | What it does | Who can use it |
|---|---|---|
| **Auth** | Register, login, JWT sessions, change password | Everyone |
| **Employees** | CRUD, search/filter/sort/paginate, profile photo upload, tabbed detail view | Admin/HR manage; Manager views their team (read-only) |
| **Departments** | CRUD, manager assignment | Admin/HR manage; Manager/HR read for filters |
| **Attendance** | Read-only history with filters, today's stats snapshot | Admin/HR company-wide, Manager team-scoped, Employee self |
| **Leave** | Request with file attachment, approve/reject with a required rejection reason, auto-syncs Attendance to `ON_LEAVE` on approval | Everyone requests; Admin/HR/Manager review |
| **Performance** | Manager-submitted structured reviews (goals/achievements/strengths/areas/comments + rating), employee rating-trend chart | Manager writes for direct reports; Employee views own |
| **Recruitment** | Job postings, applicant pipeline (Applied → Screening → Interview → Selected/Rejected), interview scheduling | Admin/HR |
| **Payroll** | Monthly payroll records with server-computed net salary, payslip history | Admin/HR manage all; Manager/Employee view only their own |
| **Documents** | Upload company-wide or employee-specific files (policies, contracts, certificates) | Everyone views own + company-wide; Admin/HR manage all |
| **Announcements** | Company feed with publish/expiry dates, broadcasts a notification on publish | Everyone views; Admin/HR manage |
| **Notifications** | Bell with unread badge, polled every 30s, mark-read/mark-all-read | Everyone |
| **Global search** | Debounced cross-entity search (employees/departments/jobs/announcements), each category scoped to what that role can already reach | Everyone (result set varies by role) |
| **Dashboards** | Role-specific analytics (employee growth, department breakdown, attendance trend, leave stats, hiring stats, payroll summary), all widgets loaded in parallel | Everyone (widget set varies by role) |

## Tech stack

**Frontend** — Angular 22 (standalone, zoneless), Angular Material 22 (M3 theming), NgRx 22 (Auth slice only), RxJS 7.8, ng2-charts 10 / Chart.js 4.5, TypeScript 6.0, Vitest (via `@angular/build:unit-test`).

**Backend** — Node 22, Express 5, Prisma 7 (`@prisma/adapter-pg` driver adapter), PostgreSQL 16, Zod 4, JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), `express-rate-limit`, `helmet`, `multer`.

**Infra** — Docker Compose (Postgres, pgAdmin, backend, frontend/nginx), multi-stage Dockerfiles.

## Architecture

```
                                   ┌─────────────────────────────┐
  Browser  ──────────────────────▶│  nginx (frontend container)  │
                                   │  - serves the Angular SPA     │
                                   │  - proxies /api & /uploads    │
                                   └───────────────┬──────────────┘
                                                    │ same-origin proxy
                                                    ▼
                                   ┌─────────────────────────────┐
                                   │  Express API (backend)       │
                                   │  routes → controllers        │
                                   │         → services (RBAC)    │
                                   │         → repositories       │
                                   └───────────────┬──────────────┘
                                                    │ Prisma + pg adapter
                                                    ▼
                                   ┌─────────────────────────────┐
                                   │  PostgreSQL                  │
                                   └─────────────────────────────┘
```

**Backend layering** (`backend/src/`): `routes` wire HTTP verbs + middleware (`authenticate`, `authorize(...roles)`, `validate(zodSchema)`) to `controllers`, which are thin — they extract the request, call a `service`, and shape the response. `services` hold all business logic and RBAC scoping (a service function takes the requester's `{userId, role}` and narrows its own Prisma `where` clause accordingly, rather than the RBAC decision living in the route or controller). `repositories` are the only layer that touches `prisma` directly, keeping query shape (`include`, `orderBy`) in one place per model. `types/*.types.ts` hold the DTOs services return; `validation/*.validation.ts` hold the Zod schemas.

**Frontend layering** (`frontend/src/app/`): `core/` holds singleton services (`@Service()`-decorated API wrappers, guards, interceptors, the Auth NgRx slice, cross-cutting utils). `features/` holds one folder per route/domain, each component paired with its own `.html`/`.scss`/`.spec.ts`. `shared/ui/` holds the reusable primitives (`DataTable`, `Pagination`, `ConfirmDialog`, `Modal`, `FileUpload`, `StatusBadge`, `EmptyState`, `DashboardCard`, `DashboardWidget`, `SearchInput`) that every feature composes rather than reimplementing.

## Folder structure

```
WorkSphere/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 14 models, see Database schema below
│   │   ├── migrations/          # one migration per schema change, in order
│   │   └── seed.ts              # deterministic demo dataset (see Demo accounts)
│   ├── src/
│   │   ├── config/               # env.ts (Zod-validated process.env)
│   │   ├── lib/                  # jwt, password hashing, ApiError, date helpers
│   │   ├── middleware/           # authenticate, authorize, validate, rateLimit, upload, errorHandler
│   │   ├── routes/                # one file per resource, mounted in app.ts
│   │   ├── controllers/           # thin HTTP adapters
│   │   ├── services/              # business logic + RBAC scoping
│   │   ├── repositories/          # the only layer that imports `prisma`
│   │   ├── types/                 # DTOs + shared PaginatedResult<T>
│   │   └── validation/            # Zod schemas
│   └── Dockerfile
├── frontend/
│   └── src/app/
│       ├── core/                  # singletons: api services, guards, interceptors, auth state, utils
│       ├── features/               # one folder per route/domain
│       ├── layouts/main-layout/    # sidenav + toolbar shell (nav, notification bell, global search)
│       └── shared/
│           ├── ui/                 # reusable primitives
│           ├── directives/         # *appHasRole
│           ├── pipes/              # employeeStatus, salaryFormat
│           └── validators/         # password strength/match cross-field validators
├── docker-compose.yml
└── README.md
```

## Database schema

14 Prisma models, all UTC-normalized dates, `cuid()` primary keys. Relations in brief:

- **User** (login identity: email, passwordHash, role) 1:1 **Employee** (org data: department, manager, salary, status) — kept separate so `ADMIN`/`HR_MANAGER` accounts can exist without necessarily being a line-org employee, and so auth concerns never leak into HR data queries.
- **Employee** self-relates for `manager`/`directReports`, and 1:1 relates to **Department** as its manager (`Department.managerId`).
- **Attendance**, **LeaveRequest**, **PerformanceReview**, **Payroll**, **Document** all belong to an `Employee`; `LeaveRequest`/`PerformanceReview`/`Payroll`/`Document` additionally reference the *acting* Employee (reviewer/approver/uploader) via a second relation.
- **Job** → **Application** (unique per `[jobId, applicantId]`) → **Interview**; **Applicant** is a separate model from `Employee`/`User` since candidates aren't system users.
- **Announcement** and **Notification** are broadcast/inbox models; `Notification.link` is computed server-side per recipient role so a link never points at a route that role doesn't have.

Indexes exist on every foreign key used in a `WHERE` filter (`employeeId`, `departmentId`, `managerId`, `jobId`, `applicationId`) plus every status/date column used for filtering or dashboard aggregation (`status`, `date`, `month`, `publishedAt`, `[userId, isRead]`). See `backend/prisma/schema.prisma` for the full model list with field-level comments.

## Roles & permissions

Four roles: `ADMIN`, `HR_MANAGER`, `MANAGER`, `EMPLOYEE`. Permission is enforced in **two places** that must agree: the route (`authorize('ADMIN', 'HR_MANAGER')` middleware, or none — meaning "any authenticated user, service decides") and the service (narrows the Prisma `where` clause based on `requester.role`, e.g. `MANAGER` sees only their direct reports' leave requests). The frontend's `roleGuard` and per-route `data` (`mode: 'self' | 'manage'`, etc.) mirror this but are UX-only — every actual authorization decision is re-checked server-side, since a guard only controls what the SPA *renders*, not what the API *accepts*.

| | Admin | HR Manager | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Employees / Departments | Manage all | Manage all | View own team | — |
| Attendance / Leave | — | Manage all | Manage own team | Self only |
| Performance | — | — | Write for direct reports | View own |
| Recruitment | — | Manage | — | — |
| Payroll | — | Manage all | View own only | View own only |
| Documents / Announcements | Manage all | Manage all | View + upload own | View + upload own |

("Manage" = full CRUD; "View" = read-only; a blank cell means that role has no nav entry for the module, even where the API might technically allow a narrower read.)

## API reference

Base path `/api`. All routes except `/auth/login`, `/auth/register`, and `/health` require `Authorization: Bearer <token>`.

| Resource | Routes |
|---|---|
| `/auth` | `POST /register`, `POST /login` (rate-limited), `GET /me`, `POST /change-password` |
| `/employees` | `GET /`, `GET /options`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/departments` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/attendance` | `GET /`, `GET /stats/today` |
| `/leaves` | `GET /`, `POST /`, `PATCH /:id/approve`, `PATCH /:id/reject` |
| `/performance` | `GET /`, `POST /`, `PUT /:id` |
| `/jobs` | `GET /`, `GET /options`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/applications` | `GET /`, `GET /stats`, `POST /`, `PATCH /:id/status`, `POST /:id/interviews` |
| `/payroll` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/documents` | `GET /`, `POST /`, `DELETE /:id` |
| `/announcements` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/notifications` | `GET /`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all` |
| `/search` | `GET /?q=` |
| `/dashboard` | `GET /employee-summary`, `GET /employee-growth`, `GET /leave-summary`, `GET /attendance-trend`, `GET /payroll-summary` |
| `/uploads` | `POST /` (multipart, 5MB limit, PNG/JPEG/WEBP/GIF/PDF) |

Every paginated list returns `{ data: T[], page, pageSize, total }`. Every mutation validates its body against a Zod schema and returns `422` with `{ error: { message, fields } }` on failure; every other error returns `{ error: { message } }` with the appropriate 4xx/5xx status (500s always return a generic message, regardless of environment — see `backend/src/middleware/errorHandler.ts`).

## Angular concepts demonstrated

| Concept | Where |
|---|---|
| Standalone components, no NgModules | Every component in the project |
| Zoneless change detection | `frontend/src/app/app.config.ts` (`provideZonelessChangeDetection()`) |
| Signals for local/UI state | Every feature component (`loading`, `error`, `data` signal triad) |
| `computed()` for derived state | e.g. chart data in `hr-dashboard.ts`, `ratingLabel` in `performance-list.ts` |
| `input()` / `output()` | Every reusable `shared/ui` component |
| `toSignal()` / `toObservable()` | `main-layout.ts` (breakpoint observer → signal), `global-search.ts` (signal → RxJS pipeline) |
| Reactive Forms + custom validators | `shared/validators/password-strength.validator.ts`, `password-match.validator.ts`; conditional validator in `employee-form.ts` (salary required unless `INTERN`) |
| Route guards | `core/guards/auth-guard.ts`, `role-guard.ts` |
| Functional HTTP interceptor | `core/interceptors/auth-interceptor.ts` |
| Lazy-loaded routes | Every feature route in `app.routes.ts` uses `loadComponent` |
| Route-level providers | `provideCharts()` scoped to chart-using routes only, not global (`app.routes.ts`) — keeps Chart.js out of the eager bundle |
| Content projection | `shared/ui/data-table/`, `modal/`, `dashboard-widget/` |
| Directives | `shared/directives/has-role.ts` (`*appHasRole`) |
| Pipes | `shared/pipes/salary-format-pipe.ts`, `employee-status-pipe.ts` |
| `@for` with `track`, `@if`/`@else` control flow | Every template (verified via a full-codebase audit in Phase 9 — zero `@for` without `track`) |

## RxJS in this codebase

| Pattern | Where | Why |
|---|---|---|
| `Subject` → `debounceTime` → `distinctUntilChanged` | `shared/ui/search-input/search-input.ts` | The component boundary owns *when* to emit a search term; it doesn't know what to do with it |
| `combineLatest` → `switchMap` → HTTP, with `catchError` | Every list page (`employee-list.ts`, `leave-list.ts`, `payroll-list.ts`, etc.) | Combines search/filter/pagination signals into one request stream; `switchMap` cancels a stale in-flight request if the user changes a filter again before it resolves |
| `forkJoin` | `job-list.ts` (jobs + departments), all four dashboards (2–7 independent widget calls each) | Parallel independent requests that all need to resolve before rendering, verified in the browser network trace to fire concurrently rather than sequentially |
| `interval` → `startWith` → `switchMap` | `shared/notifications/notification-bell/notification-bell.ts` | Polls unread count every 30s without a manual `setInterval`/cleanup dance |
| `takeUntilDestroyed()` | Every recurring subscription (verified via a full-codebase audit — zero `combineLatest`/`toObservable`/`interval` usage without it) | Automatic unsubscribe tied to the component's `DestroyRef`, no manual `ngOnDestroy` bookkeeping |

## State management

**Signals** are the default for local/UI state everywhere — a `loading`/`error`/`data` (or paginated `total`) signal triad per component, with `computed()` deriving anything presentational (chart configs, filtered views, label lookups). This is deliberate: most state in this app (a list's current page, a dialog's saving flag) is genuinely local to one component tree and doesn't need a global store.

**NgRx** is used for exactly one slice — **Auth** (`core/state/auth/`) — as a deliberate demonstration of the pattern, not because auth *needs* a global store more than anything else here does. `AuthActions` (via `createActionGroup`) → `AuthEffects` (talks to `AuthApi`, `TokenStorage`, `Router`) → `AuthReducer` → `AuthSelectors`, bridged back to the rest of the app as Signals through `AuthFacade` (`toSignal(store.select(...))`) so components never import `Store` directly. This hybrid is itself the demonstrable decision: know when a global store earns its complexity (cross-cutting session state read by guards, interceptors, and every layout) versus when it doesn't (a table's current page).

## Running locally

### Option A — Docker Compose (full stack, closest to production)

```bash
docker compose up -d --build
```

Brings up Postgres, runs `prisma migrate deploy` automatically, starts the API on `:4000`, and serves the built Angular app through nginx on `:8080` (nginx proxies `/api` and `/uploads` to the backend container, so the browser never needs CORS). Seed the demo data once the stack is healthy:

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

Then open **http://localhost:8080**. Add `--profile tools` to also start pgAdmin on `:5050` (`admin@worksphere.local` / `admin`).

### Option B — Local dev servers (hot reload)

```bash
# 1. Database only
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env   # edit if needed - defaults match the Docker Postgres above
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev             # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm start                # http://localhost:4200
```

## Environment variables

Backend (`backend/.env`, see `.env.example`):

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `CORS_ORIGIN` | `http://localhost:4200` | Locked to a single origin, never a wildcard |
| `DATABASE_URL` | — | Required; Postgres connection string |
| `JWT_SECRET` | — | Required, min 16 chars; **must** be overridden for any real deployment |
| `JWT_EXPIRES_IN` | `1h` | |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | 15 min window for `/auth/login` and `/auth/register` |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max attempts per window per IP |

Frontend has no runtime env vars — `apiUrl`/`filesBaseUrl` are build-time constants in `src/environments/environment*.ts`, swapped by Angular's `fileReplacements` between `ng serve` (points at `localhost:4000`) and a production build (relative `/api`, proxied by nginx).

## Demo accounts

Every seeded account uses the password **`Password123!`**.

| Role | Email |
|---|---|
| Admin | `admin@worksphere.local` |
| HR Manager | `hr1@worksphere.local`, `hr2@worksphere.local` |
| Manager | `manager1@worksphere.local`, `manager2@worksphere.local` |
| Employee | `employee1@worksphere.local` … `employee10@worksphere.local` |

`backend/prisma/seed.ts` is idempotent-by-intent for org data (upserts users/departments/employees) and additive for everything else (attendance/leave/performance/jobs/applications/payroll/documents/announcements/notifications are skipped if a matching row already exists, so re-running the seed after manual testing restores a clean demo state without duplicating rows). Employee `joiningDate` values are computed relative to "today" at seed time specifically so the Employee Growth dashboard chart always has real recent data.

## Testing

```bash
cd frontend && npm test    # Vitest via @angular/build:unit-test - 280+ specs
cd frontend && npm run lint
cd backend && npm run typecheck
```

The backend has no automated test suite (see [Known limitations](#known-limitations--future-improvements)) — every backend change in this project was verified with real `curl` requests against the running API for RBAC boundaries, validation errors, and conflict handling, documented in each phase's commit messages. The frontend's 280+ specs cover every component (success/error/empty states), every API service (request shape), both guards, the auth interceptor, and the NgRx auth effects.

## Deployment notes

No live deployment is part of this repo; this documents how the pieces map to a real deployment.

- **Frontend** → any static host that can serve `frontend/dist/frontend/browser/` behind a proxy that forwards `/api` and `/uploads` to the backend (the included `nginx.conf` is one concrete example) — Vercel, Netlify, S3+CloudFront, or the provided nginx Docker image all work; the SPA fallback (`try_files $uri /index.html`) is required wherever it lands.
- **Backend** → any Node 22 host that can run `npm run build && npm start` (or the provided `Dockerfile`) — Render, Railway, Fly.io, ECS, etc. Set `JWT_SECRET` to a real random value, `CORS_ORIGIN` to the frontend's real origin, and `DATABASE_URL` to the managed Postgres instance below. Run `npx prisma migrate deploy` (not `migrate dev`) before starting — the Docker image's entrypoint already does this.
- **Database** → any managed PostgreSQL 16+ (RDS, Neon, Supabase, Railway). No PostgreSQL-specific extensions are used beyond what Prisma requires.
- **File uploads** are written to local disk (`backend/uploads/`, gitignored, mounted as a named Docker volume). A real multi-instance deployment would swap `multer`'s disk storage for an S3-compatible object store — the upload endpoint's response shape (`{ url }`) is already decoupled from *how* that URL is produced, so this is a contained change in `backend/src/middleware/upload.ts`.

## Known limitations & future improvements

- **No backend automated test suite.** Every backend behavior was verified via curl against the live API rather than an automated Jest/Vitest suite — a reasonable tradeoff for a solo project on a phase-by-phase timeline, but the first thing a real team would add.
- **No email delivery.** Registration and account creation don't send a real invite/reset email (`employee.service.ts` assigns a documented default password instead); "forgot password" isn't implemented. Both are natural next additions once an email provider is wired in.
- **Initial bundle is ~80KB over the 500KB warning budget** (still well under the 1MB hard error). This is organic growth across ten feature phases, not one identifiable regression — the next step would be auditing what's still eager that could move to a lazy chunk, rather than a quick fix.
- **Duplicate seed rows across days.** `LeaveRequest` seed entries use offsets relative to "today," so re-running the seed on a *different calendar day* than a previous run creates additional rows rather than updating the originals (Employee's `joiningDate` was fixed for this exact reason in Phase 8; `LeaveRequest` was deliberately left alone rather than expanding that phase's scope). Harmless for demo purposes; a real seed script would key its idempotency check off something day-independent.
- **`npm audit` flags 4 high-severity advisories**, all inside `prisma`'s own bundled Studio tooling (`@prisma/studio-core` → React/Radix-UI for its embedded UI, plus `mysql2` for cross-database support this project never uses) — a devDependency-only concern, not reachable through the app's HTTP surface, and not something `npm audit fix --force`'s major-version Prisma downgrade is worth taking this late in the project.
- **Dashboard analytics recompute on every request** rather than being cached/materialized — fine at this data volume, would need revisiting at real scale.
- **Global search doesn't use a full-text index** (`pg_trgm` or similar) — `contains` queries are fine at seed-data volume, not at production scale.
