# 🧾 Auto-Entrepreneur Dashboard

A full-stack web application for **freelancers (auto-entrepreneurs)** to manage their activity — invoices, trimestral declarations, clients, and yearly statistics.

Built with **React (Vite + TypeScript + Tailwind)** for the frontend and **Node.js (Express + MongoDB)** for the backend.

---

## 🔐 Backend security knobs

- `MONGO_TLS_REQUIRED` (default `true` in production): forces the API to negotiate TLS with MongoDB and refuses to start otherwise. Optionally point to certificate material with `MONGO_TLS_CA_FILE` and `MONGO_TLS_CERT_KEY_FILE` (paths can be relative to the repo root).
- `REQUEST_PATH_MAX_LENGTH` (default `2048`): bounds and normalizes inbound URLs before Express routes, mitigating router-level ReDoS vectors triggered by extremely long or malformed paths.

See `server/.env.example` for the full list of options.

---

## 🧩 Project Structure

auto-entrepreneur-dashboard/
│
├── client/ # Frontend (React + Vite + TS + Tailwind + shadcn + Mantine React Table)

### 👤 User (Freelancer)

- Login with Google (OAuth)
- Manage profile (name, ICE, service type, phone, avatar)
- Manage clients and invoices (monthly/quarterly)
- Upload invoice PDFs
  - Month
  - Trimester (T1–T4)
  - Year

### 🛠️ Admin

- Manage all users
- Change roles, view stats, delete users

### 📊 Dashboard

### Frontend

- **Vite + React + TypeScript**

- **MongoDB + Mongoose**
- **Google OAuth 2.0 (Passport.js)**
- **JWT Authentication**
- **Multer + GridFS (PDF upload)**
- **Zod Validation**
- **Helmet, CORS, Morgan (security + logs)**
- **Nodemon (auto reload in dev)**

---

### 1️⃣ Clone the repository

```bash
git clone https://github.com/ELMACHHOUNE/auto-entrepreneur-dashboard.git
cd auto-entrepreneur-dashboard
```

## Loader Components

Two reusable loading UI pieces:

- **`Loader`** – Tailwind-only concentric spinner (two counter-rotating rings with a pulsing center). Use it for page-level fallback (e.g. Suspense) or inline states.
- **`LoadingOverlay`** – Full-surface blur overlay that centers a `Loader` and message over existing content (requires parent with `relative`). Currently optional; tables no longer use it by default to avoid duplicate loaders.

### Example: Page Fallback

```tsx
import Loader from '@/components/ui/Loader';

export function PageWrapper() {
  const { isLoading, data } = useQuery(...);
  if (isLoading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size={72} label="Loading page" />
      </div>
    );
  }
  return <Content data={data} />;
}
```

### Example: Overlay

```tsx
import LoadingOverlay from '@/components/ui/LoadingOverlay';

function Card({ loading, children }) {
  return (
    <div className="relative rounded-md border p-4">
      {children}
      {loading && <LoadingOverlay message="Updating…" />}
    </div>
  );
}
```

### Props

`<Loader size={number} label={string} inline />`

`<LoadingOverlay message={string} size={number} />`
