# MakhzounTech - Multi-Shop POS & Inventory SaaS Platform

![MakhzounTech SaaS](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-teal?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20Supabase%20PostgreSQL%20%7C%20Tailwind-blue?style=for-the-badge)

**MakhzounTech** is a multi-tenant cloud-based SaaS platform engineered for Algerian and North African retail shops, supermarkets, and distributors. It delivers touch POS cash register functionality, multi-warehouse stock management, commercial documents (BL, BR, Factures) generation, customer/supplier debt tracking (Créances / Dettes), and thermal receipt printing (80mm & 58mm).

---

## 👤 Developer & Maintainer Contact Details
* **Lead Architect & Developer:** Omar Farouk
* **Location:** Oran, Algeria 🇩🇿
* **Platform:** MakhzounTech SaaS Engine

---

## 🚀 Key System Features

1. **Multi-Tenant Shop Isolation (`tenant_id`)**
   - Complete data boundary between different merchant shops.
   - Row-Level Security (RLS) support on Supabase PostgreSQL.

2. **Touch POS Screen & Thermal Receipt Engine**
   - High-speed cashier interface (`public/pos.html`).
   - Barcode scanning & quick cart calculation.
   - Built-in thermal receipt generator supporting 80mm and 58mm thermal printers.

3. **Stock & Articles Management**
   - Barcode tracking, buying prices, selling prices (TTC), stock alerts, and unit management.
   - Automatic quantity deduction upon POS sales.

4. **Commercial Documents (Documents Commerciaux)**
   - Bon de Livraison (BL), Bon de Réception (BR), and Factures.
   - Automatic balance calculations (paid vs remaining balance).

5. **Debt Ledger (Créances & Dettes)**
   - Real-time client debt caps and balances.
   - Debt payment recording (Remise / Versement) with automatic caisse transaction logging.

6. **Super-Admin SaaS Engine (`admin/index.html`)**
   - Platform-wide tenant onboarding and activation/suspension (ON/OFF) control switches.

---

## 📁 Directory Structure

```text
makhzoun-saas/
├── public/                 # Operations Portal & Operations Views
│   ├── index.html          # Main Operations Dashboard
│   ├── pos.html            # Touch POS Cashier Screen
│   ├── stock.html          # Articles & Inventory Management
│   └── crm.html            # Customers, Suppliers, & Debt Ledger
├── admin/                  # Super-Admin (Platform Owner)
│   ├── index.html          # Tenant Onboarding & ON/OFF Switches
│   └── login.html          # Super-Admin Hardened Login
├── assets/
│   ├── css/style.css       # Tailwind base, dark theme, & @media print thermal styles
│   └── js/
│       ├── api.js          # REST API Client Library with offline fallbacks
│       ├── pos.js          # Cart state, thermal receipt, & print trigger logic
│       └── app.js          # App router, tenant switcher, modals
├── server/                 # Express Backend API
│   ├── server.js           # REST Endpoints (Articles, POS, Docs, Debts, Admin)
│   ├── db.js               # PostgreSQL pool connector & in-memory fallback
│   └── package.json        # Node server package configuration
├── tests/                  # Integration & Automated Test Suite
│   └── run_tests.js        # Automated API test suite
├── supabase_schema.sql     # Multi-tenant PostgreSQL database schema with seed data
├── package.json            # Root project dependencies
└── README.md               # Complete platform documentation
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
* Node.js v18 or later
* NPM

### Installation & Launch

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Integration Tests:**
   ```bash
   npm test
   ```

3. **Start Local Server:**
   ```bash
   npm start
   ```
   The platform will be available at: `http://localhost:5000/public/index.html`

---

## ☁️ Cloud Deployment Guide

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
* Connect this GitHub repository.
* Set the publish directory to repository root (`.`).
* All HTML files in `public/` and `admin/` will be served statically.

### Backend Deployment (Render / Railway / Heroku)
1. Set start command to `npm start`.
2. Configure environment variables:
   * `PORT`: `5000`
   * `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` (Supabase connection string)

### Database Setup (Supabase / PostgreSQL)
1. Open Supabase SQL Editor.
2. Execute the contents of `supabase_schema.sql` to instantiate multi-tenant tables, indexes, RLS policies, and default sample data.

---

© 2026 MakhzounTech Cloud Systems. Crafted with pride by **Omar Farouk** (Oran, Algeria).
