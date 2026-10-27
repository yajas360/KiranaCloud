import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: 100,
      validate: {
        validator: function (v) {
          return v && v.trim().length > 0;
        },
        message: 'Name cannot consist only of spaces. It must contain at least one valid character.',
      },
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      validate: {
        validator: function (v) {
          return v && v.trim().length >= 6;
        },
        message: 'Password cannot consist only of spaces. It must contain at least 6 valid characters.',
      },
      select: false,
    },
    storeName: {
      type: String,
      default: 'Corner Mart & Superstore',
      trim: true,
      validate: {
        validator: function (v) {
          return v && v.trim().length > 0;
        },
        message: 'Store name cannot consist only of spaces. It must contain at least one valid character.',
      },
    },
    storeAddress: {
      type: String,
      default: 'Main Market Road, Sector 14',
    },
    storePhone: {
      type: String,
      default: '9876543210',
    },
    role: {
      type: String,
      enum: ['owner', 'cashier'],
      default: 'owner',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    taxRate: {
      type: Number, // Percentage, e.g. 5%
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
