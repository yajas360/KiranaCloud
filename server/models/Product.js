import mongoose from 'mongoose';

export const STORE_CATEGORIES = [
  'Grocery & Staples',
  'Dairy & Bakery',
  'Beverages & Juices',
  'Snacks & Packaged Foods',
  'Personal Care',
  'Household & Cleaning',
  'Fruits & Vegetables',
  'Stationery & General',
  'Other',
];

export const PRODUCT_UNITS = ['pcs', 'kg', 'gm', 'liter', 'ml', 'packet', 'box'];

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 120,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU / Barcode is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: STORE_CATEGORIES,
      default: 'Grocery & Staples',
      index: true,
    },
    costPrice: {
      type: Number, // Purchase price from wholesale supplier
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number, // Retail selling price (MRP/Retail)
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    minThreshold: {
      type: Number, // Safety stock alert trigger
      default: 5,
      min: [0, 'Minimum threshold cannot be negative'],
    },
    unit: {
      type: String,
      enum: PRODUCT_UNITS,
      default: 'pcs',
    },
    supplier: {
      type: String,
      trim: true,
      default: 'Local Wholesale Mandi',
    },
    shelfLocation: {
      type: String,
      trim: true,
      default: 'Aisle 1',
    },
    description: {
      type: String,
      maxlength: 300,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Stock Status
productSchema.virtual('status').get(function () {
  if (this.stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (this.stockQuantity <= this.minThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
});

// Virtual: Profit Margin per unit
productSchema.virtual('unitMargin').get(function () {
  return this.sellingPrice - this.costPrice;
});

productSchema.virtual('marginPercentage').get(function () {
  if (this.sellingPrice <= 0) return 0;
  return Math.round(((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100);
});

// Compound unique index: SKU per store user
productSchema.index({ user: 1, sku: 1 }, { unique: true });

export const Product = mongoose.model('Product', productSchema);
