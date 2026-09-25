# WorkSphere — Interview Guide

This is a study companion for talking about WorkSphere in an Angular Software House interview. It's organized in two parts: **walkthroughs** (architecture, auth flow, RBAC, state management — the things you'd sketch on a whiteboard) and a **Q&A bank** (60 questions grouped by topic, each with a simple answer, a technical answer, a concrete WorkSphere example with a file reference, and a likely follow-up).

The goal isn't to memorize this verbatim — it's to have, for every concept, a real file you can pull up and point at. Every code reference here was accurate as of the last commit on this branch; if something's moved, `git log --follow <file>` will find where.

## Table of contents

- [Architecture walkthrough](#architecture-walkthrough)
- [Auth & RBAC flow](#auth--rbac-flow)
- [State management: Signals vs. NgRx](#state-management-signals-vs-ngrx)
- [The RxJS patterns, explained](#the-rxjs-patterns-explained)
- [Q&A bank](#qa-bank)
  - [Angular fundamentals](#angular-fundamentals)
  - [RxJS](#rxjs)
  - [State management](#state-management)
  - [Forms](#forms)
  - [Routing & guards](#routing--guards)
  - [Backend & API design](#backend--api-design)
  - [Database & Prisma](#database--prisma)
  - [Auth & security](#auth--security)
  - [Testing](#testing)
  - [System design](#system-design)

---

## Architecture walkthrough

A request for, say, the employee list goes through five layers, each with one job:

```
Component (employee-list.ts)
  → EmployeeApi (core/employees/employee-api.ts)          "how do I talk to this endpoint"
    → HttpClient + authInterceptor                         "attach the token, handle 401/403"
      → Express route (routes/employee.routes.ts)          "who's allowed to even call this"
        → validate(zodSchema) middleware                    "is the request shape valid"
          → controller (controllers/employee.controller.ts) "extract request, call service, shape response"
            → service (services/employee.service.ts)         "business logic + RBAC scoping"
              → repository (repositories/employee.repository.ts) "the only layer touching `prisma`"
                → PostgreSQL
```

Two things about this that are worth being able to defend:

1. **The controller is deliberately thin.** It never contains an `if (role === ...)` — every actual authorization decision lives in the service, because the service is what's reusable and testable independent of HTTP. A controller's job is "unwrap the request, call one function, wrap the response" — nothing else.
2. **The repository is the only file that imports `prisma`.** If I ever swapped Prisma for another ORM, or added a caching layer, exactly one file per model changes. Every repository returns the same shape: `findMany({skip, take, where}) → {items, total}`, so every service's pagination logic looks identical.

On the frontend, the layering is `feature component → core/<domain>/xxx-api.ts (thin @Service() HTTP wrapper) → environment.apiUrl`. There's no separate "repository" layer on the frontend — the API service *is* that layer, since there's no local data store to abstract away (Signals hold whatever the last response was, not a normalized cache).

## Auth & RBAC flow

```
LOGIN
Login component → AuthFacade.login() → dispatch(AuthActions.login)
  → AuthEffects.login$ → AuthApi.login() → POST /api/auth/login
    → authService.login(): find user by email, bcrypt.compare, sign JWT {sub, role}
  ← { user, accessToken }
  → TokenStorage.setToken() (localStorage)
  → router.navigateByUrl(returnUrl ?? dashboardRouteForRole(user.role))
  → dispatch(AuthActions.loginSuccess) → reducer stores {user, isAuthenticated: true}

EVERY SUBSEQUENT REQUEST
authInterceptor reads TokenStorage.getToken() → clones the request with
`Authorization: Bearer <token>` → on a 401 response (and NOT from /auth/login
or /auth/register, where a 401 just means "wrong password") it dispatches
AuthActions.logout(), which clears the token and navigates to /login. On a
403 it navigates straight to /forbidden without touching the session -
you're still logged in, you just can't do that one thing.

ROUTE GUARDING (client-side, UX only)
authGuard: is there a user at all? No → redirect to /login?returnUrl=...
roleGuard(...roles): is the user's role in the allowed list? No → /forbidden

SERVER-SIDE (the only check that actually matters)
authenticate middleware: verify the JWT signature + expiry, attach {sub, role} to req.user
authorize(...roles) middleware: is req.user.role in the allowed list?
service layer: narrow the Prisma `where` clause by req.user - this is
where "MANAGER can only see their own team's leave requests" actually
lives, and it's the same code path whether the request came from the
real UI or a hand-crafted curl request.
```

The reason to be explicit that guards are "UX only": a guard prevents the *router* from activating a component, but it does nothing to the API. If someone opens dev tools and calls `fetch('/api/payroll', {headers: {Authorization: 'Bearer <a manager's real token>'}})`, the guard was never in the request path — only `authorize()` and the service's own scoping were. This project treats that as the correct mental model everywhere: **the frontend renders what a role should see; the backend enforces what a role can do**, and the two are written and reasoned about separately, even though they usually agree.

## State management: Signals vs. NgRx

The one-sentence version: **Signals for anything a single component tree owns, NgRx for exactly the one slice of state that many unrelated parts of the app need to read without prop-drilling it — Auth.**

Concretely:

- Every list page (`employee-list.ts`, `leave-list.ts`, `payroll-list.ts`, ~15 more) owns `loading`, `error`, `data`, `total`, `page`, `pageSize`, and whatever filter signals it needs, all local `signal()`s, combined with `combineLatest` + `switchMap` into one HTTP call. Nothing outside that component ever reads this state. A global store would just be indirection here.
- **Auth** is read by: every route guard, the HTTP interceptor, the main layout (to render the sidenav), every dashboard (to greet the user by name), and the login/register pages. That's genuinely cross-cutting, unrelated-component state — the textbook case for a store.

The NgRx slice itself is standard: `AuthActions` (via `createActionGroup`, so action creators + types come from one declaration instead of three), `auth.reducer.ts` (pure function, handles `loginSuccess`/`loginFailure`/`logout`/etc.), `auth.effects.ts` (the only place that calls `AuthApi`, `TokenStorage`, or `Router` — the reducer stays side-effect-free), `auth.selectors.ts`. The one non-standard piece is `AuthFacade`: it wraps `Store` and exposes everything as Signals via `toSignal(store.select(...))`, so `authGuard`, `roleGuard`, and every component that needs `currentUser`/`role`/`isAuthenticated` inject `AuthFacade`, not `Store` — they don't know or care that NgRx is behind it. That's the seam that would let this slice be swapped for something else without touching a single guard or component.

## The RxJS patterns, explained

**`Subject` → `debounceTime(300)` → `distinctUntilChanged()`** (`shared/ui/search-input/search-input.ts`): a reusable search box that owns the "don't fire on every keystroke, and don't re-fire for the same value twice" logic, then emits a plain `string` via `output()`. It doesn't know what the string is *for* — that's the parent's job. This split matters: it means the debounce logic is tested once, in isolation, instead of copy-pasted into every list component.

**`combineLatest([...]) → switchMap(...) → catchError(...)`** (every list page): the flagship pattern. `combineLatest` re-fires whenever *any* input signal changes (filter, page, pageSize, or a manual `refreshTrigger` bumped after a mutation), `switchMap` throws away a stale in-flight request if the user changes something before it resolves (critical — without `switchMap`, typing a fast filter change could let an *older* response arrive after a *newer* one and overwrite it with stale data), and `catchError` at the end of the inner pipe means one failed request becomes a typed `{error: string}` value flowing through the *same* stream rather than killing the subscription — the outer `combineLatest` subscription survives a failed request and will still react to the next filter change.

**`forkJoin`** (`job-list.ts`; all four dashboards): "wait for N independent requests, give me all N results together." Different from `combineLatest` in one important way: `forkJoin` only cares about each source's *final* value and completes once, which is correct when you're loading a fixed set of unrelated data once per page-load — `combineLatest` is for streams you expect to keep re-emitting.

**`interval(30000).pipe(startWith(0), switchMap(...))`** (`notification-bell.ts`): polls the unread-notification count every 30 seconds. `startWith(0)` is what makes it fire immediately on subscribe instead of waiting 30 seconds for the first count.

**`takeUntilDestroyed()`**: every recurring subscription in this codebase ends with it (verified by grepping the whole frontend for `combineLatest`/`toObservable`/`interval` usage without it — zero hits). It ties the subscription's lifetime to the injecting component's `DestroyRef`, so there's no manual `ngOnDestroy` + `Subject<void>` + `takeUntil(this.destroy$)` boilerplate anywhere in the app.

---

## Q&A bank

### Angular fundamentals

**1. What's a standalone component, and why does this whole project use them?**
- *Simple:* A component that declares its own imports instead of belonging to an `NgModule`.
- *Technical:* Standalone components, directives, and pipes list what they need directly in their `@Component({imports: [...]})` decorator. This removes the NgModule indirection layer entirely — no more `SharedModule` grab-bags, no more "why is this pipe not found" because some module forgot to export it.
- *WorkSphere example:* Every component in the project — there are zero `NgModule` declarations anywhere. `main.ts` bootstraps with `bootstrapApplication(App, appConfig)`.
- *Follow-up:* "What did NgModules give you that standalone doesn't?" — mainly a place to configure providers at a scope between "one component" and "the whole app," which route-level `providers` (see Q11) now covers for most real cases.

**2. What is zoneless change detection, and why did you turn it on?**
- *Simple:* Angular normally patches async browser APIs (`setTimeout`, `addEventListener`, promises) via Zone.js to know when to re-render; zoneless removes that and re-renders only when a Signal changes or an event handler runs.
- *Technical:* `provideZonelessChangeDetection()` (`app.config.ts`) means the framework has no zone.js patch at all — it's not even a dependency. Change detection is scheduled precisely from signal writes and DOM event bindings, which is both faster (no zone-triggered CD sweeps for irrelevant async work) and more predictable (you can reason about exactly what triggers a re-render).
- *WorkSphere example:* `app.config.ts` line with `provideZonelessChangeDetection()`; caught a real bug from *not* having it early on — using `provideZoneChangeDetection` by mistake caused an `NG0908` crash on boot that only a real browser load caught, not `ng build`.
- *Follow-up:* "Doesn't that mean every component needs `OnPush`?" — no, the opposite: in zoneless mode, every component already behaves like `OnPush`, because there's no zone sweep to fall back on. Explicitly setting the strategy is a no-op.

**3. Why does this project use `@Service()` instead of `@Injectable({providedIn: 'root'})`?**
- *Simple:* `@Service()` is Angular's newer, shorter way to declare a root-provided injectable — same effect, less ceremony.
- *Technical:* `@Injectable({providedIn: 'root'})` and `@Service()` both register a singleton in the root injector; `@Service()` is sugar that defaults to root scope without the object literal.
- *WorkSphere example:* Every `*-api.ts` file (`EmployeeApi`, `PayrollApi`, etc.), `TokenStorage`, `AuthFacade` — all root singletons via `@Service()`.
- *Follow-up:* "When would you *not* use root scope?" — a service that should be scoped per-route or per-component tree (rare here; nothing in this app needs that).

**4. How does lazy loading work in this app, and why does it matter?**
- *Simple:* Each feature route loads its component's JS only when the user navigates there, instead of all at once on first load.
- *Technical:* Every route in `app.routes.ts` uses `loadComponent: () => import('./features/.../x').then(m => m.X)`, which esbuild splits into its own chunk. The initial bundle only contains what's needed to render the login page and the shell.
- *WorkSphere example:* `app.routes.ts` — 40+ lazy chunks in the production build; `payroll-list` is a ~17KB chunk that never loads for a user who only visits their dashboard.
- *Follow-up:* "How would you preload routes a user is likely to visit next?" — `withPreloading(PreloadAllModules)` or a custom `PreloadingStrategy`, not used here since the app is small enough that on-demand loading is already fast.

**5. What's route-level `providers`, and why did you need it here?**
- *Simple:* A way to register a service/provider that's only available to one route (and its children), instead of the whole app.
- *Technical:* `provideCharts(withDefaultRegisterables())` registers Chart.js's controllers globally in the DI tree. Adding it to `app.config.ts` (root) pulled Chart.js into the *eager* main bundle, pushing it 38KB over the build budget — because a root-level provider can't be tree-shaken out of routes that never render a chart. Moving it to `providers: [provideCharts(...)]` on just the routes that use `BaseChartDirective` (dashboards, performance, recruitment) keeps it inside those lazy chunks only.
- *WorkSphere example:* `app.routes.ts` — `chartProviders` const, attached to 7 routes.
- *Follow-up:* "How did you find the budget regression?" — `ng build`'s own budget warning; it's a hard number (500KB warn / 1MB error) checked on every build, not something you'd notice by eyeballing bundle output.

**6. How does content projection work, and where do you use it?**
- *Simple:* `<ng-content>` lets a parent component insert arbitrary markup into a slot a child component defines.
- *Technical:* The child owns layout/chrome around the slot; the parent owns the actual content. `DataTable` is the clearest example of *why* this matters: it originally tried to own the `<table mat-table>` itself and receive column definitions via `@ContentChildren(MatColumnDef)` — that query doesn't reliably traverse an intermediate component's `<ng-content>` boundary, confirmed by two separate failed attempts. The fix was redesigning `DataTable` to only own the loading/empty-state chrome, with the caller always projecting its *entire* `<table mat-table>` including all column/row defs.
- *WorkSphere example:* `shared/ui/data-table/data-table.ts` (chrome only) + every list page's `.html` (owns and projects the actual table).
- *Follow-up:* "Why not use `@ContentChildren` at all then?" — it does work for direct children; the failure mode specifically was querying *through* an `<ng-content>` re-projection boundary, which is a documented Angular limitation, not a bug.

**7. What's a structural directive, and do you have a custom one?**
- *Simple:* A directive that adds or removes DOM based on a condition, like `*ngIf` or `*ngFor` — you write your own when you need conditional rendering logic that isn't already built in.
- *Technical:* `*appHasRole` (`shared/directives/has-role.ts`) takes a role (or role array) as input, reads the current role from `AuthFacade`, and uses `ViewContainerRef`/`TemplateRef` to create or clear the embedded view.
- *WorkSphere example:* `main-layout.html` — `<button *appHasRole="'ADMIN'">Admin Dashboard</button>` in the account menu.
- *Follow-up:* "Why a directive instead of just `@if (role() === 'ADMIN')` inline?" — reusability and readability at call sites that need it repeatedly; for a one-off check, the inline `@if` is genuinely simpler and used elsewhere in the app for exactly that reason (this project uses both, deliberately, depending on the situation).

**8. What custom pipes does this project have?**
- *Simple:* `salaryFormat` (currency display) and `employeeStatus` (label formatting).
- *Technical:* `SalaryFormatPipe` wraps `Intl.NumberFormat` to turn a Decimal-as-string (Prisma serializes `Decimal` fields to strings over JSON) into `"$98,000"`, safely handling `null`/`undefined`/non-numeric input with an em dash fallback rather than throwing.
- *WorkSphere example:* `shared/pipes/salary-format-pipe.ts`, used in `payroll-list.html`, `hr-dashboard.html`.
- *Follow-up:* "Why not just format it in the component?" — reusability (used in at least 3 unrelated components) and because a pipe is memoized by Angular based on its input reference, which is a minor perf win over recomputing in a template expression.

**9. What does `@for` with `track` buy you over the old `*ngFor`?**
- *Simple:* `track` tells Angular how to identify each item across re-renders, so it can reuse DOM nodes instead of tearing down and rebuilding the whole list.
- *Technical:* Without a stable track key (or with `track $index`, which is *not* stable if the array reorders), Angular can't tell that item 3 and item 5 swapped rather than being two brand-new items — it destroys and recreates DOM unnecessarily, which is both a perf cost and can lose component-local state (like a focused input) inside a list item.
- *WorkSphere example:* Every `@for` loop in the app tracks by a stable id (`track dept.id`, `track item.route`) — audited codebase-wide in Phase 9, zero loops without an explicit track expression.
- *Follow-up:* "When is `track $index` actually fine?" — when the list is never reordered/filtered in place, only ever fully replaced (e.g., a static list of enum options).

**10. Reactive Forms vs. template-driven forms — which does this project use, and why?**
- *Simple:* Reactive Forms everywhere — form state and validation live in the component class (`FormGroup`), not scattered across template directives.
- *Technical:* Reactive Forms give you a testable, synchronous `FormGroup` you can assert against without rendering a template, composable validators, and `valueChanges` as an actual Observable you can pipe through RxJS if needed.
- *WorkSphere example:* Every form in the app — `employee-form.ts`, `login.ts`, `leave-request-dialog.ts`, etc. — builds its form via `FormBuilder` in the class, never `ngModel`.
- *Follow-up:* "Have you used template-driven forms?" — be honest if not; the tradeoff to know is template-driven is simpler for a 2-field form and worse for anything with cross-field or conditional validation, which this app has plenty of.

### RxJS

**11. Explain `switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap`, and which does this app use.**
- *Simple:* All four flatten an outer Observable of Observables into one stream; they differ in what happens when a new outer value arrives before the previous inner Observable finished.
- *Technical:* `switchMap` cancels the previous inner subscription (use when only the latest result matters — a search-as-you-type request). `mergeMap` runs all inner subscriptions concurrently (use for independent parallel work where order and cancellation don't matter). `concatMap` queues them, running one at a time in order (use when order must be preserved, e.g. sequential writes). `exhaustMap` ignores new outer values while an inner one is still running (use to prevent double-submit, e.g. a save button).
- *WorkSphere example:* `switchMap` is used everywhere list pages combine filters into an HTTP call — a filter change should cancel, not queue behind, a slower stale request. The project doesn't currently have a case for `mergeMap`/`concatMap`/`exhaustMap`, which is itself a fair thing to say if asked — not every operator needs to appear in every app.
- *Follow-up:* "Where would `exhaustMap` fit if you added it?" — a save button's click handler, to make rapid double-clicks a no-op instead of firing two requests.

**12. Why put `catchError` *inside* the `switchMap`'s inner pipe instead of at the end of the whole chain?**
- *Simple:* So one failed request turns into an error *value* flowing through the stream, instead of an error that terminates the entire subscription.
- *Technical:* RxJS Observables complete-or-error exactly once; if `catchError` sits on the *outer* `combineLatest`/`switchMap` chain, the first HTTP failure would unsubscribe everything — the component would stop reacting to *any* future filter change, silently. Placing `catchError` inside the inner (per-request) pipe, returning `of({error: message})`, means the outer stream is untouched by that failure and stays subscribed for the next filter change.
- *WorkSphere example:* Every list page's constructor — `switchMap((filters) => this.api.list(filters).pipe(catchError((err) => of({error: extractErrorMessage(err)}))))`.
- *Follow-up:* "How do you tell success from failure in the subscribe callback then?" — a runtime `'error' in result` check, since the two branches have different shapes.

**13. What's the difference between `combineLatest` and `forkJoin`, concretely?**
- *Simple:* `combineLatest` re-emits every time *any* source emits again; `forkJoin` waits for every source to *complete* and emits once.
- *Technical:* `combineLatest` is for ongoing streams you want synchronized (three filter signals that can each change independently, forever). `forkJoin` is for a fixed batch of requests that each resolve once — it literally cannot be used with a source that never completes (like an interval), because it would never emit.
- *WorkSphere example:* `combineLatest` — `employee-list.ts`'s filter/page/pageSize signals. `forkJoin` — `job-list.ts` loading jobs and departments in parallel once per page visit; every dashboard's widget loading.
- *Follow-up:* "How did you verify the forkJoin calls actually run in parallel and not sequentially?" — a Playwright script logging each request's timestamp and confirming they land within single-digit milliseconds of each other, not one-after-another.

**14. What does `takeUntilDestroyed()` replace, and how does it work?**
- *Simple:* The manual pattern of a `Subject<void>` fired in `ngOnDestroy()` and piped through `takeUntil()` on every subscription.
- *Technical:* It's a `DestroyRef`-based operator — called with no injection context in a constructor/field initializer, it automatically finds the current component's `DestroyRef` and unsubscribes when that component is destroyed. No `ngOnDestroy` override needed.
- *WorkSphere example:* Every recurring subscription in the app.
- *Follow-up:* "What happens if you call it outside an injection context?" — it throws at runtime unless you explicitly pass a `DestroyRef`; this is one of the few operators that's injection-context-sensitive.

**15. What's the difference between a cold and a hot Observable? Give a WorkSphere example of each.**
- *Simple:* A cold Observable starts its work fresh for each subscriber; a hot Observable shares one ongoing execution across all subscribers.
- *Technical:* `HttpClient` requests are cold — each `.subscribe()` triggers its own HTTP call. `interval()` is also cold by default (each subscriber gets its own timer), but in `notification-bell.ts` there's only ever one subscriber, so this distinction doesn't practically matter there; a genuinely *hot* source in this app is the NgRx `Store` itself (via `store.select()`) and the Angular `Router`'s event stream — many independent subscribers (guards, interceptor, components) all observe the same underlying state without triggering it again per subscription.
- *WorkSphere example:* Cold — any `*-api.ts` method. Hot — `store.select(selectCurrentUser)`, consumed independently by `AuthFacade`, guards, and effects.
- *Follow-up:* "How would you make an HTTP call hot/shared?" — `shareReplay(1)`, not currently needed anywhere in this app since nothing subscribes to the same in-flight request from multiple places.

**16. Why does `SearchInput` own its own `debounceTime`/`distinctUntilChanged` instead of the parent list component owning it?**
- *Simple:* Separation of concerns — the search box knows *when* a value is "final enough to search for"; the parent knows *what to do* with that value.
- *Technical:* This also makes the debounce timing testable in complete isolation (see `search-input.spec.ts`, which uses `vi.useFakeTimers()` to assert on debounce behavior with zero HTTP mocking involved) and reusable without every consumer re-implementing the Subject/debounce plumbing.
- *WorkSphere example:* `shared/ui/search-input/search-input.ts` emits a plain `string` via `output()`; `employee-list.ts` and `global-search.ts` each independently turn that into their own `switchMap` pipeline.
- *Follow-up:* "Could you push the debounce all the way into a `toObservable` on a signal instead of a `Subject`?" — yes, and `global-search.ts` actually does exactly this on the *consuming* side (`toObservable(this.query).pipe(switchMap(...))`), reusing `SearchInput`'s debounce for the raw keystroke handling and layering its own switchMap on top.

**17. Why `startWith(0)` in the notification bell's polling pipeline?**
- *Simple:* Without it, `interval(30000)` doesn't emit anything until 30 seconds have passed, so the badge would show nothing on first load.
- *Technical:* `startWith` prepends a synchronous value to the front of the stream before the real source starts emitting, making `interval(30000).pipe(startWith(0), switchMap(...))` fire the request immediately on subscribe, then every 30s after.
- *WorkSphere example:* `shared/notifications/notification-bell/notification-bell.ts`.
- *Follow-up:* "How would you test this without waiting 30 real seconds?" — `vi.useFakeTimers()` + `vi.advanceTimersByTime(30000)`, exactly what `notification-bell.spec.ts` does.

**18. What would happen if you used `mergeMap` instead of `switchMap` in a list page's filter pipeline?**
- *Simple:* Every filter change would fire a *new* request without canceling the previous one, and responses could arrive out of order.
- *Technical:* If a user rapidly changes a filter twice, `mergeMap` runs both requests concurrently; if the *first* (now-stale) request's response arrives *after* the second, it would overwrite the table with outdated data — a real, user-visible bug, not just wasted bandwidth.
- *WorkSphere example:* This is exactly why every list page uses `switchMap`, not `mergeMap`, for its data-loading pipeline.
- *Follow-up:* "Is there anywhere `mergeMap` would actually be *correct* here?" — a case where every request's result is independently useful and order doesn't matter, like firing off several unrelated notifications — not a pattern this app currently needs.

### State management

**19. Why not put everything in NgRx, for consistency?**
- *Simple:* Because most state here is genuinely local, and routing it through actions/reducers/effects/selectors for a table's current page number adds indirection without adding value.
- *Technical:* NgRx earns its complexity when state is read by multiple, unrelated parts of the component tree, needs time-travel debugging, or benefits from a single, inspectable source of truth for something business-critical. A list's loading flag is none of those things — it's used by exactly one template, and testing it as a signal is simpler than testing an action/reducer/effect triad for the same information.
- *WorkSphere example:* Auth is NgRx; all ~20 list/detail/dashboard components' local state is Signals.
- *Follow-up:* "How do you decide the line, concretely?" — "does more than one component subtree, or a guard/interceptor outside the component tree entirely, need to read this?" If yes, it's a store candidate; if it's one component's own loading/error/data, it's a signal.

**20. Walk through what happens, end to end, when `AuthActions.login` is dispatched.**
- *Simple:* The effect calls the login API, stores the token, navigates, then dispatches a success or failure action that the reducer uses to update the store.
- *Technical:* `AuthEffects.login$` listens via `ofType(AuthActions.login)`, `switchMap`s into `AuthApi.login(request)`, and on success runs two `tap`s (persist the token, navigate) before `map`ping the response into `AuthActions.loginSuccess`; on failure, `catchError` maps into `AuthActions.loginFailure` with a sanitized message. The reducer handles both outcomes, setting `isAuthenticated`/`user`/`error` accordingly. Nothing outside the effect ever touches `TokenStorage` or `Router` directly for login.
- *WorkSphere example:* `core/state/auth/auth.effects.ts`, tested directly in `auth.effects.spec.ts` using `provideMockActions`.
- *Follow-up:* "Why do the side effects (`tap`) happen before mapping to the success action, not after?" — so they run exactly once per successful response regardless of how many things later subscribe to the resulting action stream; doing it in a reducer or a component subscription would either violate reducer purity or risk running twice.

**21. What's `AuthFacade`, and why does it exist instead of components injecting `Store` directly?**
- *Simple:* A wrapper that turns the NgRx store's `Auth` slice into Signals, so the rest of the app depends on a small typed surface instead of the whole store shape.
- *Technical:* `AuthFacade` exposes `currentUser`, `role`, `isAuthenticated`, `loading`, `error` as `toSignal(store.select(selector))`, plus `login()`/`logout()`/`register()` methods that dispatch actions. Every guard, interceptor-adjacent code, and component reads *this*, never `Store` or a selector directly.
- *WorkSphere example:* `core/state/auth/auth.facade.ts`; consumed by `auth-guard.ts`, `role-guard.ts`, `main-layout.ts`, every dashboard.
- *Follow-up:* "What does that buy you if you never plan to swap NgRx out?" — testability, mainly: every guard/component spec mocks a plain object (`{currentUser: () => testUser}`) instead of configuring a mock `Store` with selectors, which is considerably less test boilerplate across ~20 spec files.

**22. Why does `changePassword` return a 400 instead of a 401 when the current password is wrong?**
- *Simple:* Because the user *is* authenticated — they just got one field wrong — and a 401 has a specific, different meaning in this app: "your session is invalid, log in again."
- *Technical:* The global HTTP interceptor treats *any* 401 (outside the login/register endpoints) as an expired/invalid session and force-logs-out the user. If `changePassword` returned 401 for a wrong current-password, submitting that form with a typo would silently log the user out mid-flow — a confusing, wrong UX for a simple validation failure.
- *WorkSphere example:* `backend/src/services/auth.service.ts` — `changePassword`, with an inline comment explaining exactly this reasoning.
- *Follow-up:* "Is that a general principle or a one-off?" — general: this app uses status codes to mean specific *frontend behaviors* (401 → global logout, 403 → redirect to /forbidden, 422 → field-level form errors, 409 → conflict message), not just REST convention for its own sake.

### Forms

**23. How does the password strength validator work, and why is it a custom validator instead of a regex in the template?**
- *Simple:* A `ValidatorFn` that checks length + character-class requirements and returns a structured error object the template can read to show which specific rule failed.
- *Technical:* `shared/validators/password-strength.validator.ts` returns `null` (valid) or `{passwordStrength: {minLength: true, uppercase: true, ...}}` — multiple failures reported at once, not just a single boolean, so the UI can show a checklist rather than one generic "invalid password" message.
- *WorkSphere example:* Used in both `register.ts` and `employee-form.ts`'s (implicit, via the shared default password flow) — and mirrored server-side in `backend/src/validation/auth.validation.ts`'s `passwordSchema`, so a request that somehow bypassed the frontend can't create a weak password.
- *Follow-up:* "Why validate password strength on both ends instead of trusting the frontend?" — the frontend validator is UX (instant feedback); the backend one is the actual security boundary — anyone can call the API directly, bypassing the form entirely.

**24. What's a cross-field validator, and where's one used?**
- *Simple:* A validator on the *group*, not a single control, because it needs to compare two fields to each other.
- *Technical:* `shared/validators/password-match.validator.ts` is attached to the `FormGroup` (not an individual control) and compares `password`/`confirmPassword`, setting the error on the confirm field so it displays in the right place.
- *WorkSphere example:* `register.ts`'s form; also `leave-request-dialog.ts` has an inline cross-field check that `endDate >= startDate`.
- *Follow-up:* "Where does the error actually get displayed if it's set on the group, not a control?" — the validator explicitly writes the error onto the `confirmPassword` control's own errors via `setErrors()`, so the template's existing per-control error display just works without special-casing group-level errors.

**25. Describe the conditional validator in the employee form.**
- *Simple:* Salary is required for every employment type except `INTERN`.
- *Technical:* The form subscribes to `employmentType`'s `valueChanges` and calls `setValidators`/`updateValueAndValidity` on the `salary` control in response, rather than a static validator array that can't see another control's current value change over time.
- *WorkSphere example:* `features/employees/employee-form/employee-form.ts`.
- *Follow-up:* "Could this be a pure cross-field validator instead of a valueChanges subscription?" — yes, and that would avoid the manual `updateValueAndValidity` call, which is easy to forget; both approaches exist in real Angular codebases, this one predates the group-validator pattern being used elsewhere in the same project (a small, honest inconsistency worth noting if asked).

### Routing & guards

**26. How do `authGuard` and `roleGuard` differ, and why are they separate functions?**
- *Simple:* `authGuard` only checks "is anyone logged in"; `roleGuard` additionally checks "is it the *right* role for this route."
- *Technical:* Both are functional guards (`CanActivateFn`) reading `AuthFacade`. `authGuard` redirects to `/login?returnUrl=...` if unauthenticated. `roleGuard(allowedRoles)` is a factory — it first defers to the same "are you logged in" check, then redirects to `/forbidden` if the role doesn't match. Keeping them separate means routes that only need "any authenticated user" (rare in this app, since almost everything is role-scoped) don't have to pass a role list.
- *WorkSphere example:* `core/guards/auth-guard.ts`, `role-guard.ts`; every top-level route (`/admin`, `/hr`, `/manager`, `/employee`) uses `roleGuard([...])`.
- *Follow-up:* "Why `returnUrl` only on the auth redirect, not the role redirect?" — if you're logged in but lack the role, going back to that URL after "fixing" anything doesn't make sense — there's nothing to fix client-side; you'd need a different account.

**27. How does one `EmployeeList` component serve three different routes (`/admin/employees`, `/hr/employees`, `/manager/team`) with different behavior?**
- *Simple:* Route `data` tells the component which mode it's in; the component branches on that instead of three near-identical components existing.
- *Technical:* `app.routes.ts`'s `employeeRoutes(basePath, canManage)` helper generates the child routes for a given prefix, passing `{basePath, canManage}` as route `data`. The component reads `this.route.snapshot.data['canManage']` once in its constructor to decide whether to render add/edit/delete controls, and uses `basePath` to build correct links (since `/admin/employees/:id` and `/hr/employees/:id` are different URLs for conceptually the same detail view).
- *WorkSphere example:* `features/employees/employee-list/employee-list.ts` + `app.routes.ts`'s `employeeRoutes()`. The same pattern repeats for `AttendanceList` (`scope: 'self' | 'scoped'`), `LeaveList` (`mode: 'self' | 'review'`), `PerformanceList` (`mode: 'self' | 'team'`), `PayrollList` (`mode: 'self' | 'manage'`), `DocumentList`, `AnnouncementList`.
- *Follow-up:* "Why not three separate thin wrapper components instead?" — that was considered and rejected early on specifically because the *only* difference is scope/permissions, not markup or logic — three components would mean every future bugfix or feature needs to land three times.

**28. Why is `provideNativeDateAdapter()` a per-component provider instead of global?**
- *Simple:* It's only needed by components that actually use a `mat-datepicker`, so it's scoped to those.
- *Technical:* Providing it at the component level (`@Component({providers: [provideNativeDateAdapter()]})`) rather than in `app.config.ts` keeps the date-adapter code out of components that never render a datepicker, following the same "don't pay for what you don't use in the eager/every-route bundle" principle as the chart providers.
- *WorkSphere example:* `interview-dialog.ts`, `payroll-form-dialog.ts`, `announcement-form-dialog.ts` — each declares it independently.
- *Follow-up:* "Isn't that a lot of repetition across dialogs?" — yes, and it's a defensible tradeoff (explicit dependency per component vs. one global provider costing nothing measurable) — a case where either answer is reasonable, worth acknowledging rather than overclaiming one is strictly better.

**29. How would you add a fifth role to this app, end to end?**
- *Simple:* Add it to the `Role` enum in Prisma, add its nav config, add its guarded route tree, and decide what each existing service's RBAC branch does for it.
- *Technical:* Concretely: (1) `schema.prisma`'s `Role` enum + a migration, (2) every backend service's role-branching `if` statements need a decision for the new role (this is the part that's easy to miss — a role with *no* explicit branch in, say, `leaveService.list`'s scoping falls through to the "see everything" `else` branch by default in this codebase's current pattern, which is worth being careful about), (3) frontend `Role` type + `NAV_ITEMS_BY_ROLE`, (4) a new top-level guarded route tree in `app.routes.ts`.
- *WorkSphere example:* N/A (hypothetical) — but the *shape* of the answer is directly visible by reading how the existing four roles are threaded through `nav-items.config.ts`, `app.routes.ts`, and any one service like `leave.service.ts`.
- *Follow-up:* "What's the risk in step 2 you just flagged?" — an `if/else if/else` RBAC chain that defaults to "unrestricted" for any unhandled role is a real footgun; a safer pattern is an exhaustive `switch` with a `default: throw` so a new role *can't* silently inherit the widest access by accident. Worth naming as a concrete thing you'd harden if you owned this longer-term.

### Backend & API design

**30. Why the routes → controllers → services → repositories split, instead of putting logic straight in route handlers?**
- *Simple:* Each layer is independently testable and reusable, and the split makes it obvious where a given kind of logic belongs.
- *Technical:* Controllers only know about HTTP (`req`/`res`); services only know about business rules and never see `req`/`res` (they take plain `{userId, role}` and return DTOs); repositories only know about Prisma queries. A service can be unit-tested with no HTTP framework in scope at all; a repository's query shape can change without any service code changing, as long as the returned shape stays the same.
- *WorkSphere example:* 12 of the backend's resources follow this exact four-file structure; `search` and `dashboard` are the exceptions — both are read-only aggregations across multiple models with no single CRUD resource to own a repository, so their services query `prisma` directly instead.
- *Follow-up:* "Isn't that a lot of files for a simple CRUD endpoint?" — yes, and for a true one-off script that'd be overkill; the payoff shows up specifically when the same scoping logic (like `resolveTeamEmployeeIds`) needs to be reused across multiple services, which happens constantly in this app (attendance, leave, performance, payroll, documents all need "what are this manager's direct reports' IDs").

**31. How is RBAC actually enforced — walk through one concrete example.**
- *Simple:* `leaveService.list()` takes the requester's role and narrows its own database query — an EMPLOYEE only ever gets a `WHERE employeeId = <their own>` clause added, a MANAGER gets `WHERE employeeId IN (<their team's ids>)`, and ADMIN/HR get no extra filter at all.
- *Technical:* This means the *same* `GET /api/leaves` endpoint returns fundamentally different result sets depending on who's asking, computed by adding to a mutable `Prisma.LeaveRequestWhereInput` object based on `requester.role`, rather than three different endpoints or a permissions table.
- *WorkSphere example:* `backend/src/services/leave.service.ts`'s `list()` method.
- *Follow-up:* "Why not a generic policy/permissions library instead of hand-written `if`s per service?" — a fair critique at larger scale; for this app's size, hand-written scoping is more legible (you can read exactly what a MANAGER sees for leave by reading one function) than tracing through a generic policy engine's rule resolution.

**32. Why does the API layer never trust a client-supplied `netSalary`, even from an HR user submitting the correct number?**
- *Simple:* Because a derived value should never be user input — it should always be computed by the server from the inputs that actually determine it.
- *Technical:* `payrollService`'s `computeNetSalary()` recalculates `basicSalary + allowances + bonuses - deductions - tax` server-side on every create *and* update, discarding whatever (if anything) the client sent for `netSalary`. This closes off an entire class of bugs and exploits: a client bug that computes the number wrong, or a malicious request that sends a fabricated `netSalary` while a legitimate `basicSalary`, would otherwise both silently corrupt payroll records.
- *WorkSphere example:* `backend/src/services/payroll.service.ts`'s `computeNetSalary()`, called from both `create()` and `update()`.
- *Follow-up:* "What's the general principle this is an instance of?" — never trust the client for anything the server can derive itself; the client can *display* a derived value, but the server must be the one source of truth for what that value actually is.

**33. What does the Zod `validate()` middleware actually do, and why store the result on `req.validated` instead of reassigning `req.query`?**
- *Simple:* It parses `{body, query, params}` against a schema and returns a `422` with field-level errors if invalid; the parsed (and coerced/defaulted) result is stored on a new `req.validated` property.
- *Technical:* Express 5 exposes `req.query` as a getter-only property in some configurations, so directly reassigning `req.query = parsed.query` can throw or silently fail depending on the Express version's internals. Storing the validated, coerced result separately (`req.validated.query`) sidesteps that entirely and makes it explicit in every controller which values have actually been through validation versus the raw, unchecked `req.query`.
- *WorkSphere example:* `backend/src/middleware/validate.ts`; every controller reads `req.validated?.query` / uses `req.body` (which validate() *does* safely reassign, since `req.body` isn't a getter).
- *Follow-up:* "What happens to `req.params` then?" — same treatment, available at `req.validated.params`; `requireParam(req, 'id')` is a small helper that reads from there with a runtime guard against `undefined`.

**34. Why is the HTTP error response shape the same (`{error: {message}}`) for every status code, and why are 500s always masked?**
- *Simple:* One consistent shape means the frontend has exactly one utility function (`extractErrorMessage`) to extract a user-facing message from *any* failed request, instead of per-endpoint special-casing.
- *Technical:* `errorHandler` middleware checks `err instanceof ApiError` — if so, its `.status` and `.message` are used as-is (these are always deliberately-thrown, safe-to-show messages like "Invalid email or password"); any other thrown value (a Prisma error, a `TypeError`, anything unexpected) becomes a 500 with a hardcoded generic message, regardless of what the real error said. The real error is still logged server-side (unconditionally, as of the Phase 9 hardening pass — it used to only log in `NODE_ENV === 'development'`, which meant a production 500 left zero trace).
- *WorkSphere example:* `backend/src/middleware/errorHandler.ts`, `frontend/src/app/core/utils/http-error.util.ts`.
- *Follow-up:* "Why mask 500s specifically, but not 400/401/403/404/409?" — those are all deliberately-thrown `ApiError`s with messages written to be shown to a user ("Current password is incorrect"); a 500 means something *unexpected* happened, and an unexpected error's message might contain internal details (a stack trace fragment, a raw DB constraint name) that shouldn't leak to a client.

**35. Why did you choose a layered architecture instead of, say, a single service function per route that does everything?**
- *Simple:* Because RBAC scoping logic is reused across almost every resource, and keeping it in a `service` layer (rather than repeated in each controller) means writing it once.
- *Technical:* `resolveEmployeeId`/`resolveTeamEmployeeIds`/`resolveUserForEmployeeId` (`employee-scope.util.ts`) are called from `attendance`, `leave`, `performance`, `payroll`, `document`, and `dashboard` services — six independent resources needing "which employee record does this JWT belong to, and who reports to them." Without a shared layer, that logic (or worse, subtly *different* versions of it) would be duplicated six times.
- *WorkSphere example:* `backend/src/services/employee-scope.util.ts`.
- *Follow-up:* "What's the risk of over-centralizing shared logic like this?" — a change to `resolveTeamEmployeeIds` now has blast radius across six services; that's the right tradeoff here because "who are this manager's direct reports" really should mean the same thing everywhere, but it's worth being able to name the coupling it creates.

### Database & Prisma

**36. Why is `User` a separate model from `Employee`, instead of one combined table?**
- *Simple:* Because not every login account is necessarily a line-org employee, and login/auth concerns shouldn't be mixed into HR data queries.
- *Technical:* `User` holds identity/auth fields (`email`, `passwordHash`, `role`); `Employee` holds org data (`department`, `manager`, `salary`, `status`) and is 1:1-related to `User` via `userId`. This also means an `Employee` record can exist with minimal org data (like the seeded Admin account, which has no department) without any auth-table weirdness.
- *WorkSphere example:* `prisma/schema.prisma` — `User.employee` / `Employee.user` 1:1 relation.
- *Follow-up:* "What's the downside of splitting them?" — an extra join for anything that needs both identity and org data at once (which is most queries) — `employee.repository.ts`'s `include: {user: {...}}` on every query is the direct cost of that split.

**37. Why does `Payroll` have a dedicated `@@index([month])` in addition to the composite `@@unique([employeeId, month])`?**
- *Simple:* Because a composite index can only efficiently serve queries that filter by its *first* column (or both), not its second column alone — and the dashboard's payroll summary filters by `month` alone, company-wide.
- *Technical:* A btree composite index on `(employeeId, month)` supports "leftmost prefix" queries: filtering by `employeeId` alone works, filtering by `employeeId AND month` works, but filtering by `month` alone can't use that index at all — Postgres would fall back to a full table scan. `dashboard.service.ts`'s `getPayrollSummary()` does exactly that (`WHERE month = <this month>`, no `employeeId` filter, since it's company-wide), so it needed its own index.
- *WorkSphere example:* `prisma/schema.prisma`'s `Payroll` model, `@@index([month])` — added specifically after auditing every Prisma query against its available indexes in Phase 9.
- *Follow-up:* "How did you find this?" — by going through every `findMany`/`groupBy`/`aggregate` call in the codebase and checking its `where` clause against the schema's declared indexes, not a profiler — the dataset is far too small in this app for a slow-query log to have caught it.

**38. What's the Prisma 7 driver adapter pattern, and why is it used here instead of the older connection-string-only setup?**
- *Simple:* Prisma 7 requires explicitly passing a "driver adapter" object (here, `@prisma/adapter-pg`, a thin wrapper around `node-postgres`) to `new PrismaClient()`, instead of Prisma managing the connection internally from just a URL.
- *Technical:* `lib/prisma.ts` constructs `new PrismaPg({connectionString: env.DATABASE_URL})` and passes it as `new PrismaClient({adapter})`. This is a genuine Prisma 7 breaking change from earlier versions (schema no longer takes a `url` directly in the `datasource` block either — that moved to `prisma.config.ts`), part of Prisma's move toward pluggable database drivers (the same pattern supports other databases' adapters without changing application code).
- *WorkSphere example:* `backend/src/lib/prisma.ts`, `backend/prisma.config.ts`.
- *Follow-up:* "What would change if you moved to a serverless Postgres provider like Neon?" — likely just swapping `@prisma/adapter-pg` for `@prisma/adapter-neon` and the connection string — the adapter pattern exists specifically to make that a contained change.

**39. How do you avoid N+1 queries in this codebase?**
- *Simple:* By defining each model's `include` shape once, in its repository, and always fetching related data in the same query rather than looping and fetching per-row.
- *Technical:* Every repository defines a `<model>WithRelations` Prisma `include` object once (e.g. `employeeWithRelations` in `employee.repository.ts`) and reuses it across `findMany`/`findById`/`create`/`update` — so a list of 20 employees with their department and manager names is always one query with joins, never 20 queries plus 1.
- *WorkSphere example:* Every `*.repository.ts` file's `const xWithRelations = {include: {...}} satisfies Prisma.XDefaultArgs`.
- *Follow-up:* "How would you catch an N+1 if one slipped in?" — Prisma's query logging (`log: ['query']` on the client) during development, or in a real production setup, an APM tool tracking query count per request.

**40. Why use `groupBy` for dashboard aggregates instead of fetching all rows and counting in JavaScript?**
- *Simple:* Mostly *not* used that way, actually — this app does both, deliberately, depending on the query.
- *Technical:* `employee-summary` and `leave-summary` use Prisma's `groupBy` (pushes the counting into Postgres, returns only the aggregate rows). `employee-growth` and `payroll-summary`'s department breakdown fetch raw rows and bucket them in JavaScript instead, because grouping by a *derived* bucket (a month computed from a date, or a department *name* reached through a relation rather than a scalar column) isn't something Prisma's `groupBy` can express directly — it only groups by actual columns on the queried table.
- *WorkSphere example:* `backend/src/services/dashboard.service.ts` — compare `getEmployeeSummary` (uses `groupBy`) to `getEmployeeGrowth`/`getPayrollSummary` (fetch + JS bucket).
- *Follow-up:* "Isn't fetching-then-bucketing in JS worse for large datasets?" — yes, and it's a conscious tradeoff at this data volume (tens of rows); the honest answer for "at 10x the scale" is a raw SQL query with `DATE_TRUNC`/a join-based `GROUP BY`, which Prisma supports via `$queryRaw` when its query builder genuinely can't express what you need — not used here since it wasn't needed yet.

**41. Why are migrations checked into git instead of just using `prisma db push`?**
- *Simple:* Migrations are an ordered, reviewable history of every schema change, applied identically in every environment; `db push` just force-syncs the schema with no history and no rollback path.
- *Technical:* Each `npx prisma migrate dev --name <x>` run in this project generated one migration — 6 total across the phases that touched the schema (initial users/auth, department+employee, attendance+leave, performance+recruitment+payroll together, documents+announcements+notifications together, and one later index-only fix) — and the Docker image's entrypoint runs `prisma migrate deploy` (the production-safe, non-interactive equivalent) before starting the server, so a deployment's schema state is always reproducible from git history, not from whatever `db push` happened to sync last.
- *WorkSphere example:* `backend/prisma/migrations/` — one directory per phase's schema additions; `backend/Dockerfile`'s `CMD`.
- *Follow-up:* "What's `db push` actually for, then?" — fast local prototyping before you've decided on a schema shape worth committing to migration history — genuinely useful earlier in a schema's life, wrong for anything past that.

### Auth & security

**42. Walk through exactly how a password goes from a login form to a stored hash and back.**
- *Simple:* The frontend never sees or stores a hash; the backend hashes on register, compares on login, and only ever sends back a signed JWT, never the password or hash.
- *Technical:* `hashPassword()` wraps `bcrypt.hash(plain, 10)` (10 salt rounds); `comparePassword()` wraps `bcrypt.compare`. The JWT payload is intentionally minimal — `{sub: userId, role}` — nothing sensitive, since JWTs are only signed, not encrypted, and are technically readable (base64, not secret) by anyone who intercepts one.
- *WorkSphere example:* `backend/src/lib/password.ts`, `backend/src/lib/jwt.ts`.
- *Follow-up:* "Why 10 salt rounds specifically?" — bcrypt's standard recommended default for an interactive login flow — balances hashing cost (a few hundred ms) against brute-force resistance; higher costs more latency per login with diminishing security return for this threat model.

**43. How does this app prevent user enumeration on login?**
- *Simple:* "Wrong email" and "wrong password" return the exact same error message and status code, so an attacker can't tell which one was wrong.
- *Technical:* `authService.login()` throws the identical `ApiError.unauthorized('Invalid email or password')` whether `findByEmail` returned nothing *or* the password comparison failed — there's no separate code path or timing difference an attacker could use to distinguish "this email doesn't exist" from "this email exists but the password's wrong."
- *WorkSphere example:* `backend/src/services/auth.service.ts`'s `login()`.
- *Follow-up:* "Does `register` have the same protection?" — no, deliberately not — it returns a distinct 409 "an account with this email already exists," which is a common, accepted tradeoff (most real signup forms do this for UX clarity) since the information disclosed is much lower-value than a login-enumeration vector.

**44. What's rate limiting protecting against here, and what would happen without it?**
- *Simple:* Brute-force password guessing against `/auth/login` and account-spam against `/auth/register`.
- *Technical:* `express-rate-limit` caps each IP to `AUTH_RATE_LIMIT_MAX` (20) requests per `AUTH_RATE_LIMIT_WINDOW_MS` (15 minutes) window, specifically on those two routes — not globally, since rate-limiting every authenticated API call would be a different (and here, unnecessary) concern.
- *WorkSphere example:* `backend/src/middleware/rateLimit.ts`, applied in `auth.routes.ts`.
- *Follow-up:* "What's a weakness of IP-based rate limiting?" — shared IPs (corporate NAT, university networks) can hit the limit from unrelated users' legitimate traffic; a more robust setup would combine IP-based limiting with per-account lockout after N failures.

**45. Why is CORS locked to one specific origin instead of using a wildcard?**
- *Simple:* A wildcard (`*`) would let *any* website's JavaScript make authenticated requests to this API on a logged-in user's behalf.
- *Technical:* `cors({origin: env.CORS_ORIGIN})` only allows the configured frontend origin to make cross-origin requests with credentials; in production, the frontend and backend are actually same-origin anyway (nginx proxies `/api` — see the Docker section of the README), so CORS is mostly a development-mode (`localhost:4200` → `localhost:4000`) concern here, but the code doesn't special-case that away.
- *WorkSphere example:* `backend/src/app.ts`, `env.CORS_ORIGIN` (Zod-validated, no default that resolves to `*`).
- *Follow-up:* "If CORS doesn't matter in production because of the proxy, why keep it locked down at all?" — defense in depth — someone could still reach the backend directly on its own port/host even with the proxy in front of it, and there's no reason to leave that path open.

**46. How is XSS prevented in this app, given it renders a lot of user-submitted content (announcement text, leave reasons, document titles)?**
- *Simple:* By never using `innerHTML` or `bypassSecurityTrust*` anywhere — all content goes through Angular's default template interpolation, which auto-escapes.
- *Technical:* `{{ announcement.content }}` in a template is always HTML-escaped by Angular before insertion into the DOM; verified by a codebase-wide grep in Phase 9 confirming zero `innerHTML`/`bypassSecurityTrust` usage anywhere in the frontend. There was never a need to render user content as raw HTML, so the safe default was never worked around.
- *WorkSphere example:* Every template that displays user-submitted text (`announcement-list.html`, `leave-list.html`, etc.).
- *Follow-up:* "What if you *did* need to render some user-submitted HTML (rich text)?" — `DomSanitizer.sanitize()` at minimum, ideally a dedicated sanitization library and a strict allowlist of tags — never raw `innerHTML` with unsanitized input.

**47. How is SQL injection prevented?**
- *Simple:* By using Prisma exclusively — every query is parameterized automatically, and the codebase never drops down to raw SQL.
- *Technical:* Prisma's query builder generates parameterized queries under the hood for every `findMany`/`where`/etc. call; verified by a codebase-wide grep confirming zero `$queryRaw`/`$executeRaw` usage anywhere in the backend.
- *WorkSphere example:* Every `*.repository.ts` file.
- *Follow-up:* "When would you reach for `$queryRaw` despite the risk?" — a query Prisma's builder genuinely can't express (complex window functions, certain full-text search queries) — and even then, always with Prisma's tagged-template parameterization (`` prisma.$queryRaw`...${value}...` ``), never manual string concatenation.

**48. What does the auth interceptor do on a 401 vs. a 403, and why the difference?**
- *Simple:* A 401 means "you're not properly logged in" → force logout and redirect to `/login`. A 403 means "you're logged in, but not allowed to do this" → redirect to `/forbidden`, session untouched.
- *Technical:* `authInterceptor` checks the error status: 401 (excluding the login/register endpoints themselves, where it's just a bad-credentials response) dispatches `AuthActions.logout()`. 403 calls `router.navigateByUrl('/forbidden')` directly, without touching the auth store at all — the user stays logged in and can navigate elsewhere in the app they *do* have access to.
- *WorkSphere example:* `core/interceptors/auth-interceptor.ts`, fully covered in `auth-interceptor.spec.ts`.
- *Follow-up:* "How did you verify this in a real browser, not just unit tests?" — a Playwright script that logs in, corrupts the stored token in `localStorage`, triggers a request, and asserts the resulting redirect — catches integration issues a unit test driving the interceptor function directly can't (e.g. a wrong event name in a template wiring it up, which is a real bug this project's testing caught in the notification bell, see Q57).

**49. Does the frontend enforce anything the backend doesn't also enforce?**
- *Simple:* No — the frontend's role checks and guards are UX conveniences; every one has a matching, independently-enforced check on the backend.
- *Technical:* This was explicitly verified in Phase 9 with real `curl` requests: missing token, malformed token, wrong-signature token, and an expired-but-correctly-signed token all correctly return 401; a valid token for the wrong role returns 403 — none of this relies on the frontend having been well-behaved.
- *WorkSphere example:* Any backend `authorize(...)` call paired with the frontend `roleGuard` for the same route — e.g. `/api/payroll`'s POST/PUT/DELETE routes vs. `PayrollList`'s `mode === 'manage'` check.
- *Follow-up:* "Can you give a concrete example of frontend-only convenience vs. backend-enforced rule?" — hiding the "Delete" button for a document you don't own is frontend convenience (an EMPLOYEE could theoretically still try the DELETE request directly); the backend rejecting that request with 403 if you're not the uploader (or HR/Admin) is the actual rule.

### Testing

**50. What's actually covered by the 280+ frontend tests, and what's the general pattern?**
- *Simple:* Every component's success/error/empty states, every API service's request shape, both guards, the auth interceptor, and the NgRx auth effects.
- *Technical:* The dominant pattern is a `configure()` helper per spec file that builds stubbed dependencies (`vi.fn()`-based, not deep mocking libraries) and returns `{fixture, component, ...stubs}`, then individual `it()`s assert on component state after `fixture.detectChanges()`. API service specs use `HttpTestingController` to assert on the actual request (method, URL, params) without touching a real network.
- *WorkSphere example:* Any `*.spec.ts` in the codebase follows this shape; `employee-list.spec.ts` is a representative example of the pattern at its most complete (search, filter, sort, pagination, CRUD success/failure).
- *Follow-up:* "Why stub dependencies by hand instead of a mocking library?" — for this app's scale, hand-written stub objects are more legible in the test itself (you see exactly what's mocked and returned, right there) than a mocking library's more implicit setup — a reasonable choice that would be worth revisiting on a much larger test suite.

**51. Why does `notification-bell.spec.ts` use `vi.useFakeTimers()`?**
- *Simple:* Because the component polls every 30 real seconds, and the test needs to assert on the *second* poll without actually waiting 30 seconds.
- *Technical:* `vi.useFakeTimers()` (called before the component is created, since the `interval()` subscription starts in the constructor) lets the test call `vi.advanceTimersByTime(30000)` to synchronously fast-forward RxJS's `asyncScheduler`-based timers and assert the API was called a second time.
- *WorkSphere example:* `shared/notifications/notification-bell/notification-bell.spec.ts`; the same pattern first appeared in `search-input.spec.ts` for testing `debounceTime`.
- *Follow-up:* "What's a pitfall of fake timers you have to watch for?" — forgetting `vi.useRealTimers()` in `afterEach` leaks fake time into unrelated tests run after it in the same file.

**52. How do you test a functional route guard, given it's just a function, not a class with a testable interface?**
- *Simple:* Call it inside `TestBed.runInInjectionContext()`, since guards rely on `inject()` internally and need a real (or test) DI context to resolve their dependencies.
- *Technical:* `TestBed.runInInjectionContext(() => authGuard(...args))` lets the guard function run exactly as the router would invoke it, with `AuthFacade` resolved from the test's configured providers (a plain stub object, not a real facade) — no router navigation actually needs to happen for the test.
- *WorkSphere example:* `core/guards/auth-guard.spec.ts`, `role-guard.spec.ts`.
- *Follow-up:* "How do you assert on a redirect without a real router navigating anywhere?" — the guard returns a `UrlTree` (via `router.createUrlTree(...)`) rather than performing the navigation itself; the test asserts on the returned `UrlTree`'s serialized form (`router.serializeUrl(result)`).

**53. How do you unit-test an NgRx effect without a real backend or a real Store?**
- *Simple:* `provideMockActions` lets you feed a fake stream of actions into the effect and observe what it does/dispatches in response, with every dependency (the API, TokenStorage, Router) stubbed.
- *Technical:* `auth.effects.spec.ts` provides a `Subject` as the mock actions stream, stubs `AuthApi`/`TokenStorage`/`Router`, then for each test: subscribes to the effect (via `firstValueFrom`), pushes one action into the `Subject`, and asserts on both the emitted result action *and* the side effects (token stored, navigation called) that happened along the way.
- *WorkSphere example:* `core/state/auth/auth.effects.spec.ts`.
- *Follow-up:* "You have effects marked `{dispatch: false}` (redirectAfterRegister$, logout$) — how does testing those differ?" — the Observable still emits a value even with `dispatch: false` (that flag only controls whether `EffectsModule` auto-dispatches whatever it emits, not whether the source emits at all) — the test still subscribes and asserts on side effects, it just doesn't assert on a resulting *action* the way the dispatching effects' tests do.

**54. Why does this project have zero backend automated tests, and is that defensible?**
- *Simple:* Every backend behavior was verified with real `curl` requests against the running API instead — defensible for this project's constraints, not a best practice to repeat by default.
- *Technical:* Each phase's implementation was followed by hand-written `curl` sessions hitting every new/changed endpoint: success cases, validation failures (422), RBAC boundaries (401/403), conflict cases (409), and edge cases specific to that feature (e.g. double-approving a leave request, a manager trying to review someone outside their team). This is real verification, but it's not *automated* — nothing re-runs it on a future change, so a regression wouldn't be caught until manually re-tested.
- *WorkSphere example:* Every phase's git commit message documents the specific curl scenarios verified for that phase's endpoints.
- *Follow-up:* "What would you add first if you kept working on this?" — Vitest (or Jest) integration tests hitting a real (test) database per service, starting with the RBAC-scoping logic specifically, since that's the highest-value, most regression-prone code in the backend.

### System design

**55. If WorkSphere needed to support 10x the current data volume, what breaks first?**
- *Simple:* The dashboard aggregates that fetch-and-bucket in JavaScript (`employee-growth`, `payroll-summary`'s department breakdown), and global search's `contains`-based text matching.
- *Technical:* Both currently do work in Node that should move into the database at real scale — the growth/payroll bucketing should become a raw SQL query with `DATE_TRUNC`/`GROUP BY`, and search should move from `contains` (a sequential scan at scale) to a proper full-text index (`pg_trgm` or Postgres's built-in `tsvector`/`tsquery`).
- *WorkSphere example:* `backend/src/services/dashboard.service.ts`, `search.service.ts` — both explicitly called out in the README's "Known limitations" section.
- *Follow-up:* "What wouldn't need to change?" — the RBAC scoping pattern (it's just a `WHERE` clause, indexed appropriately) and the layered architecture generally — those don't get worse with scale, they just need the specific queries within them optimized.

**56. Why did you choose Prisma over a raw SQL query builder or an ORM like TypeORM?**
- *Simple:* Type safety generated directly from the schema (the `Prisma.XWhereInput` types used throughout every service are auto-generated, not hand-maintained), and a migration workflow that fits a solo/small-team project well.
- *Technical:* Every service function's `where` object is fully typed against the actual schema — a typo in a field name or a type mismatch (e.g. passing a string where the schema expects a `Decimal`) is a compile error, not a runtime surprise. The tradeoff, honestly, is Prisma 7's config/adapter changes added real friction during this project (see Q38) compared to a more stable, older ORM.
- *WorkSphere example:* Any service's `Prisma.EmployeeWhereInput`-typed `where` variable.
- *Follow-up:* "What would make you choose differently next time?" — a project with genuinely complex, hand-tuned queries (heavy use of window functions, recursive CTEs) might be better served by a lighter query builder (Kysely, Drizzle) that gets out of the way more for raw SQL, at the cost of Prisma's schema-driven type generation.

**57. Tell me about a real bug you caught, and how you caught it.**
- *Simple:* The notification bell's panel always showed "you're all caught up" even when the unread badge showed a real count, because `(opened)` was bound on `<mat-menu>` in the template — but that output doesn't exist there; it's `menuOpened`, and it lives on the *trigger* directive on the button, not the menu panel itself.
- *Technical:* The component's `onPanelOpened()` method (which fetches recent notifications) was correctly written and even had a passing unit test — but the unit test called the method *directly*, bypassing the template entirely, so it never exercised the actual event binding. Only a real browser click, driven by Playwright, surfaced it: the panel opened, but the fetch never fired.
- *WorkSphere example:* `shared/notifications/notification-bell/notification-bell.html` — the fix moved `(menuOpened)="onPanelOpened()"` from `<mat-menu>` onto the `<button [matMenuTriggerFor]="panel">`.
- *Follow-up:* "What does this tell you about test coverage in general?" — a unit test calling a component method directly proves the *method* works; it proves nothing about whether the *template* actually wires that method up to the right event. This project's whole verification approach (real curl for the backend, real headless-browser walkthroughs for the frontend, on top of unit tests) exists specifically because of bug classes like this one.

**58. How does this app's error/loading/empty state pattern stay consistent across ~20 different list pages without copy-pasting the same boilerplate everywhere?**
- *Simple:* A shared `DataTable` component owns the loading-skeleton/empty-state chrome, and every list page follows the identical `loading`/`error`/`data`/`total` signal shape, so the pattern is consistent by convention even without a shared base class.
- *Technical:* Deliberately *not* a base class or generic composable — Angular's signal-based components don't lend themselves to inheritance-based sharing as cleanly as the "same shape, small enough to just repeat" approach used here. The `DashboardWidget` component (Phase 8) is the one place this got extracted further, specifically because dashboards had 3-7 near-identical chart-loading states each — past the point where repeating it was clearly worse than a small wrapper.
- *WorkSphere example:* `shared/ui/data-table/data-table.ts` (list pages), `shared/ui/dashboard-widget/dashboard-widget.ts` (dashboard charts).
- *Follow-up:* "How do you decide when repetition should become an abstraction?" — the `DashboardWidget` decision is a good concrete example: it existed only after the *third* dashboard needed the identical loading/empty/content wrapper around a chart — abstracting after the pattern proves out, not before, to avoid guessing wrong about what the shared shape should be.

**59. What would you do differently if you started this project over?**
- *Simple:* Make employee `joiningDate` and other "demo-realism" dates relative-to-seed-time from the very first phase, instead of retrofitting it in Phase 8 once a dashboard chart needed it.
- *Technical:* The fixed historical dates (`'2019-04-08'`, etc.) seemed reasonable when only Employee CRUD existed; the actual cost only showed up four phases later when a chart needed "hires in the last N months" to have any real data relative to whenever the seed script runs. `LeaveRequest`'s seed data has the same latent issue today and was deliberately *not* fixed (documented in the README's known limitations) to avoid scope-creeping a later phase.
- *WorkSphere example:* `backend/prisma/seed.ts`'s `monthsAgoISO()` helper (added Phase 8) vs. `LeaveRequest`'s still-fixed-offset seed dates.
- *Follow-up:* "Is that really a design mistake, or just normal incremental development?" — arguably the latter — you can't always know which "reasonable-at-the-time" decision will need revisiting until a later feature depends on it differently; the useful skill isn't avoiding this entirely, it's noticing it quickly and fixing the *one* instance that actually matters (the growth chart) without over-correcting into fixing every date field defensively.

**60. Where's the line between "MVP scope" and "cut corner" in this project, and can you defend a few specific calls?**
- *Simple:* MVP scope = a real, working, honestly-documented boundary (no email delivery, no backend test suite); cut corner = something silently broken or misleading. This project has several of the former and tries hard to avoid the latter.
- *Technical, with three defenses:* (1) No password-reset email flow — `employee.service.ts` assigns a default password instead, with an inline comment explaining a real system would email an invite link; that's an honest scope boundary, not a hidden gap. (2) The Docker backend image ships `prisma`'s full devDependency tree (including its React-based Studio tooling) into the "runtime" image rather than a leaner prod-only install — documented in the Dockerfile itself as a known tradeoff, with the reasoning for why it's low-risk (never executed at runtime) rather than silently ignored. (3) Global search uses `contains` instead of a full-text index — fine at seed-data volume, explicitly called out as a scaling limitation rather than presented as production-ready.
- *WorkSphere example:* All three are called out by name in the README's "Known limitations & future improvements" section — the point being that a reviewer shouldn't have to *discover* these; they're stated up front.
- *Follow-up:* "What's an example of something you *didn't* cut, that you could have?" — RBAC scoping is fully server-enforced everywhere, never just a frontend guard with a "trust the client" backend — that's the one area this project treats as non-negotiable regardless of time pressure, since a security shortcut is a different category of risk than a missing nice-to-have feature.
