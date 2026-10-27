import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Customer } from '../models/Customer.js';

dotenv.config();

export const seedStoreData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing previous demo data...');
    const demoEmail = 'owner@kiranacloud.com';
    const existingUser = await User.findOne({ email: demoEmail });

    if (existingUser) {
      await Product.deleteMany({ user: existingUser._id });
      await Sale.deleteMany({ user: existingUser._id });
      await Customer.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    console.log('[Seed] Creating demo store owner...');
    const user = await User.create({
      name: 'Aman Verma',
      email: demoEmail,
      password: 'password123',
      storeName: 'Aman Supermarket & Daily Needs',
      storeAddress: 'Shop #12, Central Plaza, Main Market, MG Road',
      storePhone: '9811234567',
      role: 'owner',
      currency: 'INR',
      currencySymbol: '₹',
      taxRate: 5,
      geminiApiKey: process.env.GEMINI_API_KEY || '',
    });

    console.log('[Seed] Populating store inventory catalog...');
    const products = [
      {
        user: user._id,
        name: 'Amul Taaza Toned Milk (1L)',
        sku: 'MILK-AMUL-1L',
        category: 'Dairy & Bakery',
        costPrice: 50,
        sellingPrice: 56,
        stockQuantity: 4, // LOW STOCK (threshold 10)
        minThreshold: 10,
        unit: 'packet',
        supplier: 'Amul Dairy Distro',
        shelfLocation: 'Chiller 1',
      },
      {
        user: user._id,
        name: 'Aashirvaad Shudh Chakki Atta (5kg)',
        sku: 'ATTA-AASH-5K',
        category: 'Grocery & Staples',
        costPrice: 220,
        sellingPrice: 255,
        stockQuantity: 18,
        minThreshold: 5,
        unit: 'packet',
        supplier: 'ITC Wholesale',
        shelfLocation: 'Aisle 3, Rack A',
      },
      {
        user: user._id,
        name: 'Fortune Sunlite Refined Oil (1L)',
        sku: 'OIL-FORT-1L',
        category: 'Grocery & Staples',
        costPrice: 125,
        sellingPrice: 145,
        stockQuantity: 2, // CRITICAL LOW STOCK
        minThreshold: 8,
        unit: 'packet',
        supplier: 'Adani Wilmar Distro',
        shelfLocation: 'Aisle 2, Rack B',
      },
      {
        user: user._id,
        name: 'Tata Salt Vacuum Evaporated (1kg)',
        sku: 'SALT-TATA-1K',
        category: 'Grocery & Staples',
        costPrice: 22,
        sellingPrice: 28,
        stockQuantity: 45,
        minThreshold: 10,
        unit: 'packet',
        supplier: 'Tata Consumer Supplies',
        shelfLocation: 'Aisle 1, Rack C',
      },
      {
        user: user._id,
        name: 'Maggi 2-Minute Masala Noodles (Pack of 4)',
        sku: 'MAGG-NOOD-4P',
        category: 'Snacks & Packaged Foods',
        costPrice: 52,
        sellingPrice: 60,
        stockQuantity: 32,
        minThreshold: 12,
        unit: 'packet',
        supplier: 'Nestle India Agency',
        shelfLocation: 'Aisle 4, Rack A',
      },
      {
        user: user._id,
        name: 'Amul Salted Butter (500g)',
        sku: 'BUTR-AMUL-500G',
        category: 'Dairy & Bakery',
        costPrice: 245,
        sellingPrice: 275,
        stockQuantity: 0, // OUT OF STOCK
        minThreshold: 6,
        unit: 'packet',
        supplier: 'Amul Dairy Distro',
        shelfLocation: 'Chiller 1',
      },
      {
        user: user._id,
        name: 'Parle-G Gold Biscuits (1kg)',
        sku: 'BISC-PARL-1K',
        category: 'Snacks & Packaged Foods',
        costPrice: 85,
        sellingPrice: 100,
        stockQuantity: 24,
        minThreshold: 8,
        unit: 'packet',
        supplier: 'Parle Distro',
        shelfLocation: 'Aisle 4, Rack B',
      },
      {
        user: user._id,
        name: 'Coca Cola Soft Drink Bottle (750ml)',
        sku: 'COKE-BTL-750M',
        category: 'Beverages & Juices',
        costPrice: 32,
        sellingPrice: 40,
        stockQuantity: 28,
        minThreshold: 10,
        unit: 'pcs',
        supplier: 'Hindustan Coca-Cola',
        shelfLocation: 'Beverage Refrigerator',
      },
      {
        user: user._id,
        name: 'Surf Excel Quick Wash Detergent (1kg)',
        sku: 'DETR-SURF-1K',
        category: 'Household & Cleaning',
        costPrice: 165,
        sellingPrice: 195,
        stockQuantity: 15,
        minThreshold: 6,
        unit: 'packet',
        supplier: 'Hindustan Unilever Ltd',
        shelfLocation: 'Aisle 5, Rack B',
      },
      {
        user: user._id,
        name: 'Dettol Original Germ Protection Soap (4x125g)',
        sku: 'SOAP-DETT-4P',
        category: 'Personal Care',
        costPrice: 140,
        sellingPrice: 168,
        stockQuantity: 14,
        minThreshold: 5,
        unit: 'box',
        supplier: 'Reckitt Benckiser',
        shelfLocation: 'Aisle 5, Rack A',
      },
      {
        user: user._id,
        name: 'Colgate Strong Teeth Toothpaste (200g)',
        sku: 'PAST-COLG-200G',
        category: 'Personal Care',
        costPrice: 95,
        sellingPrice: 115,
        stockQuantity: 3, // LOW STOCK
        minThreshold: 8,
        unit: 'pcs',
        supplier: 'Colgate-Palmolive',
        shelfLocation: 'Aisle 5, Rack A',
      },
      {
        user: user._id,
        name: 'Classmate Long Notebook (Ruled, 140 pgs)',
        sku: 'BOOK-CLAS-140R',
        category: 'Stationery & General',
        costPrice: 50,
        sellingPrice: 65,
        stockQuantity: 50,
        minThreshold: 10,
        unit: 'pcs',
        supplier: 'ITC Education Stationery',
        shelfLocation: 'Stationery Stand',
      },
    ];

    const savedProducts = await Product.insertMany(products);

    console.log('[Seed] Populating customer Khata ledger...');
    const customer1 = await Customer.create({
      user: user._id,
      name: 'Ramesh Kumar',
      phone: '9876543210',
      balance: 1450,
      creditLimit: 5000,
      history: [
        {
          type: 'PURCHASE',
          amount: 1450,
          invoiceNumber: 'INV-0001',
          notes: 'Monthly staples on credit',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    const customer2 = await Customer.create({
      user: user._id,
      name: 'Sunita Devi',
      phone: '9812345678',
      balance: 620,
      creditLimit: 3000,
      history: [
        {
          type: 'PURCHASE',
          amount: 620,
          invoiceNumber: 'INV-0002',
          notes: 'Milk & grocery purchase',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log('[Seed] Generating sample historical sales...');
    const now = new Date();

    // Sale 1: Yesterday
    await Sale.create({
      user: user._id,
      invoiceNumber: 'INV-0001',
      items: [
        {
          product: savedProducts[1]._id,
          name: savedProducts[1].name,
          sku: savedProducts[1].sku,
          costPrice: savedProducts[1].costPrice,
          sellingPrice: savedProducts[1].sellingPrice,
          quantity: 2,
          unit: savedProducts[1].unit,
          total: 510,
        },
        {
          product: savedProducts[4]._id,
          name: savedProducts[4].name,
          sku: savedProducts[4].sku,
          costPrice: savedProducts[4].costPrice,
          sellingPrice: savedProducts[4].sellingPrice,
          quantity: 3,
          unit: savedProducts[4].unit,
          total: 180,
        },
      ],
      subtotal: 690,
      discount: 20,
      tax: 33.5,
      grandTotal: 703.5,
      totalCost: 596,
      netProfit: 87.5,
      paymentMethod: 'UPI',
      amountTendered: 703.5,
      changeDue: 0,
      customerName: 'Priya Sharma',
      customerPhone: '9822334455',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    // Sale 2: Today morning
    await Sale.create({
      user: user._id,
      invoiceNumber: 'INV-0002',
      items: [
        {
          product: savedProducts[0]._id,
          name: savedProducts[0].name,
          sku: savedProducts[0].sku,
          costPrice: savedProducts[0].costPrice,
          sellingPrice: savedProducts[0].sellingPrice,
          quantity: 3,
          unit: savedProducts[0].unit,
          total: 168,
        },
        {
          product: savedProducts[3]._id,
          name: savedProducts[3].name,
          sku: savedProducts[3].sku,
          costPrice: savedProducts[3].costPrice,
          sellingPrice: savedProducts[3].sellingPrice,
          quantity: 1,
          unit: savedProducts[3].unit,
          total: 28,
        },
        {
          product: savedProducts[7]._id,
          name: savedProducts[7].name,
          sku: savedProducts[7].sku,
          costPrice: savedProducts[7].costPrice,
          sellingPrice: savedProducts[7].sellingPrice,
          quantity: 2,
          unit: savedProducts[7].unit,
          total: 80,
        },
      ],
      subtotal: 276,
      discount: 0,
      tax: 13.8,
      grandTotal: 289.8,
      totalCost: 236,
      netProfit: 53.8,
      paymentMethod: 'Cash',
      amountTendered: 300,
      changeDue: 10.2,
      customerName: 'Walk-in Customer',
      customerPhone: '',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0),
    });

    // Sale 3: Today afternoon
    await Sale.create({
      user: user._id,
      invoiceNumber: 'INV-0003',
      items: [
        {
          product: savedProducts[8]._id,
          name: savedProducts[8].name,
          sku: savedProducts[8].sku,
          costPrice: savedProducts[8].costPrice,
          sellingPrice: savedProducts[8].sellingPrice,
          quantity: 1,
          unit: savedProducts[8].unit,
          total: 195,
        },
        {
          product: savedProducts[9]._id,
          name: savedProducts[9].name,
          sku: savedProducts[9].sku,
          costPrice: savedProducts[9].costPrice,
          sellingPrice: savedProducts[9].sellingPrice,
          quantity: 1,
          unit: savedProducts[9].unit,
          total: 168,
        },
      ],
      subtotal: 363,
      discount: 15,
      tax: 17.4,
      grandTotal: 365.4,
      totalCost: 305,
      netProfit: 45.4,
      paymentMethod: 'UPI',
      amountTendered: 365.4,
      changeDue: 0,
      customerName: 'Vikram Singh',
      customerPhone: '9871122334',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 15, 0),
    });

    console.log('[Seed] Done! Demo store owner ready:');
    console.log('       Email:    owner@kiranacloud.com');
    console.log('       Password: password123');

    return user;
  } catch (err) {
    console.error('[Seed] Error seeding store data:', err);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedStoreData().then(() => {
    disconnectDB().then(() => process.exit(0));
  });
}
