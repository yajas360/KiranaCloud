# 🛒 KiranaCloud POS — Retail Inventory & Point-of-Sale System

> 🎥 **Demo Video:** This is my Google Drive link for demo video for this project: [https://drive.google.com/file/d/1yhSgSt081xPWFZNXecobyC359Iliy8M8/view?usp=sharing](https://drive.google.com/file/d/1yhSgSt081xPWFZNXecobyC359Iliy8M8/view?usp=sharing)

[![Live Demo](https://img.shields.io/badge/Demo-kirana--cloud--4cxc.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://kirana-cloud-4cxc.vercel.app/)
[![Build Status](https://img.shields.io/badge/Client_Build-Passing-emerald?style=for-the-badge&logo=vite)](https://kirana-cloud-4cxc.vercel.app/)
[![Test Suite](https://img.shields.io/badge/Tests-14%2F14_Passing-success?style=for-the-badge&logo=node.js)](file:///server/tests)
[![Node Version](https://img.shields.io/badge/Node-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A modern full-stack **MERN** Retail Management & Point-of-Sale platform built for neighborhood grocery stores, departmental retail, and supermarkets. Features atomic stock deductions, live gross-margin tracking, customer Khata with advance surplus reconciliation, and day-close cash drawer balancing (Z-Reports).

---

## 🌐 Live Deployment & Credentials

- **Production URL:** [https://kirana-cloud-4cxc.vercel.app](https://kirana-cloud-4cxc.vercel.app)
- **Demo Video (Google Drive):** [https://drive.google.com/file/d/1yhSgSt081xPWFZNXecobyC359Iliy8M8/view?usp=sharing](https://drive.google.com/file/d/1yhSgSt081xPWFZNXecobyC359Iliy8M8/view?usp=sharing)
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

### 📂 Directory & File Structure

```text
mern-end-term-final/
├── package.json                         # Root project scripts (concurrent start, test, build, seed)
├── README.md                            # Complete architectural & operational documentation
├── kiranacloud_inventory_import.csv     # Pre-formatted sample FMCG inventory CSV dataset
├── .gitignore                           # Git exclusions (node_modules, .env, build outputs)
│
├── client/                              # React 18 Single Page Application (Vite + Tailwind CSS)
│   ├── .env.example                     # Client environment template (VITE_API_URL)
│   ├── index.html                       # HTML5 entry template with viewport configuration
│   ├── package.json                     # Client dependencies (lucide-react, recharts, axios)
│   ├── postcss.config.js                # PostCSS build configuration for Tailwind CSS
│   ├── tailwind.config.js               # Tailwind design system tokens, themes & colors
│   ├── vercel.json                      # Vercel production deployment SPA rewrite rules
│   ├── vite.config.js                   # Vite builder configuration with /api reverse proxy
│   └── src/
│       ├── main.jsx                     # React DOM entry point & root renderer
│       ├── App.jsx                      # Application router and layout provider
│       ├── index.css                    # Tailwind CSS directives & global scrollbar styling
│       ├── api/
│       │   └── axios.js                 # Axios instance with Bearer JWT request interceptor
│       ├── components/
│       │   ├── analytics/
│       │   │   └── DayCloseModal.jsx    # Cash drawer balancing & printable thermal Z-Report modal
│       │   ├── common/
│       │   │   ├── EmptyState.jsx       # Reusable zero-data placeholder illustration
│       │   │   ├── LoadingSpinner.jsx   # Async loading state spinner indicator
│       │   │   └── StockBadge.jsx       # Real-time stock status badge (In Stock, Low, Out)
│       │   ├── inventory/
│       │   │   ├── ProductModal.jsx     # SKU create/edit modal (CP, SP, Category, Unit, Shelf)
│       │   │   └── RestockModal.jsx     # Supplier replenishment modal with wholesale CP updater
│       │   ├── layout/
│       │   │   ├── Header.jsx           # Store brand banner, active clock & profile switch
│       │   │   ├── Layout.jsx           # Responsive shell container layout
│       │   │   └── Sidebar.jsx          # Module navigation sidebar with authenticated logout
│       │   └── pos/
│       │       ├── CartDrawer.jsx       # Active bill drawer, discount ceiling & cash tender math
│       │       ├── ProductPicker.jsx    # Product search grid with category filters & keyboard nav
│       │       └── ReceiptModal.jsx     # Printable thermal receipt slip & WhatsApp text copy
│       ├── context/
│       │   ├── AuthContext.jsx          # User state, JWT storage, login/logout & profile methods
│       │   └── ThemeContext.jsx         # UI theme provider
│       ├── pages/
│       │   ├── CustomersKhata.jsx       # Khata ledgers, credit limits, advance surplus & payments
│       │   ├── Dashboard.jsx            # KPI cards, gross margin tracking & revenue breakdown
│       │   ├── Inventory.jsx            # Catalog management table, search, filters & CSV import/export
│       │   ├── Invoices.jsx             # Historical invoices ledger, reprint & void invoice actions
│       │   ├── Landing.jsx              # Public landing page with feature walkthrough & 60s demo guide
│       │   ├── Login.jsx                # Authentication page (Mobile/Email login & demo quick-fill)
│       │   ├── PosCounter.jsx           # Full-screen POS billing counter with keyboard hotkeys
│       │   ├── Register.jsx             # Store owner onboarding & store registration form
│       │   ├── ReorderSheet.jsx         # Supplier replenishment table with buffer stock math
│       │   └── Settings.jsx             # Store profile configuration, tax rate & currency settings
│       ├── routes/
│       │   └── ProtectedRoute.jsx       # Authentication guard redirecting unauthenticated users
│       └── utils/
│           └── formatters.js            # Currency (₹ INR), date, unit, and phone number helpers
│
└── server/                              # Node.js / Express.js REST API Backend
    ├── .env                             # Active environment configuration
    ├── .env.example                     # Environment template (PORT, JWT_SECRET, MONGODB_URI)
    ├── app.js                           # Express app configuration, CORS, cookie parser & routes
    ├── package.json                     # Server dependencies & test/dev scripts
    ├── server.js                        # HTTP server bootstrap, DB connection & demo self-healing
    ├── config/
    │   └── db.js                        # Mongoose connection with automatic MongoMemoryServer fallback
    ├── controllers/
    │   ├── analyticsController.js       # Live KPI calculations, gross margin & day-close balancing
    │   ├── authController.js            # Authentication (email/phone), JWT cookies & store profile
    │   ├── customerController.js        # Khata accounts, debt tracking, advance surplus & refunds
    │   ├── productController.js         # Inventory CRUD, restock, reorder sheet & CSV engine
    │   └── saleController.js            # Atomic POS checkout, stock deductions & invoice voiding
    ├── middleware/
    │   ├── authMiddleware.js            # JWT verification via HTTP-only cookie & Bearer header
    │   ├── errorMiddleware.js           # Centralized HTTP error handler & response sanitizer
    │   └── validateRequest.js           # Express-validator result parser
    ├── models/
    │   ├── Customer.js                  # Customer Khata schema: phone, debt, advance surplus & ledger
    │   ├── DayClose.js                  # Day-close Z-Report schema: expected cash, counted & variance
    │   ├── Product.js                   # Product SKU schema: CP, SP, units, stock & safety thresholds
    │   ├── Sale.js                      # Sale invoice schema: line items, profit, discount & tender
    │   └── User.js                      # Store owner schema: bcrypt hash, store metadata & tax rate
    ├── routes/
    │   ├── analyticsRoutes.js           # /api/analytics endpoints (metrics, day-close)
    │   ├── authRoutes.js                # /api/auth endpoints (login, register, me, profile)
    │   ├── customerRoutes.js            # /api/customers endpoints (khata, debt, surplus, refund)
    │   ├── productRoutes.js             # /api/products endpoints (catalog, restock, CSV)
    │   └── saleRoutes.js                # /api/sales endpoints (checkout, invoices, void)
    ├── scripts/
    │   └── seed.js                      # FMCG catalog & demo store owner seeder script
    └── tests/
        ├── authRoutes.test.js           # Tests for mobile/email authentication & demo credentials
        └── inventoryLogic.test.js       # Tests for stock ceilings, profit margins & khata logic
```

### 🗄️ Database Models & Entity Architecture

| Model | File | Description & Key Fields |
|---|---|---|
| **User** | `server/models/User.js` | Store owner account. Fields: `name`, `email`, `password` (bcrypt hash), `storeName`, `storePhone`, `storeAddress`, `role`, `currency`, `currencySymbol`, `taxRate`. |
| **Product** | `server/models/Product.js` | Inventory catalog SKU. Fields: `user` (ref), `name`, `sku`, `category`, `costPrice` (CP), `sellingPrice` (SP), `stockQuantity`, `minThreshold`, `unit` (`packet`, `kg`, `litres`, `box`, `pcs`, etc.), `supplier`, `shelfLocation`. |
| **Sale** | `server/models/Sale.js` | Completed counter transaction. Fields: `user` (ref), `invoiceNumber`, `items` (`product`, `name`, `costPrice`, `sellingPrice`, `quantity`, `unit`, `total`), `subtotal`, `discount`, `tax`, `grandTotal`, `totalCost`, `netProfit`, `paymentMethod` (`CASH`, `UPI`, `CARD`, `CREDIT`), `amountTendered`, `changeDue`, `customerName`, `customerPhone`, `status` (`COMPLETED`, `VOIDED`). |
| **Customer** | `server/models/Customer.js` | Khata credit account. Fields: `user` (ref), `name`, `phone` (10 digits), `creditLimit`, `currentDebt`, `advanceBalance` (overpayment surplus credit), `transactions` (`type`, `amount`, `notes`, `saleId`, `date`). |
| **DayClose** | `server/models/DayClose.js` | End-of-day register audit (Z-Report). Fields: `user` (ref), `date`, `startingFloat`, `cashSalesTotal`, `khataCashCollected`, `expectedCash`, `countedCash`, `discrepancy`, `status` (`MATCHED`, `SHORTAGE`, `SURPLUS`), `notes`. |

### 💻 How the MERN Stack is Implemented in KiranaCloud

KiranaCloud leverages each layer of the **MERN (MongoDB, Express.js, React, Node.js)** stack to provide high-throughput counter billing, atomic stock consistency, and real-time retail intelligence:

#### 🍃 M — MongoDB (NoSQL Database & Mongoose ODM)
* **Document-Centric FMCG Modeling:** Utilizes Mongoose models (`User`, `Product`, `Sale`, `Customer`, `DayClose`) to store retail entities without rigid joins, ideal for fast counter reads.
* **Atomic Concurrency & Stock Locks:** Checkouts use atomic MongoDB `$inc` updates with `$gte` balance locks (`stockQuantity: { $gte: item.quantity }`) in `saleController.js`, preventing inventory race conditions and negative shelf quantities during peak store traffic.
* **Embedded Subdocuments:** Invoices store historical line items directly as embedded documents within `Sale`, preserving frozen item cost and retail prices at the exact instant of sale even if the product is later modified.
* **Customer Khata Subdocument Ledgers:** Customer debt ledgers embed chronological arrays of transactions (`DEBT`, `PAYMENT`, `REFUND`) for atomic balance updates and instant statement rendering.
* **Dual-Environment Architecture:** Seamlessly connects to **MongoDB Atlas** in production while including an automated **MongoMemoryServer** fallback for zero-configuration, offline local evaluation without installing a local MongoDB daemon.

#### 🚂 E — Express.js (REST API Web Framework)
* **Modular Router Organization:** Endpoints are decoupled into domain routers mounted under `/api` (`/auth`, `/products`, `/sales`, `/customers`, `/analytics`).
* **Multi-Layered Middleware Pipeline:**
  * **Authentication (`authMiddleware.js`):** Intercepts requests to verify JWT tokens from either secure HTTP-only cookies or `Authorization: Bearer <token>` headers, attaching the authenticated store owner to `req.user`.
  * **Input Validation (`validateRequest.js` + `express-validator`):** Enforces strict data contracts, including 10-digit phone regex validation, email formatting, discount caps ($\le 50\%$), and non-negative tender amounts before hitting controllers.
  * **Global Error Handler (`errorMiddleware.js`):** Catches uncaught exceptions and database constraint violations (e.g., duplicate SKUs), sanitizing stack traces and outputting predictable JSON payloads (`{ success: false, message: ... }`).
* **Streaming CSV Data Pipelines:** Express handles batch inventory ingestion with streaming CSV parsers and generates live downloadable CSV exports on the fly.

#### ⚛️ R — React 18 (Frontend Client & POS Terminal)
* **High-Speed Keyboard-Driven POS Terminal:** Engineered for cashiers with hotkey event listeners (`F2` search focus, `F9` instant checkout, `Esc` dismiss, `+` / `-` item quantity steppers) to eliminate mouse dependency at billing counters.
* **Component-Based Modular Architecture:** Interface is structured into reusable design system components (`pos/`, `inventory/`, `analytics/`, `layout/`, `common/`) powered by Tailwind CSS.
* **Centralized Context State Management:**
  * `AuthContext.jsx`: Provides reactive authentication state, auto-refreshes sessions via `/api/auth/me`, and manages synchronized local storage token fallbacks.
  * `ThemeContext.jsx`: Manages UI presentation themes.
* **Real-Time Data Visualization:** Integrates **Recharts** to render dynamic 7-day revenue vs. profit bar charts and interactive product category revenue split charts.
* **Thermal Receipt Printing & WhatsApp API:** Implements print-specific CSS media queries (`@media print`) tailored for 80mm/58mm thermal receipt printers, and generates pre-encoded `https://wa.me/` URLs for one-click digital Khata receipts sent directly to customer phones.

#### 🟢 N — Node.js (Runtime Engine & Asynchronous Server)
* **Non-Blocking Asynchronous Event Loop:** Handles high-volume parallel requests—such as concurrent POS checkouts, catalog lookups, and analytics calculations—with zero thread blocking.
* **Cryptographic Security:** Utilizes `bcryptjs` (with 10 salt rounds) for password hashing and `jsonwebtoken` for issuing and validating signed stateless session tokens.
* **Automated Self-Healing Bootstrapper:** `server.js` executes startup hooks that verify database connectivity, detect missing or fresh databases, and automatically seed demo FMCG datasets and store credentials so the system runs out-of-the-box.
* **Native Zero-Dependency Test Suite:** Uses Node's built-in `node:test` and `node:assert/strict` harness to validate core business invariants (gross margins, stock deductions, Khata surplus drawdown, drawer balancing) in milliseconds without bulky external test dependencies.

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

## 🧪 Automated Test Suite (14/14 Passing)

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
12. Seeded demo store owner authentication via email (`owner@kiranacloud.com`).
13. Seeded demo store owner authentication via 10-digit mobile (`9811234567`).
14. Strict identifier format validation for both mobile phone and email login.

---

## 📄 License
This project is licensed under the **MIT License**.
