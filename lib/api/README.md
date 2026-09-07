# API layer

This app has no local backend. All data comes from the remote **DCC API**
(Django REST Framework, hosted on Render). Swagger: `https://dcc-api.onrender.com/api/docs/`
— a JSON snapshot is checked in at `MISC/dcc-api-schema.json`.

## How a request flows

```
React component
  └─ hooks/useApi.ts  (useApiQuery / useApiMutation → TanStack Query)
       └─ lib/api/client.ts        browser fetch → same-origin only
            └─ /api/proxy/[...path]  (BFF)  reads dcc_access cookie, adds Bearer
                 └─ https://dcc-api.onrender.com/api/...
```

The JWT pair (`access` + `refresh`) lives in **httpOnly cookies** (`dcc_access`,
`dcc_refresh`) set by `/api/auth/*`. Browser JS never sees the token, the Render
origin is never called from the browser, and there is no CORS surface.

The proxy refreshes the access token automatically — proactively when it has
expired, reactively on a `401` from upstream — and re-issues the cookies on the
same response.

## Auth

```ts
const { user, isAuthenticated, isLoading, login, logout } = useAuth();
await login(email, password); // POST /api/auth/login → sets cookies
await logout();               // POST /api/auth/logout → blacklists refresh, clears cookies
```

## Reading data

```ts
import { useApiQuery, queryKeys } from "@/hooks/useApi";
import { API_ROUTES } from "@/lib/api/config";
import type { Paginated, SundayReport } from "@/lib/api/types";

const { data, isLoading, error } = useApiQuery<Paginated<SundayReport>>(
  queryKeys.reports.list({ page }),
  API_ROUTES.reports,
  { params: { page } },
);
```

Or the resource wrappers in `hooks/api/*`:

```ts
import { useReports, useApproveReport } from "@/hooks/api";

const reports = useReports({ page: 1 });
const approve = useApproveReport();
approve.mutate({ id });
```

## Writing data

```ts
const create = useApiMutation<SundayReport, CreateReportInput>(API_ROUTES.reports, {
  method: "POST",
  invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all],
});
create.mutate({ service_date: "2026-09-06", members_present: 24 /* … */ });
```

For dynamic paths (`reports/{id}/approve/`) pass a resolver:

```ts
useApiMutation<SundayReport, { id: string }>(
  ({ id }) => ({ path: API_ROUTES.reportApprove(id), method: "POST" }),
  { invalidateKeys: [queryKeys.approvals.all] },
);
```

## Errors

Every failure is an `ApiError` (`lib/api/errors.ts`):

```ts
if (error?.isValidation) setFieldError(error.fieldError("email"));
else if (error?.isAuth) router.push("/sign-in");
else toast(error.message);
```

## Files

| File | Role |
| --- | --- |
| `config.ts` | base URLs, cookie names, `API_ROUTES` path map |
| `types.ts` | TS types mirroring the OpenAPI schema |
| `errors.ts` | `ApiError` + DRF error-shape normalization |
| `http.ts` | isomorphic fetch wrapper (timeout, query, JSON, parsing) |
| `client.ts` | browser client → talks only to `/api/proxy` + `/api/auth` |
| `tokens.ts` | **server-only** — JWT cookies, decode, refresh |
| `../../app/api/proxy/[...path]/route.ts` | the BFF proxy |
| `../../app/api/auth/*` | login / logout / session / refresh |
| `../../hooks/useApi.ts` | `useApiQuery`, `useApiMutation`, `useApiInfiniteQuery`, `queryKeys` |
| `../../hooks/useAuth.ts` | session + login/logout |
| `../../hooks/api/*` | typed per-resource hooks |

## Environment

`DCC_API_BASE_URL` (server-only) — defaults to `https://dcc-api.onrender.com`.
See `.env.example`.
