import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'kiranacloud_super_secret_jwt_key_2026_production',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        storeAddress: user.storeAddress,
        storePhone: user.storePhone,
        role: user.role,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        taxRate: user.taxRate,
      },
    });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, storeName, storePhone, storeAddress } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A store account with this email address already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      storeName: storeName?.trim() || 'My Superstore',
      storePhone: storePhone?.trim() || '+91 98765 43210',
      storeAddress: storeAddress?.trim() || 'Main Market Road',
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      storeName: req.user.storeName,
      storeAddress: req.user.storeAddress,
      storePhone: req.user.storePhone,
      role: req.user.role,
      currency: req.user.currency,
      currencySymbol: req.user.currencySymbol,
      taxRate: req.user.taxRate,
    },
  });
};

export const updateStoreProfile = async (req, res, next) => {
  try {
    const { name, storeName, storePhone, storeAddress, taxRate, currency, currencySymbol } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (storeName) user.storeName = storeName.trim();
    if (storePhone) user.storePhone = storePhone.trim();
    if (storeAddress) user.storeAddress = storeAddress.trim();
    if (taxRate !== undefined) user.taxRate = parseFloat(taxRate) || 0;
    if (currency) user.currency = currency.toUpperCase();
    if (currencySymbol) user.currencySymbol = currencySymbol;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Store settings updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        storeAddress: user.storeAddress,
        storePhone: user.storePhone,
        taxRate: user.taxRate,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
      },
    });
  } catch (err) {
    next(err);
  }
};
