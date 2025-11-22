# 🧾 Auto‑Entrepreneur Dashboard

Modern full‑stack dashboard for freelancers (auto‑entrepreneurs) to manage invoices, quarterly declarations, profile, and business intelligence stats.

Frontend: **React 19 + Vite (Rolldown) + TypeScript + Tailwind v4 + Mantine + React Query + React Router v7 + Recharts + i18next + shadcn-style UI utilities**  
Backend: **Node.js (Express 5) + TypeScript + MongoDB (Mongoose 8) + JWT Auth + Custom HMAC CSRF + Rate Limiting + Helmet + Multer uploads**

---

## ✨ Key Features

### User / Freelancer

- Email + password or Google OAuth (passport flow assumed via env credentials)
- Profile management (name, avatar, phone, ICE, service metadata)
- Structured service taxonomy (category, type, activity, companyTypeCode)
- Invoice CRUD (monthly + automatic quarter derivation) with TVA tracking
- Export utilities (Excel / PDF)
- Multi‑language (English / French) via i18next

### Admin

- Role management & user lifecycle (create/update/delete)
- Yearly signup stats & category breakdown
- Aggregated user counts

### Dashboard & Analytics

- Charts for revenue, quarterly totals, radar client metrics, yearly invoice totals
- Progressive loading states (Suspense + custom `Loader` component)

### Security / Hardening

- Custom HMAC SHA‑256 CSRF protection (header or body/query token)
- JWT HttpOnly cookie auth + role gate (`requireRole`)
- Path length guard to mitigate router ReDoS (`REQUEST_PATH_MAX_LENGTH`)
- Rate limiting (general + stricter write limits)
- Helmet w/ tuned cross‑origin policies
- Optional native HTTPS (cert/key envs) & enforced redirect in production
- TLS enforcement for Mongo (`MONGO_TLS_REQUIRED`)

---

## 🧱 Architecture Overview

```
auto-entrepreneur-dashboard/
├── client/                  # React SPA (Vite, Mantine, Tailwind, i18n, charts)
│   ├── src/
│   │   ├── pages/           # Route-level screens (Landing, Login, Dashboard, Admin ...)
│   │   ├── components/      # UI + layout + charts + tables + auth guards
│   │   ├── context/         # AuthContext (JWT + role logic)
│   │   ├── hooks/           # Data-fetching hooks (invoices, stats)
│   │   ├── lib/             # Utilities (date buckets, excel/pdf export)
│   │   ├── services/        # historyService (navigation tracking)
│   │   ├── i18n/            # Language resources (english.json, frensh.json)
│   │   └── api/axios.ts     # Axios instance setup
│   └── public/              # Static assets
└── server/                  # Express API (TypeScript)
    ├── server.ts            # Startup (HTTP/HTTPS, graceful shutdown)
    ├── app.ts               # Middleware & route mounting
    ├── config/              # env.ts (env parsing), db.ts (Mongo connect), passport.ts, gridfs, etc.
    ├── models/              # Mongoose schemas (User, Invoice)
    ├── controllers/         # Business logic per domain
    ├── routes/              # Route definitions (/auth, /me, /invoices, /admin)
    ├── middleware/          # auth, csrf, rate, requestPathGuard, cookie parser
    ├── utils/               # JWT helpers, pathWithin
    ├── uploads/             # Persistent avatar & invoice files
    └── scripts/             # Seeder utilities
```

---

## 🗄 Data Models (Simplified)

### User

| Field                                       | Type                    | Notes                                    |
| ------------------------------------------- | ----------------------- | ---------------------------------------- |
| email                                       | string                  | unique, lowercase                        |
| password                                    | string?                 | hashed, omitted from JSON                |
| role                                        | 'user' \| 'admin'       | RBAC gate                                |
| plan                                        | 'freemium' \| 'premium' | pricing tier                             |
| fullName, phone, ICE                        | optional                | phone/ICE validated                      |
| profileKind                                 | enum                    | guide_auto_entrepreneur \| company_guide |
| serviceCategory/serviceType/serviceActivity | string?                 | taxonomy                                 |
| companyTypeCode                             | string?                 | classification                           |
| avatarUrl                                   | string?                 | public image path                        |
| googleId                                    | string?                 | OAuth link                               |

### Invoice

| Field         | Type       | Notes                                  |
| ------------- | ---------- | -------------------------------------- |
| invoiceNumber | number     | unique per (user, year) compound index |
| year          | number     | indexed                                |
| month         | string     | English month name                     |
| quarter       | 'T1'..'T4' | derived automatically if absent        |
| clientName    | string     | trimmed                                |
| amount        | number     | >= 0                                   |
| tvaRate       | number     | percentage value                       |
| userId        | ObjectId   | reference to User                      |

---

## 🔌 API Summary

Base: `/api`

### Auth (`/api/auth`)

- `POST /register` – create account
- `POST /login` – authenticate (issues JWT cookie)
- `GET /me` – current user (auth)
- `POST /logout` – revoke session
- `PUT /me` – update profile (auth)
- `PUT /me/password` – change password (auth)
- `PUT /me/avatar` – upload avatar (multipart, ≤2MB)

### Me (`/api/me`)

- `GET /profile` – profile snapshot
- `PATCH /profile` – partial profile update

### Invoices (`/api/invoices`) (auth required)

- `GET /` – list (filter by `year` query)
- `POST /` – create invoice (rate limited)
- `PATCH /:id` – update (rate limited)
- `DELETE /:id` – delete (rate limited)

### Admin (`/api/admin`) (admin role)

- `GET /users` – list users
- `POST /users` – create user
- `PATCH /users/:id` – update user
- `DELETE /users/:id` – delete user
- `GET /users/stats/yearly` – yearly signup stats
- `GET /users/stats/by-category` – category breakdown
- `GET /users/stats/count` – total count

### Utility

- `GET /health` – health probe
- `GET /csrf-token` (custom: `/api/csrf-token`) – fetch CSRF token JSON
- Static avatars: `/uploads/images/*`

> Responses are JSON; errors use `{ error: string }` with HTTP status codes.

---

## 🔐 Security & Hardening Details

| Aspect      | Implementation                                                        |
| ----------- | --------------------------------------------------------------------- |
| Auth        | JWT in HttpOnly cookie (`verifyJwt`, `requireRole`)                   |
| CSRF        | Custom HMAC token (nonce cookie `_csrf_nonce`, header `X-CSRF-Token`) |
| Rate Limit  | Global (1000/15m) + write (200/15m) + auth (100/15m)                  |
| Path Guard  | `requestPathGuard` truncates & validates overly long paths            |
| TLS         | Optional native HTTPS via `HTTPS_CERT_FILE` + `HTTPS_KEY_FILE`        |
| Mongo TLS   | Enforced with `MONGO_TLS_REQUIRED` & CA/cert envs                     |
| Headers     | Helmet (CSP-like cross origin policies tuned)                         |
| Compression | Gzip/Brotli for responses >1KB                                        |
| Logging     | Morgan (skipped in test environment)                                  |

CSRF token automatically exposed in response header `X-CSRF-Token` each request; fetchable explicitly at `/api/csrf-token`.

---

## 🌐 Internationalization (i18n)

Resources under `client/src/i18n` with English and French JSON. Initialization occurs in `client/src/main.tsx` before app render. Use `useTranslation()` hook within components.

---

## ⚙️ Environment Variables (server)

Required:

- `PORT` (default 5000)
- `MONGO_URI`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `CSRF_SECRET` (falls back to COOKIE_SECRET if set)

Important Optional:

- `CORS_ORIGINS` (default http://localhost:5173)
- `MONGO_TLS_REQUIRED` (default true in production)
- `MONGO_TLS_CA_FILE`, `MONGO_TLS_CERT_KEY_FILE`
- `HTTPS_CERT_FILE`, `HTTPS_KEY_FILE` (to enable native HTTPS)
- `REQUEST_PATH_MAX_LENGTH` (default 2048)
- `COOKIE_SAMESITE`, `COOKIE_SECURE`, `CSRF_SAMESITE`, `CSRF_SECURE`

Client dev server default port: **5173** (Vite).

---

## 🛠 Development Setup

```powershell
git clone https://github.com/ELMACHHOUNE/auto-entrepreneur-dashboard.git
cd auto-entrepreneur-dashboard

# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=change_me
COOKIE_SECRET=change_me
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CSRF_SECRET=another_secret
CORS_ORIGINS=http://localhost:5173
```

Run both in two terminals:

```powershell
# Terminal 1 (API)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

Open: http://localhost:5173

### Build & Production

```powershell
cd server
npm run build
node dist/server.js

cd ../client
npm run build
# Preview (static):
npm run preview
```

---

## 📦 Useful Scripts

Server:

- `npm run dev` – nodemon + ts-node
- `npm run build` – TypeScript compile to `dist/`
- `npm start` – run compiled server
- `npm run deps:update` – bulk upgrade dependencies
- `npm run deps:audit` / `deps:audit:fix` – security audit

Client:

- `npm run dev` – Vite dev
- `npm run build` – Type check + production bundle
- `npm run preview` – local preview
- `npm run lint` – ESLint (React Hooks + Refresh rules)

---

## 🧩 UI / Components

- Custom `Loader` + `LoadingOverlay` for async states
- Mantine layout + theming (`MantineProvider`) with auto color scheme
- Background grid aesthetic wrapper
- Data tables (Mantine React Table) & chart components (Recharts)
- Internationalized text (i18next)

Example Loader usage:

```tsx
<div className="flex min-h-[60vh] items-center justify-center">
  <Loader size={72} label="Loading page" />
</div>
```

---

## 🚀 Deployment Notes

- Ensure proper TLS cert/key env vars for HTTPS or use reverse proxy (Nginx/Caddy)
- Set secure cookie & SameSite values (`none` + `secure` when using cross‑origin setups)
- Provide production CORS origins list comma‑separated
- Run Mongo with TLS if `MONGO_TLS_REQUIRED=true`
- Serve client build via static hosting or reverse proxy pointing to Vite build output

---

## 🧪 Future Improvements (Ideas)

- Add OpenAPI / Swagger documentation
- Add unit/integration tests (Jest + supertest) for routes & models
- Expand invoice export to include localized currency formatting
- Introduce role/permission matrix for premium plan features
- Add dark/light theme toggle persisted to user profile

---

## 🤝 Contributing

1. Fork & branch: `feat/your-feature`
2. Keep commits atomic & descriptive
3. Open PR with summary + screenshots (UI changes)
4. Ensure lint passes (`client: npm run lint`)

---

## 📄 License

See `LICENSE` in repository root.

---

## ❓ Support

Open an issue describing the problem, reproduction steps, and environment (OS, Node version). Security concerns: mark issue as such or email privately.

---

Enjoy building! 🎉
