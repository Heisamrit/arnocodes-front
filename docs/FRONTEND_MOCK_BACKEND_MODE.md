# Frontend Mock Backend Mode (Detailed Technical Documentation)

## 1) Why this exists
The frontend (login, signup, dashboard/API playground) originally depended on two live systems:
1. Supabase Auth for session and access tokens.
2. Backend API for `/api/v1/*` responses.

This mode allows product/UI work to continue **without** those services by:
- faking auth/session behavior,
- faking backend responses for key endpoints,
- keeping the real-network path intact for normal environments.

---

## 2) Activation switch and run command
Mock behavior is controlled by:
- `NEXT_PUBLIC_USE_MOCK_BACKEND=true`

Convenience command:
- `npm run dev:mock`

Implementation details:
- `frontend/package.json` defines `dev:mock`.
- `frontend/scripts/run-frontend-with-mock-backend.sh` exports `NEXT_PUBLIC_USE_MOCK_BACKEND=true` and runs `npm run dev`.

---

## 3) Architecture changes
The implementation is split into three pieces so responsibilities stay clear:

### A) API transport switch (`frontend/src/lib/api.ts`)
`apiFetch()` now does:
- if mock mode is enabled → route call to `mockApiFetch(path, init)`;
- else → use original behavior:
  - fetch current Supabase session,
  - require `session.access_token`,
  - attach `Authorization: Bearer <token>`,
  - call real `${NEXT_PUBLIC_API_BASE_URL}${path}`.

This preserves the old production/staging behavior while adding a development-only mock route.

### B) Mock API responder (`frontend/src/lib/mockBackend.ts`)
New module that:
- parses method/path/body,
- returns `Response` objects with JSON payloads,
- mirrors backend response envelope style (`status`, `message`, `data`),
- returns route-specific HTTP statuses (`200`, `201`, `202`, `404` fallback).

### C) Mock auth provider (`frontend/src/lib/supabase.ts`)
`supabase` export now becomes mode-aware:
- **mock mode:** returns an in-memory client implementing auth APIs used by this frontend;
- **real mode:** returns regular `createClient(...)` from `@supabase/supabase-js`.

The mock auth implements:
- `auth.getSession()`
- `auth.signInWithPassword()`
- `auth.signUp()`
- `auth.signOut()`
- `auth.onAuthStateChange()`

These were chosen because they are exactly what current pages/components use (`/login`, `/signup`, `AuthGuard`, dashboard logout).

---

## 4) Endpoint coverage in `mockBackend.ts`
The mock currently covers the endpoint set used by the command-center dashboard and closely aligned with backend handlers.

### Health
- `GET /health`
- `GET /api/v1/health`

### Profile
- `GET /api/v1/profiles/me`
- `PATCH /api/v1/profiles/me`
- `GET /api/v1/profiles/me/status`
- `GET /api/v1/profiles/me/platform-connections`
- `POST /api/v1/profiles/me/platform-connections`
- `DELETE /api/v1/profiles/me/platform-connections/{platform}`

### Dashboard
- `GET /api/v1/dashboard`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/heatmap?from=...&to=...`

### Course
- `GET /api/v1/course`
- `GET /api/v1/course/structure`
- `GET /api/v1/topics/{topicId}`
- `GET /api/v1/subtopics/{subtopicId}`

### Diagnostic
- `POST /api/v1/diagnostic/start`
- `GET /api/v1/diagnostic/{attemptId}/next`
- `POST /api/v1/diagnostic/{attemptId}/answer`
- `POST /api/v1/diagnostic/{attemptId}/coding`
- `GET /api/v1/diagnostic/{attemptId}/status`
- `POST /api/v1/diagnostic/{attemptId}/submit`

### Platform sync
- `POST /api/v1/platform-sync/trigger`
- `GET /api/v1/platform-sync/overview`
- `GET /api/v1/platform-sync/jobs/{jobId}`

### IDE
- `POST /api/v1/ide/run`
- `POST /api/v1/ide/submit`
- `GET /api/v1/ide/status?id={submissionId}`

### AI
- `POST /api/v1/ai/query`

### Fallback behavior
If no route matches, mock returns:
- `404`
- JSON error describing missing mock mapping.

---

## 5) Auth behavior in mock mode
In mock mode auth state is in-memory only:
- `signInWithPassword` and `signUp` create a fake session with `mock-access-token`.
- `getSession` returns current in-memory session.
- `signOut` clears session.
- auth listeners are notified (`SIGNED_IN` / `SIGNED_OUT`) to keep route guard and page redirection logic functional.

Impact:
- login page can “sign in” and route to `/`;
- signup page can “create account” and route to `/`;
- dashboard can “logout” back to `/login`;
- `AuthGuard` still behaves correctly because session semantics are preserved.

Note: session does not persist across full server restart because no storage is used in mock mode.

---

## 6) Data design choices in mock responses
Mock payloads are deterministic and readable to support UI development:
- fixed IDs (`attempt_id`, `submission_id`, `job_id`)
- realistic status envelopes
- simple arrays/objects that render correctly in current response panel
- enough fields for frontend inspection and API playground demos

The mock is intentionally not a full backend emulator; it is a UI-flow enabler.

---

## 7) What stayed unchanged
Real integration path remains unchanged when mock mode is off:
- real Supabase session lookup,
- bearer token injection,
- fetch against real backend base URL.

So normal development/testing against real services is preserved.

---

## 8) Limitations and known gaps
1. **Statefulness is minimal**
   Most responses are static and do not simulate deep lifecycle transitions.
2. **No persistence**
   Auth and API state reset on refresh/restart patterns depending on runtime.
3. **No backend validation parity**
   Mock does not enforce all backend validation/error branches.
4. **No network-time simulation**
   Latency/retries/race conditions are not simulated.

These are acceptable tradeoffs for quick UI development and demos.

---

## 9) How to extend safely
When adding frontend features that call new endpoints:
1. Add endpoint usage in UI.
2. Add corresponding mock route in `mockBackend.ts`.
3. Keep envelope (`status`, `message`, `data`) consistent.
4. Return realistic HTTP status.
5. If auth behavior changes, extend only the small mock auth surface needed by UI.

Recommended pattern for new routes:
- match `(method + normalizedPath)` early,
- parse body carefully,
- return clear fallback errors for unsupported requests.

---

## 10) Operational usage guide
### Local UI-only development
```bash
cd frontend
npm run dev:mock
```
Use this for:
- visual/page-flow work on login/signup/dashboard,
- demoing API playground without backend,
- frontend onboarding where backend infra is not yet ready.

### Real integration testing
```bash
cd frontend
npm run dev
```
with proper env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL`) and live backend.

---

## 11) File-by-file change log
- `frontend/src/lib/mockBackend.ts`
  - new mock HTTP dispatcher and route handlers.
- `frontend/src/lib/api.ts`
  - added mock/real runtime switch.
- `frontend/src/lib/supabase.ts`
  - added mock auth client for frontend auth flow.
- `frontend/scripts/run-frontend-with-mock-backend.sh`
  - script to start Next.js in mock mode.
- `frontend/package.json`
  - added `dev:mock` npm script.
- `frontend/README.md`
  - added short user-facing section for mock-mode command.

---

## 12) Summary
This mock backend mode provides a practical “frontend-only runtime” for ArnoCodes:
- login/signup/dashboard flows work,
- API command center can hit major endpoints,
- no backend/Supabase dependency is required,
- real integration path remains untouched when mock mode is disabled.
