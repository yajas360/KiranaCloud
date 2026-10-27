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
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      index: true,
    },
    balance: {
      type: Number, // Total outstanding credit owed to store
      default: 0,
      min: 0,
    },
    creditLimit: {
      type: Number,
      default: 5000,
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
