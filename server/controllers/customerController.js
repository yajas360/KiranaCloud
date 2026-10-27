import { Customer } from '../models/Customer.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { user: req.user._id };

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { phone: regex }];
    }

    const customers = await Customer.find(query).sort({ balance: -1, updatedAt: -1 });

    const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
    const totalAdvanceCredit = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

    res.status(200).json({
      success: true,
      count: customers.length,
      totalOutstandingCredit,
      totalAdvanceCredit,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, creditLimit = 5000 } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required and must be at least 2 characters long.',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number is required.',
      });
    }

    // Sanitize phone to digits (support raw 10 digits, +91-prefix, or leading 0)
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    // Validate 10-digit phone number format (any 10 digits)
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be a valid 10-digit number.',
      });
    }

    // Validate credit limit
    const parsedLimit = parseFloat(creditLimit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit limit must be a valid non-negative number.',
      });
    }

    if (parsedLimit > 500000) {
      return res.status(400).json({
        success: false,
        message: 'Credit limit cannot exceed ₹5,00,000.',
      });
    }

    const existing = await Customer.findOne({ user: req.user._id, phone: cleanPhone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A customer with phone number ${cleanPhone} already exists (${existing.name}).`,
      });
    }

    const customer = await Customer.create({
      user: req.user._id,
      name: name.trim(),
      phone: cleanPhone,
      creditLimit: parsedLimit,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { amount, notes = 'Cash settlement' } = req.body;
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number.',
      });
    }

    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const previousBalance = customer.balance || 0;
    // Overpaying stores excess as negative balance (advance store credit for future bills)
    customer.balance = Math.round((previousBalance - paymentAmount) * 100) / 100;

    let noteText = (notes || '').trim();
    if (previousBalance > 0 && paymentAmount > previousBalance) {
      const overpaid = Math.round((paymentAmount - previousBalance) * 100) / 100;
      noteText = `${noteText ? noteText + ' • ' : ''}Cleared ₹${previousBalance.toFixed(2)} debt + ₹${overpaid.toFixed(2)} saved as Advance Store Credit`;
    } else if (previousBalance <= 0) {
      noteText = `${noteText ? noteText + ' • ' : ''}Added ₹${paymentAmount.toFixed(2)} to Advance Store Credit`;
    }

    customer.history.push({
      type: 'PAYMENT',
      amount: paymentAmount,
      notes: noteText || 'Cash settlement',
      date: new Date(),
    });

    await customer.save();

    let message = '';
    if (customer.balance < 0) {
      message = `Payment of ₹${paymentAmount.toFixed(2)} recorded! Customer has an Advance Store Credit of ₹${Math.abs(customer.balance).toFixed(2)} saved for future bills.`;
    } else if (customer.balance === 0) {
      message = `Payment of ₹${paymentAmount.toFixed(2)} recorded! All outstanding debt fully cleared (₹0.00).`;
    } else {
      message = `Payment of ₹${paymentAmount.toFixed(2)} recorded. Remaining debt: ₹${customer.balance.toFixed(2)}.`;
    }

    res.status(200).json({
      success: true,
      message,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or already deleted.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Customer account "${customer.name}" deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
