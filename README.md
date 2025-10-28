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
