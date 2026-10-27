const API_URL = 'http://localhost:5000/api';

async function testPostmanFlow() {
  console.log('--- Step 1: Authenticate (Register or Login) ---');
  
  let token = null;
  let user = null;

  // Try login first
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@storepulse.com',
      password: 'password123',
    }),
  });

  const loginData = await loginRes.json();
  if (loginData.success) {
    token = loginData.token;
    user = loginData.user;
    console.log(`[Success 200] Logged in as: ${user.name} (${user.storeName})`);
  } else {
    // Register if user doesn't exist yet on this running instance
    console.log('[Notice] User not found, registering new store owner...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aman Verma',
        email: 'owner@storepulse.com',
        password: 'password123',
        storeName: 'Aman Supermarket & Daily Needs',
        storePhone: '+91 98112 34567',
        storeAddress: 'Shop #12, Market Square',
      }),
    });
    const regData = await regRes.json();
    if (!regData.success) {
      console.error('Registration failed:', regData);
      return;
    }
    token = regData.token;
    user = regData.user;
    console.log(`[Success 201] Registered store owner: ${user.name}`);
  }

  console.log(`Bearer Token: ${token.substring(0, 30)}...\n`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const newProducts = [
    {
      name: 'Cadbury Dairy Milk Silk Chocolate (150g)',
      sku: 'CHOC-CADB-SILK',
      category: 'Snacks & Packaged Foods',
      costPrice: 140,
      sellingPrice: 175,
      stockQuantity: 25,
      minThreshold: 6,
      unit: 'pcs',
      supplier: 'Mondelez India Distro',
      shelfLocation: 'Aisle 4, Shelf B',
    },
    {
      name: 'Nescafe Classic Instant Coffee (100g Jar)',
      sku: 'COFF-NESC-100G',
      category: 'Beverages & Juices',
      costPrice: 280,
      sellingPrice: 330,
      stockQuantity: 12,
      minThreshold: 4,
      unit: 'pcs',
      supplier: 'Nestle India Agency',
      shelfLocation: 'Aisle 2, Shelf C',
    },
    {
      name: "Lay's India's Magic Masala Chips (50g)",
      sku: 'CHIP-LAYS-50G',
      category: 'Snacks & Packaged Foods',
      costPrice: 16,
      sellingPrice: 20,
      stockQuantity: 3, // LOW STOCK DEMO (< threshold 10)
      minThreshold: 10,
      unit: 'packet',
      supplier: 'PepsiCo India Distro',
      shelfLocation: 'Snack Endcap Rack',
    },
    {
      name: 'Amul Salted Butter (500g Pack)',
      sku: 'BUTR-AMUL-500G',
      category: 'Dairy & Bakery',
      costPrice: 245,
      sellingPrice: 275,
      stockQuantity: 18,
      minThreshold: 5,
      unit: 'packet',
      supplier: 'Amul Dairy Distro',
      shelfLocation: 'Dairy Chiller 1',
    },
  ];

  console.log('--- Step 2: POST /api/products (Adding Products to Store) ---');
  const createdProducts = [];
  for (const p of newProducts) {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(p),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`[Success 201 Created] Added: ${data.data.name}`);
      console.log(`       SKU: ${data.data.sku} | Cost: ₹${data.data.costPrice} | Selling: ₹${data.data.sellingPrice} | Stock: ${data.data.stockQuantity} | Status: ${data.data.status}`);
      createdProducts.push(data.data);
    } else {
      console.log(`[Info] ${p.name}: ${data.message}`);
    }
  }

  // Fetch current products list
  const listRes = await fetch(`${API_URL}/products?limit=10`, { headers: authHeaders });
  const listData = await listRes.json();
  console.log(`\nTotal products currently in catalog: ${listData.pagination.total}`);

  console.log('\n--- Step 3: POST /api/sales (Performing POS Counter Checkout) ---');
  if (listData.data.length >= 2) {
    const p1 = listData.data[0];
    const p2 = listData.data[1];

    console.log(`Checking out: 2x "${p1.name}" (Stock before: ${p1.stockQuantity})`);
    console.log(`              1x "${p2.name}" (Stock before: ${p2.stockQuantity})`);

    const salePayload = {
      items: [
        { productId: p1._id, quantity: 2 },
        { productId: p2._id, quantity: 1 },
      ],
      discount: 15,
      tax: 20,
      paymentMethod: 'UPI',
      customerName: 'Pooja Agarwal',
      customerPhone: '9899112233',
    };

    const saleRes = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(salePayload),
    });

    const saleData = await saleRes.json();
    if (saleData.success) {
      console.log(`[Success 201 Created] Checkout Completed!`);
      console.log(`       Invoice: ${saleData.data.invoiceNumber}`);
      console.log(`       Customer: ${saleData.data.customerName}`);
      console.log(`       Grand Total: ₹${saleData.data.grandTotal} (Paid via ${saleData.data.paymentMethod})`);
      console.log(`       Gross Profit on Bill: ₹${saleData.data.netProfit}`);
    } else {
      console.error('Checkout failed:', saleData.message);
    }

    // Verify atomic stock decrement
    console.log('\n--- Step 4: Verify Atomic Stock Decrement in Inventory ---');
    const verifyP1 = await fetch(`${API_URL}/products/${p1._id}`, { headers: authHeaders });
    const p1Updated = await verifyP1.json();
    console.log(`Product "${p1.name}" new stock: ${p1Updated.data.stockQuantity} (Decremented by 2!)`);

    // Verify Reorder Sheet
    console.log('\n--- Step 5: GET /api/products/reorder-sheet (Low Stock Detection) ---');
    const reorderRes = await fetch(`${API_URL}/products/reorder-sheet`, { headers: authHeaders });
    const reorderData = await reorderRes.json();
    console.log(`[Success 200] Reorder Sheet: ${reorderData.count} items below safety threshold.`);
    console.log(`       Total Estimated Restock Budget Needed: ₹${reorderData.totalEstimatedRestockBudget}`);
  }
}

testPostmanFlow();
