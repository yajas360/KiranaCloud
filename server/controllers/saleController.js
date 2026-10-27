import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';

export const createSale = async (req, res, next) => {
  try {
    const {
      items = [],
      discount = 0,
      tax = 0,
      paymentMethod = 'Cash',
      amountTendered = 0,
      customerName = 'Walk-in Customer',
      customerPhone = '',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty. Add at least one product to checkout.',
      });
    }

    if (parseFloat(discount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount cannot be negative.',
      });
    }

    // 1. Validate all items & stock availability upfront
    const saleItems = [];
    let subtotal = 0;
    let totalCost = 0;

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        user: req.user._id,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found in inventory.`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product "${product.name}".`,
        });
      }

      // Check stock availability
      if (product.stockQuantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stockQuantity} ${product.unit} available.`,
        });
      }

      const itemTotal = product.sellingPrice * qty;
      const itemCost = product.costPrice * qty;

      subtotal += itemTotal;
      totalCost += itemCost;

      saleItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        quantity: qty,
        unit: product.unit,
        total: itemTotal,
      });
    }

    // 2. Compute bill math upfront
    const maxAllowedDiscount = Math.round(subtotal * 0.5 * 100) / 100;
    const rawDiscount = parseFloat(discount) || 0;

    if (rawDiscount > maxAllowedDiscount) {
      return res.status(400).json({
        success: false,
        message: `Discount cannot exceed 50% of the bill value (Maximum allowed: ${maxAllowedDiscount}).`,
      });
    }

    const numDiscount = Math.min(maxAllowedDiscount, Math.max(0, rawDiscount));
    const numTax = Math.max(0, parseFloat(tax) || 0);
    const grandTotal = Math.max(0, subtotal - numDiscount + numTax);
    const netProfit = (subtotal - numDiscount) - totalCost;

    const numTendered = parseFloat(amountTendered) || grandTotal;
    const changeDue = Math.max(0, numTendered - grandTotal);

    // 3. Khata Credit validation upfront (before decrementing inventory stock)
    let khataCustomer = null;
    if (paymentMethod === 'Credit') {
      if (!customerPhone || !customerPhone.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Customer phone number is required to record a Khata credit purchase.',
        });
      }

      khataCustomer = await Customer.findOne({
        user: req.user._id,
        phone: customerPhone.trim(),
      });

      if (!khataCustomer) {
        return res.status(404).json({
          success: false,
          customerNotFound: true,
          message: `Customer with phone "${customerPhone.trim()}" is not registered in your Khata Ledger. Credit sales are only allowed for pre-registered Khata accounts.`,
        });
      }

      const currentBalance = khataCustomer.balance || 0;
      const creditLimit = khataCustomer.creditLimit || 5000;
      const projectedDebt = currentBalance + grandTotal;

      if (projectedDebt > creditLimit && !req.body.overrideCreditLimit) {
        return res.status(400).json({
          success: false,
          creditLimitExceeded: true,
          message: `Customer credit limit of ₹${creditLimit} exceeded! Current debt: ₹${currentBalance}. Adding ₹${grandTotal} reaches ₹${projectedDebt} (₹${projectedDebt - creditLimit} over limit).`,
          creditLimit,
          currentBalance,
          projectedDebt,
          excess: projectedDebt - creditLimit,
        });
      }
    }

    // 4. Decrement stock for all items
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    // 5. Sequential / timestamped Invoice Number
    const count = await Sale.countDocuments({ user: req.user._id });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    // 6. Update Customer Khata Credit ledger
    if (paymentMethod === 'Credit' && khataCustomer) {
      khataCustomer.balance += grandTotal;
      khataCustomer.history.push({
        type: 'PURCHASE',
        amount: grandTotal,
        invoiceNumber,
        notes: 'Credit sale at Billing Counter',
        date: new Date(),
      });
      await khataCustomer.save();
    }

    // 5. Create Sale Record
    const sale = await Sale.create({
      user: req.user._id,
      invoiceNumber,
      items: saleItems,
      subtotal,
      discount: numDiscount,
      tax: numTax,
      grandTotal,
      totalCost,
      netProfit,
      paymentMethod,
      amountTendered: numTendered,
      changeDue,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone?.trim() || '',
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Sale completed! Invoice ${invoiceNumber} generated.`,
      data: {
        ...sale.toObject(),
        store: {
          storeName: req.user.storeName,
          storeAddress: req.user.storeAddress,
          storePhone: req.user.storePhone,
          currencySymbol: req.user.currencySymbol || '₹',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      paymentMethod,
      startDate,
      endDate,
    } = req.query;

    const query = { user: req.user._id };

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ invoiceNumber: regex }, { customerName: regex }, { customerPhone: regex }];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
      Sale.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: sales,
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

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, user: req.user._id });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...sale.toObject(),
        store: {
          storeName: req.user.storeName,
          storeAddress: req.user.storeAddress,
          storePhone: req.user.storePhone,
          currencySymbol: req.user.currencySymbol || '₹',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const voidSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, user: req.user._id });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found.',
      });
    }

    if (sale.status === 'VOIDED') {
      return res.status(400).json({
        success: false,
        message: 'This sale has already been cancelled/voided.',
      });
    }

    // 1. Restore stock quantities
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    // 2. Revert credit balance if it was a Credit sale
    if (sale.paymentMethod === 'Credit' && sale.customerPhone) {
      const customer = await Customer.findOne({ user: req.user._id, phone: sale.customerPhone });
      if (customer) {
        customer.balance = Math.max(0, customer.balance - sale.grandTotal);
        customer.history.push({
          type: 'PAYMENT',
          amount: sale.grandTotal,
          invoiceNumber: sale.invoiceNumber,
          notes: 'Automatic reversal on voided sale',
          date: new Date(),
        });
        await customer.save();
      }
    }

    sale.status = 'VOIDED';
    await sale.save();

    res.status(200).json({
      success: true,
      message: `Invoice ${sale.invoiceNumber} has been voided and stock has been restored.`,
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};
