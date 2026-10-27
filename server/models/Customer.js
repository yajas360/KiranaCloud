import mongoose from 'mongoose';

const creditHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PURCHASE', 'PAYMENT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters long'],
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) =>
          `"${props.value}" is not a valid 10-digit phone number. Must be exactly 10 digits.`,
      },
    },
    balance: {
      type: Number, // Total outstanding credit owed to store
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    creditLimit: {
      type: Number,
      default: 5000,
      min: [0, 'Credit limit cannot be negative'],
      max: [500000, 'Credit limit cannot exceed ₹5,00,000'],
    },
    history: {
      type: [creditHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ user: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
