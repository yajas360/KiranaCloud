# 🛒 KiranaCloud POS — Smart Retail Inventory & Point-of-Sale System

[![Live Demo](https://img.shields.io/badge/Demo-kirana--cloud--4cxc.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://kirana-cloud-4cxc.vercel.app/)
[![Build Status](https://img.shields.io/badge/Client_Build-Passing-emerald?style=for-the-badge&logo=vite)](https://kirana-cloud-4cxc.vercel.app/)
[![Test Suite](https://img.shields.io/badge/Tests-11%2F11_Passing-success?style=for-the-badge&logo=node.js)](file:///server/tests)
[![Node Version](https://img.shields.io/badge/Node-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A modern, full-stack **MERN** Retail Management & High-Speed POS Billing platform built to handle the real-world chaos of neighborhood retail shops, departmental stores, and FMCG kirana businesses. Features atomic stock deductions, live gross-margin intelligence, customer credit (Khata) with advance surplus balancing, and day-close cash drawer reconciliation (Z-Reports).

---

## 🌐 Live Production Deployment

- **Production URL:** [https://kirana-cloud-4cxc.vercel.app](https://kirana-cloud-4cxc.vercel.app)
- **Default Store Credentials:**
  - **Email:** `owner@kiranacloud.com`
  - **Password:** `password123`
  *(Pre-seeded with real supermarket items across Groceries, Dairy, Beverages, Snacks, Personal Care, and Household supplies, plus active customer credit accounts).*

---

## 📖 The Story & Ground Reality

Most local retail stores in India and emerging markets run on a fragile mix of paper diaries (red *Bahi-Khata* books), fragmented Excel spreadsheets, and stand-alone desktop billing software that hasn't seen an update since 2008.

During peak evening rush hours (6:00 PM – 9:30 PM), shopkeepers face four recurring operational bottlenecks:

1. **The Ghost Stockout:** A customer asks for 5 packets of Fortune Sunflower Oil or 2 litres of Amul Taaza Milk. The cashier enters the order only to discover the shelf is empty. Meanwhile, the distributor was never alerted because no safety threshold was tracked.
2. **The Margin Blindspot:** The cashier rings up ₹45,000 in gross sales today and feels great—until month-end, when vendor invoices arrive and they realize they sold high-volume items at a 2% margin while wholesale costs had quietly risen.
3. **The Khata (Udhaar) Friction:** Uncle Sharma or Gopal Bhai buys groceries on credit. Gopal hands over a ₹500 note against a ₹320 bill and says *"Bhaiya, baaki paise mere khate me jama rakhna (keep the remaining balance in my credit account)"*. Weeks later, no one remembers whether Gopal owes money or has an advance surplus.
4. **The Missing Cash at Closing Time:** At 10:30 PM, the shutter goes down. Cash in drawer should be ₹24,800, but the count comes to ₹23,950. Was it change given incorrectly? An unrecorded cash payout to a vendor? Or a missed Khata repayment?

**KiranaCloud was built from the ground up to solve these exact retail realities.**

---

## 🏗️ Architecture & Core System Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KiranaCloud Client (React 18 + Vite)            │
│  - POS Billing Terminal (Hotkeys, Stock Ceilings, Accidental Guard)    │
│  - Inventory Manager (Cost/Selling Price, Multi-Units, CSV Engine)     │
│  - Reorder Sheet (Zero-Scroll Grid, Reorder Math, 1-Click Restock)     │
│  - Customer Khata (Credit Ceilings, Advance Surplus, WhatsApp Alerts)   │
│  - Day-Close Drawer Balancing & Auditing (Thermal Z-Report)            │
│  - Executive Analytics (Gross Margins, Trends, Category Split)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (Axios + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Node.js / Express.js REST API                   │
│  - JWT Cookie & Header Authentication Middleware                       │
│  - Atomic MongoDB Updates ($inc / $gte Concurrency Locks)              │
│  - Khata Advance Surplus & Historical Ledger Reconciler                │
│  - Cash Drawer Day-Close Auditing Engine                               │
│  - CSV Parsing & Bulk Upsert Pipeline                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Production) / In-Memory Server             │
│  - Collections: Users, Products, Sales, Customers, DayCloses           │
│  - Compound Indexes: { user: 1, sku: 1 }, { user: 1, phone: 1 }        │
│  - Auto-Fallback: Built-in MongoMemoryServer for instant local runs    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Functional Modules

### 🛒 1. High-Speed POS Billing Terminal
- **Instant Product Lookup:** Search in real-time by item name, SKU, or filter by category and price sorting (Low to High, High to Low).
- **Physical Stock Ceilings:** Live stock indicators (`14 packet left`, `30 litres left`) prevent cashiers from adding more units than physically sit on the shelf.
- **Accidental-Add Protection:** Distinct dedicated `+` and `-` controls prevent misclicks during busy rushes.
- **Pre-Billing Confirmation Guard:** Prevents accidental checkouts by reviewing the itemized breakdown, bill discount, and payment tender before atomic database commit.
- **Intelligent Discount Guardrail:** Disallow negative values and enforces a hard ceiling of **50% maximum discount** against total bill value to protect store margins.
- **Multi-Tender Payments:**
  - **Cash:** Live change calculation (`Cash Tendered - Grand Total = Change Due`).
  - **UPI / QR Code:** Fast digital payment confirmation.
  - **Card:** Debit/Credit card reference tracking.
  - **Store Credit (Khata):** Bill directly to an existing customer ledger (or draw down from their advance balance).
- **Slip Generation:**
  - Standard thermal receipt generation in an isolated print frame.
  - Plain-text slip download (`.txt`) for offline archival.
  - 1-click **Copy Digital Invoice** pre-formatted for instant WhatsApp/SMS sharing.

### 📦 2. Inventory Catalog & Multi-Unit Support
- **Wholesale CP & Retail SP Tracking:** Every item tracks both Wholesale Cost Price and Retail Selling Price, immediately calculating profit margins.
- **Dynamic Price Editing:** Update retail selling prices or wholesale costs on the fly anytime—via the inventory modal or during restock receipts.
- **Standardized Retail Units:** Comprehensive retail packaging units:
  - `litres` (Oil, Milk, Juices, Ghee)
  - `kg` (Atta, Rice, Dal, Sugar, Potatoes)
  - `packet` (Biscuits, Bread, Namkeen, Spices)
  - `box` (Tea, Cereals, Sweet Boxes)
  - `pcs` (Soaps, Chocolates, Batteries, Brushes)
  - `bottle` / `can` (Cold drinks, cleaning liquids)
- **Bulk CSV Spreadsheet Engine:**
  - Import hundreds of inventory items in seconds. Includes a live client-side table preview before committing to MongoDB.
  - Downloadable template: `kiranacloud_products_template.csv`.
  - 1-click full catalog CSV export with timestamped filenames for offline accounting.

### 📋 3. Supplier Reorder Sheet
- **Zero Horizontal Scroll UX:** Clean, uniform layout mirroring the main inventory sheet, eliminating awkward left-right table scrolling.
- **Automated Safety Triggers:** Filters items in real-time where $\text{Current Stock} \le \text{Safety Threshold}$.
- **Replenishment Recommendations:** Automatically computes the suggested order quantity to bring shelves back to healthy buffer levels:
  $$\text{Suggested Order} = (\text{Safety Threshold} \times 2) - \text{Current Stock}$$
- **Budget Forecast:** Estimates total wholesale capital needed per vendor before placing supply orders.
- **Inbound Quick Restock:** Restock modal allows increasing shelf stock and updating vendor purchase prices in one step.

### 👥 4. Digital Customer Khata & Advance Surplus Engine
- **Credit Limit Ceilings:** Configure individual debt allowances (e.g., ₹5,000 for verified locals) and block over-limit sales unless explicitly overridden.
- **Complete Chronological Ledger:** Every transaction logs a timestamped entry:
  - `PURCHASE` (`+₹X`) — Groceries bought on credit.
  - `PAYMENT` (`-₹X`) — Cash/UPI received from the customer.
  - `REFUND` (`+₹X` settlement) — Advance surplus refunded back in cash.
- **Customer Advance Surplus Handling (The Gopal Scenario):**
  - If a customer pays more than their outstanding debt, KiranaCloud does not reject or lose the difference; it converts the excess into **Advance Credit** (negative balance).
  - Subsequent POS purchases automatically draw down against this advance credit first before creating any new debt.
  - If the customer requests their surplus balance back in cash, shopkeepers can execute a **1-click Cash Refund** to balance the account back to ₹0.00.
- **WhatsApp Payment Reminders:** Generates a pre-composed WhatsApp message with customer name, store name, outstanding debt, and store UPI payment details in a single click.
- **Quick Repayment Chips:** Instant settlement buttons for fast tallying: **Full Due**, **50%**, **₹500**, or **₹1,000**.

### 🧾 5. Day-Close Cash Reconciliation (Z-Report)
- **Cash Register Balancing:** Reconciles the cash drawer at the end of the shift or trading day.
- **Audit Formula:**
  $$\text{Expected Cash in Drawer} = \text{Starting Float} + \text{Cash Sales Today} + \text{Khata Cash Payments Today}$$
- **Discrepancy Highlighting:** Compares expected register cash against the cashier's physical count:
  - **Balanced:** Exact match (`₹0.00` discrepancy).
  - **Shortage:** Missing cash (`-₹X`, flagged in red for store owner investigation).
  - **Surplus:** Excess cash (`+₹X`, flagged in amber).
- **Official Daily Z-Report Thermal Slip:** Formatted for 80mm thermal printers to hand to store owners or filing with store accountants.

### 📊 6. Analytics & Profit Intelligence
- **Real-Time KPIs:** Live metric cards for Today's Revenue, Gross Profit, Average Margin %, and Total Completed Invoices.
- **True Gross Profit Formula:**
  $$\text{Gross Profit} = \sum_{i=1}^{n} (\text{Selling Price}_i - \text{Wholesale Cost Price}_i) \times \text{Quantity}_i$$
- **7-Day Trend Chart:** Side-by-side comparative bars illustrating daily Revenue vs. Net Take-Home Profit.
- **Category Contribution Donut:** Revenue breakdown across Dairy, Groceries, Beverages, Personal Care, and Household.
- **Top 5 Bestsellers:** Ranked by unit sales and revenue contribution.
- **Invoice Auditing & Voiding:** Search historical bills, view itemized slips, and void accidental invoices with automatic shelf stock restoration.

---

## ⌨️ POS Keyboard Shortcuts Cheat Sheet

Designed so cashiers rarely have to touch the mouse during rapid checkout:

| Shortcut | Action | Description |
|---|---|---|
| `F2` | **Focus Search** | Instantly highlights the product search bar |
| `F9` | **Quick Checkout** | Opens the billing confirmation modal |
| `Esc` | **Clear / Close** | Closes active modals or clears the search bar |
| `+` / `-` | **Quantity Adjust** | Increments or decrements selected product count |
| `Enter` | **Confirm Tender** | Submits cash tender or confirms checkout modal |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework:** React 18 with Vite for sub-second hot-module replacement (HMR).
- **Styling:** Tailwind CSS with unified dark mode (`bg-slate-950`) and light mode (`bg-slate-50`).
- **Icons:** Lucide React for consistent, crisp SVG iconography.
- **State Management:** React Context API (`AuthContext`) with persistent session storage.
- **HTTP Client:** Axios with JWT request interceptors and error handling.

### Backend Architecture
- **Runtime:** Node.js (v18+) with Express.js REST API.
- **Database:** MongoDB Atlas (Cloud) with Mongoose ODM.
- **Zero-Dependency Fallback:** Integrated `mongodb-memory-server` allows the entire backend and test suite to run instantly on any machine without installing a local MongoDB service.
- **Authentication:** Stateless JSON Web Tokens (JWT) stored in HTTP-only cookies or Bearer headers.
- **Security:** Password hashing using `bcryptjs` (salt rounds: 10), CORS origin validation, and MongoDB atomic operator sanitization.

---

## 📐 Engineering Decisions & Technical Highlights

### 1. Concurrency-Safe Atomic Stock Deduction
In high-volume retail, two cashiers at different terminals might try to ring up the last packet of butter at the exact same second. A naive `find -> if(stock > 0) -> save` approach creates a race condition that leads to overselling.

KiranaCloud uses atomic MongoDB conditional queries:
```javascript
const updatedProduct = await Product.findOneAndUpdate(
  { _id: item.productId, user: req.user._id, stock: { $gte: item.quantity } },
  { $inc: { stock: -item.quantity } },
  { new: true, session }
);

if (!updatedProduct) {
  throw new Error(`Insufficient stock for "${item.name}". Shelf stock changed.`);
}
```
If available stock is less than requested, the update atomically matches zero documents, preventing overselling without requiring heavy table locks.

### 2. Floating-Point Money Arithmetic Safeguards
JavaScript's native IEEE-754 floating-point math can result in errors like `0.1 + 0.2 = 0.30000000000000004`, which can throw off cash drawer balances by a few paise.

KiranaCloud standardizes all retail calculations through explicit precision rounding helpers:
```javascript
const roundCurrency = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;
```
Every discount calculation, GST addition, and change computation is sanitized through `roundCurrency` before database persistence.

---

## 📁 Repository Directory Structure

```text
mern-end-term-final/
├── client/                              # React 18 + Vite Frontend Application
│   ├── public/                          # Static assets and favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                 # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   │   └── DayCloseModal.jsx    # Daily cash drawer reconciliation modal
│   │   │   ├── common/
│   │   │   │   ├── EmptyState.jsx       # Zero-state placeholders
│   │   │   │   ├── LoadingSpinner.jsx   # Async loading state indicators
│   │   │   │   └── StockBadge.jsx       # In-stock / low-stock visual pill
│   │   │   ├── inventory/
│   │   │   │   ├── ProductModal.jsx     # Add/edit product modal
│   │   │   │   └── RestockModal.jsx     # Inbound batch stock replenishment
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx           # Topbar with profile & day-close shortcut
│   │   │   │   ├── Layout.jsx           # Main page shell with sidebar
│   │   │   │   └── Sidebar.jsx          # Slim navigation sidebar with active indicator
│   │   │   └── pos/
│   │   │       ├── CartDrawer.jsx       # Counter shopping cart with discount & tender
│   │   │       ├── ProductPicker.jsx    # Fast search & categorized product grid
│   │   │       └── ReceiptModal.jsx     # Thermal receipt generator & WhatsApp export
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # User session, login/logout, store metadata
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Analytics KPIs, gross profit, sales charts
│   │   │   ├── Invoices.jsx             # Historical bill archive, voiding, slip printing
│   │   │   ├── Inventory.jsx            # Full catalog management, bulk CSV import/export
│   │   │   ├── Khata.jsx                # Customer credit ledger & advance surplus manager
│   │   │   ├── Landing.jsx              # Product marketing and login landing page
│   │   │   ├── Login.jsx                # Store owner authentication
│   │   │   ├── POS.jsx                  # High-speed point-of-sale counter terminal
│   │   │   ├── Register.jsx             # Store registration page
│   │   │   ├── Reorder.jsx              # Zero-scroll supplier replenishment sheet
│   │   │   └── Settings.jsx             # Store tax, invoice header, and currency preferences
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx       # Route guard for authenticated store staff
│   │   ├── utils/
│   │   │   └── formatters.js            # Currency (INR), date, and unit formatters
│   │   ├── App.jsx                      # Client router configuration
│   │   ├── index.css                    # Global Tailwind directives & scrollbar styles
│   │   └── main.jsx                     # Vite client entry point
│   ├── index.html                       # HTML5 template with Google fonts
│   ├── tailwind.config.js               # Theme extensions & brand colors
│   ├── vite.config.js                   # Vite dev server and proxy rules
│   └── package.json
│
├── server/                              # Node.js + Express.js Backend REST API
│   ├── config/
│   │   └── db.js                        # MongoDB Atlas + In-Memory fallback connector
│   ├── controllers/
│   │   ├── analyticsController.js       # KPI metrics & day-close reconciliation
│   │   ├── authController.js            # Registration, login, profile updates
│   │   ├── customerController.js         # Khata ledger, payments, advance surplus & refunds
│   │   ├── productController.js          # CRUD, CSV bulk import/export, restock
│   │   └── saleController.js             # Atomic counter checkout & invoice voiding
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT verification & role authorization
│   │   ├── errorMiddleware.js           # Centralized exception & Mongoose error handler
│   │   └── validationMiddleware.js      # Input sanitization and format validation
│   ├── models/
│   │   ├── Customer.js                  # Khata schema with history & advance surplus virtuals
│   │   ├── DayClose.js                  # Daily cash register audit records
│   │   ├── Product.js                   # Inventory schema with unit enums & cost price
│   │   ├── Sale.js                      # Invoice schema with items, discounts & profit
│   │   └── User.js                      # Store profile and encrypted credentials
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── productRoutes.js
│   │   └── saleRoutes.js
│   ├── scripts/
│   │   └── seed.js                      # Demo store seeder with realistic Indian FMCG items
│   ├── tests/
│   │   └── businessLogic.test.js        # Comprehensive 11-test mathematical test suite
│   ├── app.js                           # Express app, middleware, and route mounting
│   ├── server.js                        # Server listener bootstrap
│   └── package.json
│
├── .gitignore                           # Git ignore rules for node_modules, build, .env
├── package.json                         # Root project scripts runner
└── README.md                            # Complete system documentation
```

---

## 📡 REST API Reference

All protected endpoints require a valid JWT passed via `Authorization: Bearer <token>` or an `auth_token` HTTP-only cookie.

### Authentication Endpoints
| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new store owner | `{ "name": "Yajas", "email": "store@kirana.com", "password": "...", "storeName": "Supermarket" }` |
| `POST` | `/api/auth/login` | Authenticate & get token | `{ "email": "store@kirana.com", "password": "..." }` |
| `GET` | `/api/auth/me` | Current store profile | *None (Requires Auth)* |
| `PATCH` | `/api/auth/profile` | Update store configuration | `{ "storeName": "Yajas Mega Store", "taxRate": 5 }` |

### Products & Inventory
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Query products with `search`, `category`, `sort`, `page`, and `limit` |
| `POST` | `/api/products` | Create new SKU with selling price, cost price, unit, and threshold |
| `PATCH` | `/api/products/:id` | Update product details, retail price, or wholesale cost |
| `DELETE` | `/api/products/:id` | Remove SKU from catalog |
| `POST` | `/api/products/:id/restock` | Increment stock quantity with optional purchase price update |
| `GET` | `/api/products/reorder-sheet` | Retrieve all SKUs where `stock <= safetyThreshold` |
| `GET` | `/api/products/export-csv` | Download complete product catalog as a CSV spreadsheet |
| `POST` | `/api/products/bulk-import` | Batch upsert array of parsed CSV product objects |

### Sales & Point-of-Sale
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sales` | Create sale with atomic stock deduction and profit recording |
| `GET` | `/api/sales` | Fetch paginated historical sales invoices with date/search filters |
| `GET` | `/api/sales/:id` | Fetch full single invoice details for receipt printing |
| `PATCH` | `/api/sales/:id/void` | Void an invoice and atomically restore product stock |

### Customer Khata (Credit Ledger & Surplus)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | Fetch all Khata customers with net balances and debt stats |
| `POST` | `/api/customers` | Register a customer with 10-digit phone and credit limit |
| `POST` | `/api/customers/:id/payment` | Record a cash/UPI repayment against customer balance |
| `POST` | `/api/customers/:id/refund` | Record a cash refund when settling advance surplus balance |
| `DELETE` | `/api/customers/:id` | Delete customer account (only if balance is ₹0) |

### Analytics & Day-Close Auditing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/metrics` | Retrieve dashboard KPI cards, 7-day revenue/profit, and category split |
| `GET` | `/api/analytics/day-close/summary`| Live register summary (starting float, cash sales, Khata cash) |
| `POST` | `/api/analytics/day-close` | Submit cashier's physical cash count and store daily Z-Report |

---

## 🚀 Local Installation & Setup Guide

### System Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git**
- *(Optional)* Local MongoDB daemon. If you don't have MongoDB installed, **no problem**! The backend automatically spins up an in-memory database (`mongodb-memory-server`) so you can run the app immediately.

### 1. Clone the Repository
```bash
git clone https://github.com/yajas360/KiranaCloud.git
cd KiranaCloud
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory:
```bash
# Inside server/.env:
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=kiranacloud_secret_jwt_key_super_secure_2026
JWT_EXPIRES_IN=7d

# Optional: If omitted or connection fails, the server
# automatically starts an In-Memory MongoDB instance!
MONGODB_URI=mongodb://127.0.0.1:27017/kiranacloud
```

### 4. Seed the Database
Populate your database with realistic supermarket inventory (Amul, Aashirvaad, Dettol, Britannia, etc.), customer Khata accounts (including advance surplus examples), and historical invoices:
```bash
# Run from the project root:
npm run seed

# Or from inside the server directory:
cd server
npm run seed
```

### 5. Start the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Express API starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite client starts on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173`. Log in with:
- **Email:** `owner@kiranacloud.com`
- **Password:** `password123`

---

## 🧪 Automated Test Suite (11/11 Passing)

The project includes an automated unit test suite verifying core retail mathematics, concurrency handling, and accounting invariants.

Run tests using:
```bash
npm test
# Or inside the server folder:
cd server
npm test
```

### What the Test Suite Verifies:

```
▶ Store Inventory & POS Billing Logic
  ✔ correctly calculates subtotal, tax, discount, and grand total (1.7ms)
  ✔ calculates accurate gross profit margin (SP - CP) * quantity (0.3ms)
  ✔ atomic stock decrement correctly flags low-stock threshold trigger (0.4ms)
  ✔ prevents checkout when requested quantity exceeds available stock (0.2ms)
  ✔ validates customer credit limit ceiling during Khata credit sales (0.3ms)
  ✔ strictly enforces maximum 50% discount ceiling on bill value (0.3ms)
  ✔ correctly calculates day-close cash reconciliation and drawer discrepancy (0.3ms)
  ✔ validates that cash tendered cannot be negative and computes accurate change (0.2ms)
  ✔ validates customer 10-digit phone number format and credit limits (0.4ms)
  ✔ Khata advance credit logic when customer overpays and subsequent bill drawdown (0.4ms)
  ✔ Gopal ledger scenario: reconciles true surplus from historical purchases and payments (0.2ms)
✔ Store Inventory & POS Billing Logic (6.2ms)
ℹ tests 11 | pass 11 | fail 0 | cancelled 0 | skipped 0
```

1. **Subtotal, Tax, and Discount Formula:** Verifies precision rounding across itemized quantities, percentage discounts, and multi-tier tax rates.
2. **Gross Margin Audit:** Asserts that net profit is derived strictly from $(\text{Selling Price} - \text{Wholesale Cost Price}) \times \text{Quantity}$.
3. **Atomic Low-Stock Triggers:** Confirms that when stock decrements to or below the safety threshold, the system flags the product for reorder.
4. **Overselling Prevention:** Guarantees that sales requesting more stock than physically available are rejected.
5. **Credit Limit Ceiling:** Asserts that Khata sales exceeding the customer's pre-set credit limit cannot be finalized without authorization.
6. **Maximum 50% Discount Constraint:** Prevents cashiers from inadvertently or fraudulently applying excessive discounts.
7. **Day-Close Discrepancy Math:** Verifies correct calculation of `Matched`, `Shortage`, and `Surplus` in physical drawer counts.
8. **Cash Tender Validation:** Ensures negative tender cannot be submitted and change calculations are exact.
9. **Phone Number Formatting:** Enforces standard 10-digit mobile number validation.
10. **Advance Surplus Drawdown:** Confirms that when a customer overpays, their excess cash is credited as advance surplus and draws down on subsequent visits.
11. **Gopal Ledger Scenario:** Comprehensive multi-step ledger test simulating customer purchases, overpayment, surplus creation, and live drawdown.

---

## 🚢 Deployment Details

- **Frontend:** Deployed on **Vercel** with single-page application routing rewrite rules in `vercel.json`.
- **Backend:** Node/Express service running on Render / Cloud container with CORS origins whitelist.
- **Database:** MongoDB Atlas M0 Cluster with multi-region replication.

---

## 📄 License

This software is released under the **MIT License**. Feel free to use, modify, and distribute it for both educational and commercial retail management purposes.
