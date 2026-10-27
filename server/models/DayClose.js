import mongoose from 'mongoose';

const dayCloseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
    },
    totalProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    totalBills: {
      type: Number,
      required: true,
      default: 0,
    },
    cashSales: {
      type: Number,
      default: 0,
    },
    upiSales: {
      type: Number,
      default: 0,
    },
    cardSales: {
      type: Number,
      default: 0,
    },
    creditSales: {
      type: Number,
      default: 0,
    },
    khataCollected: {
      type: Number,
      default: 0,
    },
    startingFloat: {
      type: Number,
      default: 0,
    },
    expectedCash: {
      type: Number,
      required: true,
      default: 0,
    },
    countedCash: {
      type: Number,
      required: true,
      default: 0,
    },
    difference: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['MATCHED', 'SHORTAGE', 'SURPLUS'],
      default: 'MATCHED',
    },
    notes: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const DayClose = mongoose.model('DayClose', dayCloseSchema);
