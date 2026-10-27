# 🛒 KiranaCloud POS — Retail Inventory & Point-of-Sale System

[![Live Demo](https://img.shields.io/badge/Demo-kirana--cloud--4cxc.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://kirana-cloud-4cxc.vercel.app/)
[![Build Status](https://img.shields.io/badge/Client_Build-Passing-emerald?style=for-the-badge&logo=vite)](https://kirana-cloud-4cxc.vercel.app/)
[![Test Suite](https://img.shields.io/badge/Tests-11%2F11_Passing-success?style=for-the-badge&logo=node.js)](file:///server/tests)
[![Node Version](https://img.shields.io/badge/Node-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A modern full-stack **MERN** Retail Management & Point-of-Sale platform built for neighborhood grocery stores, departmental retail, and supermarkets. Features atomic stock deductions, live gross-margin tracking, customer Khata with advance surplus reconciliation, and day-close cash drawer balancing (Z-Reports).

---

## 🌐 Live Deployment & Credentials

- **Production URL:** [https://kirana-cloud-4cxc.vercel.app](https://kirana-cloud-4cxc.vercel.app)
- **Demo Store Credentials:**
  - **Email / Phone:** `owner@kiranacloud.com` or `9811234567`
  - **Password:** `password123`
  *(Pre-seeded with FMCG products across Groceries, Dairy, Beverages, Snacks, Personal Care, and active customer Khata ledgers).*

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KiranaCloud Client (React 18 + Vite)            │
│  - POS Billing Terminal (Keyboard Hotkeys, Stock Ceilings, Confirm Guard)│
│  - Inventory Manager (Wholesale CP & Retail SP, Units, CSV Engine)      │
│  - Reorder Sheet (Zero-Scroll Table, Reorder Buffer Math, Restock Modal)│
│  - Customer Khata (Credit Ceilings, Advance Surplus, WhatsApp Alerts)   │
│  - Day-Close Drawer Balancing & Auditing (Thermal Z-Report Slip)       │
│  - Executive Analytics (Live Gross Margins, Category Revenue Split)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (Axios + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Node.js / Express.js REST API                   │
│  - JWT Cookie & Header Authentication Middleware                       │
│  - Atomic MongoDB Updates ($inc / $gte Concurrency Locks)              │
│  - Khata Advance Surplus & Historical Ledger Reconciler                │
│  - Cash Drawer Day-Close Auditing Engine                               │
│  - CSV Bulk Upsert & Download Streaming Pipeline                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Production) / In-Memory Server             │
│  - Collections: Users, Products, Sales, Customers, DayCloses           │
│  - Auto-Fallback: Built-in MongoMemoryServer for zero-config local runs│
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Modules

### 🛒 1. High-Speed POS Counter
- **Barcode & SKU Search:** Instant lookup with category filters and price sorting.
- **Stock Ceilings & Guards:** Live stock counts (`14 packet left`, `30 litres left`) prevent overselling. Dedicated `+` / `-` buttons and a pre-billing review modal prevent accidental checkout.
- **Discount Guard:** Strictly capped at a maximum of **50% of bill value** with negative value rejection.
- **Tender Options:** Cash (with real-time change due math), UPI/QR, Card, and Store Credit (Khata).
- **Receipts:** Printable thermal receipt slip, text file download, and 1-click WhatsApp copy.

### 📦 2. Inventory & Multi-Unit Catalog
- **Cost vs. Selling Price:** Tracks both Wholesale Cost Price (CP) and Retail Selling Price (SP) for real gross margin visibility.
- **Retail Packaging Units:** Full support for `litres`, `kg`, `packet`, `box`, `pcs`, `bottle`, and `can`.
- **Bulk CSV Spreadsheet Engine:** Upload CSV spreadsheets with table previews for batch upserting, plus 1-click catalog exports.

### 📋 3. Supplier Reorder Sheet
- **Zero Horizontal Scroll:** Clean grid layout synchronized with the main inventory table.
- **Automatic Buffer Alerts:** Flags all SKUs where $\text{Stock} \le \text{Safety Threshold}$.
- **Suggested Replenishment:** Computes suggested order quantities and estimated wholesale budget requirements.

### 👥 4. Customer Khata & Advance Surplus Engine
- **Credit Limit Ceilings:** Enforces individual debt allowances and prevents over-limit sales without manager authorization.
- **Chronological Ledger:** Timestamped history of store credit purchases (`+₹X`), repayments (`-₹X`), and cash refunds.
- **Advance Surplus Management:** When a customer overpays, excess funds are tracked as advance credit and automatically drawn down on subsequent counter bills. Includes a 1-click **Cash Refund** button.
- **WhatsApp Reminders:** Generates a pre-composed WhatsApp balance breakdown in one click.

### 🧾 5. Day-Close Cash Drawer Balancing (Z-Report)
- **Reconciliation Formula:**
  $$\text{Expected Cash} = \text{Starting Float} + \text{Cash Sales Today} + \text{Khata Cash Collected Today}$$
- **Discrepancy Detection:** Automatically flags drawer status as **Matched** (`₹0.00`), **Shortage** (`-₹X`), or **Surplus** (`+₹X`).
- **Audit Slip:** Generates an official printable daily Z-Report.

### 📊 6. Analytics & Profit Dashboard
- **Live KPIs:** Real-time revenue, gross profit, margin %, and completed bill count.
- **Gross Profit Formula:** $\sum (\text{Selling Price} - \text{Cost Price}) \times \text{Quantity Sold}$.
- **Trends & Charts:** 7-day revenue vs. profit bar chart and category contribution donut chart.

---

## ⌨️ POS Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| `F2` | **Focus Search** | Highlights product search bar |
| `F9` | **Quick Checkout** | Opens billing confirmation modal |
| `Esc` | **Clear / Close** | Closes active modal or clears search |
| `+` / `-` | **Quantity Adjust** | Increments or decrements selected product |
| `Enter` | **Confirm Tender** | Submits cash tender or confirms checkout |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new store owner |
| `POST` | `/api/auth/login` | Authenticate via email or 10-digit phone |
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile |
| `PATCH` | `/api/auth/profile` | Update store configuration & tax rates |
| `GET` | `/api/products` | Fetch catalog with search, filter, and pagination |
| `POST` | `/api/products` | Add a new SKU |
| `PATCH` | `/api/products/:id` | Update product, retail price, or wholesale cost |
| `DELETE` | `/api/products/:id` | Delete product from inventory |
| `POST` | `/api/products/:id/restock`| Increment stock and update wholesale price |
| `GET` | `/api/products/reorder-sheet` | Fetch all products below safety threshold |
| `GET` | `/api/products/export-csv` | Download complete catalog as CSV |
| `POST` | `/api/products/bulk-import` | Bulk upsert products from CSV payload |
| `POST` | `/api/sales` | Create counter sale with atomic stock deduction |
| `GET` | `/api/sales` | Fetch historical invoices |
| `GET` | `/api/sales/:id` | Fetch single invoice details for printing |
| `PATCH` | `/api/sales/:id/void` | Void invoice and restore shelf stock |
| `GET` | `/api/customers` | Fetch customer Khata accounts & balances |
| `POST` | `/api/customers` | Register customer with 10-digit phone |
| `POST` | `/api/customers/:id/payment` | Record debt repayment |
| `POST` | `/api/customers/:id/refund` | Refund customer advance surplus in cash |
| `DELETE` | `/api/customers/:id` | Remove customer from Khata ledger |
| `GET` | `/api/analytics/metrics` | Retrieve dashboard KPI cards & charts |
| `GET` | `/api/analytics/day-close/summary` | Fetch live today's register figures |
| `POST` | `/api/analytics/day-close` | Submit counted cash and save daily Z-Report |

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/yajas360/KiranaCloud.git
cd KiranaCloud

# Install backend and frontend dependencies
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=kiranacloud_secret_key_2026
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://127.0.0.1:27017/kiranacloud
```
*(Note: If no local MongoDB is running, the server automatically starts a built-in In-Memory MongoDB instance).*

### 3. Seed & Run
```bash
# Seed demo supermarket catalog and Khata accounts
npm run seed

# Terminal 1: Backend API (http://localhost:5000)
cd server && npm run dev

# Terminal 2: Frontend Client (http://localhost:5173)
cd client && npm run dev
```

---

## 🧪 Automated Test Suite (11/11 Passing)

Run tests using:
```bash
npm test
```

### Verified Business Invariants:
1. Subtotal, tax, discount, and grand total calculations.
2. Gross profit margin formula: $(\text{SP} - \text{CP}) \times \text{Qty}$.
3. Atomic stock decrements triggering low-stock safety thresholds.
4. Prevention of checkout when requested quantity exceeds inventory stock.
5. Customer Khata credit limit ceiling enforcement.
6. Maximum 50% discount ceiling on bill value.
7. Day-Close drawer math (Matched, Shortage, and Surplus).
8. Cash tendered non-negative validation and exact change computation.
9. 10-digit Indian phone number formatting and validation.
10. Advance surplus credit creation on overpayment and live drawdown.
11. Multi-step Gopal ledger reconciliation scenario.

---

## 📄 License
This project is licensed under the **MIT License**.
