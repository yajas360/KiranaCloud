# KiranaCloud POS — Smart Retail Inventory & Point-of-Sale Billing System

> Production-ready, full-stack **MERN** Retail Management & Point-of-Sale solution designed for physical retail shops, supermarkets, kirana stores, and daily-needs businesses.

---

## 1. Project Overview

- **Project Name:** KiranaCloud POS
- **Architecture:** Full-Stack MERN (MongoDB, Express.js, React.js with Vite, Node.js)
- **Target Audience:** Supermarkets, convenience stores, grocery retailers, and shop managers needing fast counter checkout, live inventory tracking, customer credit (Khata) management, and daily cash drawer balancing.

---

## 2. Problem Statement & Key Solutions

Small and mid-size retail stores struggle with four major daily problems:
1. **Overselling & Stockouts:** Running out of high-demand items unexpectedly or selling out-of-stock items due to manual counting.
   - *Solution:* **Atomic Stock Verification & Deduction** — every sale validates real-time shelf stock and decrements inventory in MongoDB immediately.
2. **Queue Delays & Calculation Errors:** Manual tallying of discounts, GST, and cash change causes counter congestion.
   - *Solution:* **High-Speed Billing Counter** — dedicated `+` button addition, hard 50% max discount ceiling, automated GST calculations, and change-due engine.
3. **Hidden Margins & Cash Drawer Discrepancies:** Shopkeepers see cash flowing in, but don't know their actual gross profit after wholesale cost price, and struggle to balance the physical cash drawer at the end of the day.
   - *Solution:* **Live Gross Profit Intelligence ($\text{Selling Price} - \text{Cost Price}$) & Day-Close Cash Reconciliation (Z-Report)**.
4. **Scattered Khata (Credit) Notebooks:** Customer credit (Udhaar) is tracked on easily lost paper notebooks.
   - *Solution:* **Digital Customer Khata** — credit limit ceilings, timestamped transaction history ledger, cash/UPI payment settlements, and 1-click WhatsApp balance reminders.

---

## 3. Core Feature Modules

### 🛒 1. Billing Counter (POS Terminal)
- **Fast Product Picker:** Search by item name, SKU, or filter by category and price (Low to High, High to Low).
- **Hard Stock Ceilings:** Live stock indicators (`X left`) prevent cashiers from adding more units than physically available.
- **Dedicated `+` & `-` Controls:** Prevents accidental adds; click the dedicated `+` button to add or increment items, and `-` to subtract.
- **Smart Discount Safeguards:** Negative discounts are blocked; discounts are strictly capped at a maximum of **50% of the bill value** with a clear `(max 50%)` indicator.
- **Multiple Payment Tender:** Supports **Cash** (with change due calculation), **UPI**, **Card**, and **Store Credit (Khata)**.
- **Digital & Printable Receipts:** Isolated print iframe for physical thermal slips, 1-click **Download Slip (.txt)**, and **Copy Digital Invoice** for sharing via WhatsApp or SMS.

### 📦 2. Inventory Catalog & Bulk CSV Operations
- **Full SKU Management:** Track Selling Price, Wholesale Cost Price, Stock Quantity, Units, Safety Thresholds, and Suppliers.
- **Price Updating Anytime:** Update both selling price and wholesale cost price anytime via the edit modal or directly during inbound restocking.
- **Bulk CSV Import:** Upload `.csv` spreadsheets with pre-import table previews to create or batch update hundreds of items in seconds.
- **Sample Template Download:** Download a pre-formatted `kiranacloud_products_template.csv` template with sample rows.
- **Inventory CSV Export:** 1-click export of the full inventory catalog with dated file naming.

### 📋 3. Supplier Reorder Sheet
- **Automated Low-Stock Trigger:** Automatically flags all items where $\text{Stock} \le \text{Safety Threshold}$.
- **Smart Reorder Calculation:** Recommends order quantities to replenish safety stock and estimates total wholesale budget needed.
- **Direct Inbound Restock:** One-click restock modal with live margin percentage calculation.

### 👥 4. Customer Khata (Digital Credit Ledger)
- **Credit Limit Ceiling:** Enforces individual credit limits and blocks over-limit sales unless explicitly overridden by the store manager.
- **Chronological Transaction Ledger:** View full history of store credit purchases (`+₹X`) and payment settlements (`-₹X`) with dates and invoice numbers.
- **1-Click WhatsApp Payment Reminder:** Send automated WhatsApp balance reminders with pre-filled debt details and store payment notes.
- **Quick Settlement Shortcuts:** Settle dues with fast chips: **Full**, **50%**, **₹500**, or **₹1,000**.

### 🧾 5. Day-Close Cash Reconciliation (Z-Report)
- **Live Register Balancing:** Available on Dashboard and Invoices; aggregates total bills, gross revenue, net profit, and payment tender breakdown.
- **Drawer Balancing Math:**
  $$\text{Expected Cash} = \text{Starting Float} + \text{Cash Sales Today} + \text{Khata Cash Recovered Today}$$
- **Discrepancy Detection:** Compares expected cash with physical cash counted in the drawer, automatically flagging **Matched** (`₹0.00`), **Shortage** (`-₹X`), or **Surplus** (`+₹X`).
- **Thermal Z-Report Print Slip:** Generates and prints an official daily store closure slip for auditing.

### 📊 6. Analytics & Performance Dashboard
- **Real-Time KPIs:** Today's Revenue, Net Profit, Profit Margin %, and Completed Bills.
- **Visual Trends:** 7-day comparative revenue vs. profit bar chart.
- **Category Breakdown:** Donut chart showing revenue distribution across store categories.
- **Top 5 Best-Selling Products:** Ranked by sales volume and revenue.

---

## 4. Tech Stack & Architecture

```text
mern-end-term-final/
├── client/                      # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/axios.js         # Axios HTTP client with JWT interceptor
│   │   ├── components/
│   │   │   ├── analytics/       # DayCloseModal (Z-Report)
│   │   │   ├── common/          # StockBadge, LoadingSpinner, EmptyState
│   │   │   ├── inventory/       # ProductModal, RestockModal
│   │   │   ├── layout/          # Sidebar (active tab indicator), Header, Layout
│   │   │   └── pos/             # ProductPicker, CartDrawer, ReceiptModal
│   │   ├── context/AuthContext  # Store profile and user session state
│   │   ├── pages/               # POS, Inventory, Reorder, Khata, Invoices, Dashboard
│   │   └── utils/formatters.js  # Currency, date, and stock status helpers
│   └── package.json
├── server/                      # Express.js REST API Backend
│   ├── config/db.js             # MongoDB connection with MongoMemoryServer fallback
│   ├── controllers/             # Product, Sale, Customer, Analytics controllers
│   ├── middleware/              # Auth protect, Error handler, Request validator
│   ├── models/                  # Product, Sale, Customer, User, DayClose models
│   ├── routes/                  # Express REST route handlers
│   ├── scripts/seed.js          # Demo store seeding script
│   ├── tests/                   # Mathematical logic unit test suite
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entry point
│   └── package.json
├── .gitignore                   # Multi-tier Git ignore configuration
├── README.md                    # System documentation
└── package.json                 # Root script runner
```

---

## 5. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| **POST** | `/api/auth/register` | Register a new retail store owner |
| **POST** | `/api/auth/login` | Authenticate store owner and set JWT cookie |
| **GET** | `/api/auth/me` | Retrieve current authenticated user and store settings |
| **GET** | `/api/products` | Fetch inventory catalog with search, filter, and pagination |
| **POST** | `/api/products` | Add a new product to inventory |
| **PATCH** | `/api/products/:id` | Update product details, selling price, or cost price |
| **DELETE** | `/api/products/:id` | Delete product from inventory |
| **POST** | `/api/products/:id/restock`| Restock product quantity and optionally update prices |
| **GET** | `/api/products/reorder-sheet` | Fetch all products below safety threshold |
| **GET** | `/api/products/export-csv` | Download complete inventory catalog as CSV |
| **POST** | `/api/products/bulk-import` | Bulk upsert products from CSV payload |
| **POST** | `/api/sales` | Create a new counter sale with atomic stock deduction |
| **GET** | `/api/sales` | Fetch all historical invoices with search and filters |
| **GET** | `/api/sales/:id` | Fetch single invoice details for receipt printing |
| **PATCH** | `/api/sales/:id/void` | Void an invoice and restore product shelf stock |
| **GET** | `/api/customers` | Fetch all Khata customers and total outstanding debt |
| **POST** | `/api/customers` | Register a new customer Khata credit account |
| **POST** | `/api/customers/:id/payment` | Record a cash/UPI repayment against customer debt |
| **DELETE** | `/api/customers/:id` | Remove customer from Khata ledger |
| **GET** | `/api/analytics/metrics` | Retrieve dashboard sales, profit, and category metrics |
| **GET** | `/api/analytics/day-close/summary` | Fetch live today's register figures for Z-Report |
| **POST** | `/api/analytics/day-close` | Submit physical cash count and save daily Z-Report |

---

## 6. Local Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- *Optional:* Local MongoDB instance (The backend includes an automatic **In-Memory MongoDB Server** fallback if no local MongoDB service is running!)

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd mern-end-term-final

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Environment Configuration
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/kiranacloud
JWT_SECRET=kiranacloud_super_secret_jwt_key_2026_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Step 3: Seed Demo Store Data
To quickly test the application with real supermarket products, sales history, and Khata accounts:
```bash
# From root directory:
npm run seed

# Or inside server directory:
cd server
npm run seed
```

**Pre-configured Credentials:**
- **Email:** `owner@kiranacloud.com`
- **Password:** `password123`

### Step 4: Run the Application
Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite runs on http://localhost:5173
```

Visit `http://localhost:5173` in your browser.

---

## 7. Running Automated Tests

Run the backend unit test suite:
```bash
cd server
npm test
```

### Test Coverage Highlights:
1. Correct calculation of subtotal, discount, GST tax, and grand total.
2. Gross profit margin formula: $(\text{Selling Price} - \text{Cost Price}) \times \text{Quantity}$.
3. Atomic stock decrements correctly triggering low-stock threshold states.
4. Prevention of sales when requested quantity exceeds available inventory stock.
5. Khata customer credit limit ceiling validation and overflow detection.
6. Strict enforcement of maximum 50% discount ceiling on bill value.
7. Day-Close cash reconciliation drawer math (Matched, Shortage, and Surplus).

---

## 8. License
This project is developed for educational and commercial retail management demonstrations under the MIT License.
