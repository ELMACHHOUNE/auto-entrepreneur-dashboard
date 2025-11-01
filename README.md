# 🧾 Auto-Entrepreneur Dashboard

A full-stack web application for **freelancers (auto-entrepreneurs)** to manage their activity — invoices, trimestral declarations, clients, and yearly statistics.

Built with **React (Vite + TypeScript + Tailwind)** for the frontend and **Node.js (Express + MongoDB)** for the backend.

---

## 🧩 Project Structure

auto-entrepreneur-dashboard/
│
├── client/ # Frontend (React + Vite + TS + Tailwind + shadcn + Mantine React Table)
│
└── server/ # Backend (Express + TypeScript + MongoDB + OAuth + Multer + Nodemon)

---

## 🚀 Features

### 👤 User (Freelancer)

- Login with Google (OAuth)
- Manage profile (name, ICE, service type, phone, avatar)
- Manage clients and invoices (monthly/quarterly)
- Upload invoice PDFs
- Automatic calculation of 1% (services) or 0.5% (workshops)
- Dashboard with statistics by:
  - Month
  - Trimester (T1–T4)
  - Year
  - Client

### 🛠️ Admin

- Manage all users
- Change roles, view stats, delete users

### 📊 Dashboard

- Charts (by quarter, month, and client)
- KPIs (Total revenue, % fees, invoices count, top client)

---

## 🧱 Tech Stack

### Frontend

- **Vite + React + TypeScript**
- **Tailwind CSS**
- **shadcn/ui + Aceternity UI**
- **Mantine React Table**
- **Lucide React Icons**
- **React Query**
- **Recharts** (charts and analytics)

### Backend

- **Node.js + Express (TypeScript)**
- **MongoDB + Mongoose**
- **Google OAuth 2.0 (Passport.js)**
- **JWT Authentication**
- **Multer + GridFS (PDF upload)**
- **Zod Validation**
- **Helmet, CORS, Morgan (security + logs)**
- **Nodemon (auto reload in dev)**

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/ELMACHHOUNE/auto-entrepreneur-dashboard.git
cd auto-entrepreneur-dashboard
```

---

## 🧪 Dev-only helper: absolute URL history patch

Some mobile simulators and browser extensions hook the History API and call `new URL(url)` without a base. When a relative path like `/dashboard` is passed, that hook can throw `TypeError: Failed to construct 'URL': Invalid URL` and sometimes force a full page reload.

To keep SPA navigation smooth in development and avoid those false errors, we install a tiny, idempotent patch during app boot in dev:

- File: `client/src/lib/history-absolute-url-patch.ts`
- Purpose: normalize `history.pushState` / `replaceState` URLs to absolute (prefix `window.location.origin`).
- Install point: `client/src/main.tsx`
- Scope: development only — guarded by `if (import.meta.env.DEV) { ... }`.

Disable or remove

- To disable, comment out the `installAbsoluteUrlHistoryPatch()` call in `client/src/main.tsx`.
- This utility is safe to keep in the codebase; it does not run in production builds.

Why not needed in production?

- Real browsers handle relative URLs fine, and we don’t expect simulator hooks in production. Keeping it dev-only avoids any chance of side-effects and keeps bundles minimal.
