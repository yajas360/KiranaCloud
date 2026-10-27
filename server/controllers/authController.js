import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Owner name cannot be empty or only spaces.',
      });
    }

    if (!storeName || storeName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Store name cannot consist only of spaces. It must contain at least one valid character.',
      });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot consist only of spaces. It must contain at least 6 valid characters.',
      });
    }

    if (storePhone && !/^\d{10}$/.test(storePhone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Store phone number must be exactly 10 digits.',
      });
    }

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
      storeName: storeName.trim(),
      storePhone: storePhone?.trim() || '9876543210',
      storeAddress: storeAddress?.trim() || 'Main Market Road',
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, identifier: rawId, password } = req.body;
    const identifier = (email || rawId || '').trim();

    if (!identifier || identifier.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address or 10-digit phone number.',
      });
    }

    if (!password || password.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot consist only of spaces. Please enter a valid password.',
      });
    }

    const isPhone = /^\d{10}$/.test(identifier);
    const query = isPhone
      ? { $or: [{ storePhone: identifier }, { email: identifier.toLowerCase() }] }
      : { email: identifier.toLowerCase() };

    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.',
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
  const user = await User.findById(req.user._id).select('+geminiApiKey');
  const storedKey = user?.geminiApiKey || '';
  const envKey = process.env.GEMINI_API_KEY || '';
  const activeKey = storedKey || envKey;

  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      storeName: user.storeName,
      storeAddress: user.storeAddress,
      storePhone: user.storePhone,
      role: user.role,
      currency: user.currency,
      currencySymbol: user.currencySymbol,
      taxRate: user.taxRate,
      hasGeminiApiKey: Boolean(activeKey),
      geminiKeyMasked: activeKey ? `••••••••${activeKey.slice(-4)}` : '',
    },
  });
};

export const updateStoreProfile = async (req, res, next) => {
  try {
    const { name, storeName, storePhone, storeAddress, taxRate, currency, currencySymbol, geminiApiKey } = req.body;
    const user = await User.findById(req.user._id).select('+geminiApiKey');

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Owner name cannot be empty or only spaces.',
        });
      }
      user.name = name.trim();
    }

    if (storeName !== undefined) {
      if (storeName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Store name cannot consist only of spaces. It must contain at least one valid character.',
        });
      }
      user.storeName = storeName.trim();
    }

    if (storePhone !== undefined) {
      if (!/^\d{10}$/.test(storePhone.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Store phone number must be exactly 10 digits.',
        });
      }
      user.storePhone = storePhone.trim();
    }

    if (storeAddress) user.storeAddress = storeAddress.trim();
    if (taxRate !== undefined) user.taxRate = parseFloat(taxRate) || 0;
    if (currency) user.currency = currency.toUpperCase();
    if (currencySymbol) user.currencySymbol = currencySymbol;
    if (geminiApiKey !== undefined) user.geminiApiKey = geminiApiKey.trim();

    await user.save();

    const activeKey = user.geminiApiKey || process.env.GEMINI_API_KEY || '';

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
        hasGeminiApiKey: Boolean(activeKey),
        geminiKeyMasked: activeKey ? `••••••••${activeKey.slice(-4)}` : '',
      },
    });
  } catch (err) {
    next(err);
  }
};
