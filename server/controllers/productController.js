import { Product } from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      stockStatus = 'ALL',
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = { user: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { sku: regex }, { supplier: regex }];
    }

    // Dynamic stock status filter
    if (stockStatus === 'OUT_OF_STOCK') {
      query.stockQuantity = 0;
    } else if (stockStatus === 'LOW_STOCK') {
      // stockQuantity <= minThreshold AND stockQuantity > 0
      query.$expr = {
        $and: [
          { $lte: ['$stockQuantity', '$minThreshold'] },
          { $gt: ['$stockQuantity', 0] },
        ],
      };
    } else if (stockStatus === 'IN_STOCK') {
      query.$expr = {
        $gt: ['$stockQuantity', '$minThreshold'],
      };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const limitNum = parseInt(limit, 10) || 50;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      costPrice,
      sellingPrice,
      stockQuantity,
      minThreshold,
      unit,
      supplier,
      shelfLocation,
      description,
    } = req.body;

    if (!name || !costPrice || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Name, Cost Price, and Selling Price are required.',
      });
    }

    // Auto-generate SKU if omitted (e.g. SKU-10492)
    const finalSku = sku?.trim().toUpperCase() || `SKU-${Date.now().toString().slice(-6)}`;

    // Check SKU duplicate for this store
    const existingSku = await Product.findOne({ user: req.user._id, sku: finalSku });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU "${finalSku}" already exists in your inventory.`,
      });
    }

    const product = await Product.create({
      user: req.user._id,
      name: name.trim(),
      sku: finalSku,
      category: category || 'Grocery & Staples',
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      minThreshold: parseInt(minThreshold, 10) || 5,
      unit: unit || 'pcs',
      supplier: supplier?.trim() || 'Wholesale Supplier',
      shelfLocation: shelfLocation?.trim() || 'Aisle 1',
      description: description?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied.',
      });
    }

    const {
      name,
      sku,
      category,
      costPrice,
      sellingPrice,
      stockQuantity,
      minThreshold,
      unit,
      supplier,
      shelfLocation,
      description,
    } = req.body;

    if (name) product.name = name.trim();
    if (sku) product.sku = sku.trim().toUpperCase();
    if (category) product.category = category;
    if (costPrice !== undefined) product.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = parseFloat(sellingPrice);
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (minThreshold !== undefined) product.minThreshold = parseInt(minThreshold, 10);
    if (unit) product.unit = unit;
    if (supplier !== undefined) product.supplier = supplier.trim();
    if (shelfLocation !== undefined) product.shelfLocation = shelfLocation.trim();
    if (description !== undefined) product.description = description.trim();

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Product "${product.name}" removed from inventory.`,
    });
  } catch (err) {
    next(err);
  }
};

export const restockProduct = async (req, res, next) => {
  try {
    const { additionalStock, newCostPrice } = req.body;
    const qty = parseInt(additionalStock, 10);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional restock quantity must be a positive integer.',
      });
    }

    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    product.stockQuantity += qty;
    if (newCostPrice && parseFloat(newCostPrice) > 0) {
      product.costPrice = parseFloat(newCostPrice);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: `Restocked ${qty} units of "${product.name}". Total available: ${product.stockQuantity}.`,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const getReorderSheet = async (req, res, next) => {
  try {
    // Find all products where stockQuantity <= minThreshold
    const lowStockProducts = await Product.find({
      user: req.user._id,
      $expr: { $lte: ['$stockQuantity', '$minThreshold'] },
    }).sort({ stockQuantity: 1 });

    const reorderList = lowStockProducts.map((p) => {
      // Suggest ordering enough to reach 2x safety stock threshold or at least 15 units
      const targetStock = Math.max(15, p.minThreshold * 2);
      const suggestedOrderQty = Math.max(5, targetStock - p.stockQuantity);
      const estimatedCost = suggestedOrderQty * p.costPrice;

      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.stockQuantity,
        minThreshold: p.minThreshold,
        unit: p.unit,
        costPrice: p.costPrice,
        supplier: p.supplier,
        suggestedOrderQty,
        estimatedCost,
      };
    });

    const totalEstimatedRestockBudget = reorderList.reduce(
      (sum, item) => sum + item.estimatedCost,
      0
    );

    res.status(200).json({
      success: true,
      count: reorderList.length,
      totalEstimatedRestockBudget,
      data: reorderList,
    });
  } catch (err) {
    next(err);
  }
};
