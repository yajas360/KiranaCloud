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

    const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

    res.status(200).json({
      success: true,
      count: customers.length,
      totalOutstandingCredit,
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

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required.',
      });
    }

    const existing = await Customer.findOne({ user: req.user._id, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists.',
      });
    }

    const customer = await Customer.create({
      user: req.user._id,
      name: name.trim(),
      phone: phone.trim(),
      creditLimit: parseFloat(creditLimit) || 5000,
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

    customer.balance = Math.max(0, customer.balance - paymentAmount);
    customer.history.push({
      type: 'PAYMENT',
      amount: paymentAmount,
      notes: notes.trim(),
      date: new Date(),
    });

    await customer.save();

    res.status(200).json({
      success: true,
      message: `Payment of ₹${paymentAmount.toFixed(2)} recorded. New balance: ₹${customer.balance.toFixed(2)}.`,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};
