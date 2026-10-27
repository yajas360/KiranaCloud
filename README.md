# StorePulse POS — Smart Retail Inventory & Point-of-Sale Billing System

> Complete MERN-Stack Retail Management & Billing Solution built for modern physical stores, grocery supermarkets, and daily-needs retailers.

---

## 1. Project Information

- **Project Name:** StorePulse POS
- **Domain:** Retail Operations, Point-of-Sale (POS) & Inventory Management
- **Architecture:** Full-Stack MERN (MongoDB, Express.js, React.js with Vite, Node.js)
- **Target Users:** Retail store owners, supermarket cashiers, boutique managers, and inventory supervisors.

---

## 2. Problem Statement

Small-to-medium retail stores face constant operational hurdles:
1. **Stockouts & Overselling:** Shopkeepers run out of high-demand items unexpectedly, leading to lost customer sales.
2. **Slow Checkout Queues:** Manual billing and calculator arithmetic cause calculation errors, long lines, and missing sales records.
3. **Hidden Profit Margins:** Store owners know daily cash revenue but cannot calculate **actual gross profit** after deducting wholesale supplier cost prices (CP).
4. **Scattered Khata (Credit) Ledgers:** Regular customer store credit (Udhaar) is tracked on easily lost paper notebooks with no payment settlement records.

---

## 3. The Solution

**StorePulse POS** digitizes end-to-end store operations:
- **High-Speed Counter POS:** Instant product search, SKU scanning, stock verification, and digital receipt generation.
- **Atomic Stock Deduction Engine:** Every checkout automatically decrements shelf inventory in MongoDB, preventing negative inventory or overselling.
- **Safety Stock Threshold Detection:** Identifies products dropping below safety levels and compiles an instant **Supplier Reorder Sheet**.
- **Real-Time Gross Profit Intelligence:** Automatically calculates $\text{Revenue} - \text{Wholesale Cost Price}$ to show the store owner true daily net profits.
- **Integrated Customer Khata:** Digital ledger for customers purchasing on credit with record-keeping for cash/UPI settlements.

---

## 4. Key Workflows (Application Logic)

```text
[1. Supplier Stock Inbound]
   Product added with Cost Price (CP) & Selling Price (SP) + Safety Threshold
                     ↓
[2. Live POS Counter Checkout]
   Search item → Validate Stock Ceiling → Apply Discount & GST → Generate Digital Receipt
                     ↓
[3. Atomic Inventory Deduction]
   Stock decrements in DB → System triggers Low-Stock alert if stock ≤ MinThreshold
                     ↓
[4. Supplier Reorder Compilation]
   Auto-generates printable purchase requisition sheet for wholesale distributors
                     ↓
[5. Real-Time Profit Analytics]
   Calculates Gross Margin %, Daily Net Profit, and Top-Selling Products
```

### Core Features:
1. **Live POS Billing Counter:**
   - Real-time product search by title or SKU.
   - Quantity controls with hard stock ceilings (cannot add more than available units).
   - Instant calculation of Subtotal, Discount, GST/Tax, and Grand Total.
   - Payment modes: Cash (with Cash Given & Change Due calculator), UPI, Card, and Store Credit (Khata).
   - Printable thermal invoice receipt with store header, itemized breakdown, and date/time.

2. **Inventory Management & SKU Catalog:**
   - Full CRUD: Add, Edit, Delete, and Search products.
   - Multi-category support (Dairy, Grocery, Snacks, Beverages, Personal Care, Household, Stationery).
   - Visual Stock Badges (`In Stock` - Green, `Low Stock` - Amber, `Out of Stock` - Red).
   - Inbound Restock modal to quickly add incoming supplier deliveries.

3. **Supplier Reorder Sheet Generator:**
   - Automatically detects all products where $\text{Stock Quantity} \le \text{Safety Threshold}$.
   - Calculates recommended order quantities and estimated wholesale budget required.
   - Printable purchase requisition for wholesale distributors.

4. **Sales History & Void Invoices:**
   - Complete audit trail of invoices with customer details and payment modes.
   - Reprint any historical invoice on demand.
   - 1-click **Void Sale** feature that automatically restores inventory stock in MongoDB.

5. **Customer Khata (Credit Ledger):**
   - Track outstanding debt balances for regular credit customers.
   - Record cash/UPI payment settlements toward debt with timestamped history.

6. **Analytics & Profit Dashboard:**
   - Today's Revenue, Net Profit, Margin %, and Invoice Count.
   - 7-Day Revenue vs. Profit comparative bar chart.
   - Sales by Category donut breakdown.
   - Top 5 best-selling products by volume and revenue.

---

## 5. Technology Stack

- **Frontend:**
  - React.js 18 (Vite build tool)
  - React Router DOM 7
  - Tailwind CSS 3
  - Lucide React (Fintech/retail icons)
  - Recharts (Interactive charts for sales & profit)
  - Axios (with HTTP credentials)
- **Backend:**
  - Node.js & Express.js (REST API MVC architecture)
  - MongoDB & Mongoose ODM
  - JSON Web Tokens (JWT) stored in HTTP-only cookies
  - bcryptjs (Password hashing)
  - Express-Validator (Server-side input validation)
  - MongoDB Memory Server (Intelligent local evaluation fallback if MongoDB service is stopped)

---

## 6. Architecture & Directory Structure

```text
mern-end-term-final/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── api/axios.js         # Configured Axios client
│   │   ├── components/
│   │   │   ├── common/          # Badges, Spinners, Empty states
│   │   │   ├── inventory/       # Product & Restock modals
│   │   │   ├── layout/          # Sidebar, Header, Layout
│   │   │   └── pos/             # ProductPicker, CartDrawer, ReceiptModal
│   │   ├── context/AuthContext  # Store authentication state
│   │   ├── pages/               # POS, Inventory, Reorder, Khata, Analytics
│   │   ├── routes/              # ProtectedRoute guard
│   │   ├── utils/formatters.js  # Currency (₹), date, stock helpers
│   │   ├── App.jsx              # Router configuration
│   │   └── main.jsx
│   └── package.json
├── server/                      # Express Backend
│   ├── config/db.js             # Mongoose connection with Memory Server fallback
│   ├── controllers/             # Product, Sale, Customer, Analytics controllers
│   ├── middleware/              # JWT protect, Error handler, Validator
│   ├── models/                  # Product, Sale, Customer, User models
│   ├── routes/                  # Express REST routes
│   ├── scripts/seed.js          # Demo store seeding script
│   ├── tests/                   # Mathematical logic unit tests
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server entry point
│   └── package.json
├── README.md
└── package.json
```

---

## 7. Local Setup & Installation

### Prerequisites:
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Clone & Install Dependencies
```bash
# Clone the repository
git clone <your-repo-url>
cd mern-end-term-final

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/storepulse
JWT_SECRET=storepulse_super_secret_jwt_key_2026_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*(Note: If local MongoDB is not running, the application automatically launches an in-memory MongoDB instance for zero-friction evaluation!)*

### Step 3: Seed Demo Data
Populate the store catalog, sales history, and customer Khata:
```bash
# From root directory:
npm run seed
# Or inside server/:
node scripts/seed.js
```

**Pre-configured Demo Credentials:**
- **Email:** `owner@storepulse.com`
- **Password:** `password123`
*(Or simply click the "Explore Demo Store" button on the login screen for 1-click access!)*

### Step 4: Run the Application
Open two terminal windows:

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
# Frontend runs on http://localhost:5173
```

---

## 8. Running Automated Tests

Run the backend unit tests to verify the core mathematical formulas:
```bash
cd server
npm test
```

---

## 9. Demo Video Script Guide (3–5 Minutes)

When recording your demo video, follow this workflow:

1. **Introduction (30s):**
   - Introduce yourself and StorePulse POS.
   - Explain the problem: stores losing revenue from unmonitored stockouts and not knowing daily profit.
2. **Dashboard Overview (45s):**
   - Show Today's Revenue and Net Profit ($\text{SP} - \text{CP}$).
   - Highlight the 7-day revenue trend chart and the **Low-Stock Alert banner**.
3. **POS Billing Counter (60s):**
   - Navigate to the POS screen.
   - Search for an item (e.g. *Amul Milk*), add 2 units to cart.
   - Note the stock availability check (demonstrate that you cannot add more than available shelf stock).
   - Apply a small discount, select payment method (`Cash`), input cash tendered, and click **Complete Sale**.
   - Show the **printable digital invoice modal** with itemized totals and store header.
4. **Inventory & Stock Decrement (45s):**
   - Open Inventory: show that the purchased product's stock **automatically decremented**.
   - Show how it dropped below threshold into **Low Stock** (Amber badge).
   - Demonstrate the **Restock Inbound** button adding 15 units.
5. **Supplier Reorder Sheet & Customer Khata (45s):**
   - Show the auto-compiled Reorder Sheet with estimated wholesale costs.
   - Show the Customer Khata ledger with recorded payments.
6. **Conclusion (15s):**
   - Conclude by stating that StorePulse provides complete operational control for retail store owners.
